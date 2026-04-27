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
