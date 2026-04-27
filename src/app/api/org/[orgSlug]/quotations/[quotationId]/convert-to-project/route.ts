import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = { params: Promise<{ orgSlug: string; quotationId: string }> };

async function createProjectCode(organizationId: string) {
  const now = new Date();
  const prefix = `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.project.count({
    where: {
      organizationId,
      code: {
        startsWith: prefix,
      },
    },
  });

  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, quotationId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        id: quotationId,
        organizationId: membership.organizationId,
      },
      include: {
        customer: true,
        project: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.projectId) {
      return NextResponse.json({ success: true, projectId: quotation.projectId, existing: true });
    }

    const fallbackName = quotation.items[0]?.description?.trim();
    const projectName = fallbackName || `${quotation.customer.name} - ${quotation.quotationNumber}`;
    const projectCode = await createProjectCode(membership.organizationId);
    const projectDescriptionParts = [
      `สร้างจากใบเสนอราคา ${quotation.quotationNumber}`,
      quotation.note,
    ].filter(Boolean);

    const project = await prisma.project.create({
      data: {
        organizationId: membership.organizationId,
        customerId: quotation.customerId,
        createdById: userId,
        name: projectName,
        code: projectCode,
        description: projectDescriptionParts.join("\n\n") || null,
        budgetInCents: quotation.totalInCents,
      },
    });

    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        projectId: project.id,
      },
    });

    return NextResponse.json({ success: true, projectId: project.id, existing: false }, { status: 201 });
  } catch (error) {
    console.error("Convert quotation to project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
