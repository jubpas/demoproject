import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const teams = await prisma.workerTeam.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            workLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(teams);
  } catch (error) {
    console.error("GET /api/worker-teams error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return Response.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.workerTeam.create({
      data: {
        organizationId: organization.id,
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: membership.userId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeam",
        entityId: team.id,
        action: "CREATE",
        summary: `Worker team "${name.trim()}" created`,
        afterJson: JSON.stringify(team),
      },
    });

    return Response.json(team, { status: 201 });
  } catch (error) {
    console.error("POST /api/worker-teams error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
