import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

function parseBudgetToCents(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseStatus(value: unknown) {
  return typeof value === "string" && value in ProjectStatus
    ? (value as ProjectStatus)
    : ProjectStatus.PLANNING;
}

function parseStatusParam(value: unknown): ProjectStatus | undefined {
  if (typeof value !== "string") return undefined;
  if (Object.values(ProjectStatus).includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  return undefined;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = typeof searchParams.get("search") === "string" ? searchParams.get("search")! : null;
    const sortBy = (typeof searchParams.get("sortBy") === "string" ? searchParams.get("sortBy")! : "createdAt") as
      | "name"
      | "createdAt"
      | "budgetInCents"
      | "status";
    const order = (typeof searchParams.get("order") === "string" ? searchParams.get("order")! : "desc") as "asc" | "desc";
    const statusFilter = parseStatusParam(searchParams.get("status"));
    const customerIdFilter = typeof searchParams.get("customerId") === "string" && searchParams.get("customerId")?.trim()
      ? searchParams.get("customerId")
      : null;

    const where: { organizationId: string; name?: { contains: string }; code?: { contains: string }; location?: { contains: string }; customerName?: { contains: string }; customerCompanyName?: { contains: string }; status?: ProjectStatus; customerId?: string | { not: null } } = {
      organizationId: membership.organizationId,
    };

    if (search) {
      where.name = { contains: search };
      where.code = { contains: search };
      where.location = { contains: search };
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (customerIdFilter) {
      where.customerId = customerIdFilter;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        budgetLines: { select: { budgetCategoryId: true, plannedAmountInCents: true } },
        _count: { select: { transactions: true, budgetLines: true } },
      },
    });

    const projectsWithDetails = projects.map((project) => {
      const totalPlanned = project.budgetLines.reduce((sum, line) => sum + line.plannedAmountInCents, 0);
      return {
        ...project,
        totalPlannedInCents: totalPlanned,
      };
    });

    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const customerId = typeof body?.customerId === "string" && body.customerId.trim() ? body.customerId : null;

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          organizationId: membership.organizationId,
        },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 400 });
      }
    }

    const project = await prisma.project.create({
      data: {
        organizationId: membership.organizationId,
        createdById: userId,
        name,
        code: body?.code?.trim() || null,
        customerId,
        location: body?.location?.trim() || null,
        budgetInCents: parseBudgetToCents(body?.budget),
        startDate: parseDate(body?.startDate),
        endDate: parseDate(body?.endDate),
        status: parseStatus(body?.status),
        description: body?.description?.trim() || null,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
