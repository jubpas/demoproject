import { NextRequest, NextResponse } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

const DEFAULT_TAKE = 10;

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireOrganizationAccess(request);

    const url = new URL(request.url);
    const skip = Math.max(0, parseInt(url.searchParams.get("skip") || "0", 10) || 0);
    const take = Math.max(1, Math.min(50, parseInt(url.searchParams.get("take") || String(DEFAULT_TAKE), 10) || DEFAULT_TAKE));

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId: organization.id },
        include: {
          actor: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: take + 1, // fetch one extra to detect hasMore
      }),
      prisma.auditLog.count({
        where: { organizationId: organization.id },
      }),
    ]);

    const hasMore = logs.length > take;
    const resultLogs = hasMore ? logs.slice(0, take) : logs;

    return Response.json({
      logs: resultLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      hasMore,
      total: totalCount,
    });
  } catch (error) {
    console.error("GET /audit-logs error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
