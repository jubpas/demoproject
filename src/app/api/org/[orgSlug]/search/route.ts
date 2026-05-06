import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

const MAX_RESULTS = 5;

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireOrganizationAccess(request);

    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return Response.json({
        projects: [],
        customers: [],
        quotations: [],
        tasks: [],
      });
    }

    const searchTerm = q.trim();

    const [projects, customers, quotations, tasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          organizationId: organization.id,
          OR: [
            { name: { contains: searchTerm } },
            { code: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
        take: MAX_RESULTS,
      }),

      prisma.customer.findMany({
        where: {
          organizationId: organization.id,
          OR: [
            { name: { contains: searchTerm } },
            { companyName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
        },
        take: MAX_RESULTS,
      }),

      prisma.quotation.findMany({
        where: {
          organizationId: organization.id,
          OR: [
            { quotationNumber: { contains: searchTerm } },
            { note: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          quotationNumber: true,
          note: true,
          status: true,
          customer: { select: { name: true } },
        },
        take: MAX_RESULTS,
      }),

      prisma.projectTask.findMany({
        where: {
          organizationId: organization.id,
          title: { contains: searchTerm },
        },
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { id: true, name: true, code: true } },
        },
        take: MAX_RESULTS,
      }),
    ]);

    return Response.json({
      projects,
      customers,
      quotations,
      tasks,
    });
  } catch (error) {
    console.error("GET /search error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
