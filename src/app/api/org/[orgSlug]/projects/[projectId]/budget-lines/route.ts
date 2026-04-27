import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createApprovalRequest, shouldRequireBudgetApproval } from "@/lib/approvals";
import { createAuditLog, createBudgetRevision } from "@/lib/audit";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; projectId: string }>;
};

function parseAmountToCents(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: membership.organizationId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const budgetCategoryId = typeof body?.budgetCategoryId === "string" && body.budgetCategoryId.trim() ? body.budgetCategoryId : null;
    const plannedAmountInCents = parseAmountToCents(body?.plannedAmount);

    if (!budgetCategoryId) {
      return NextResponse.json({ error: "Budget category is required" }, { status: 400 });
    }

    if (plannedAmountInCents === null) {
      return NextResponse.json({ error: "Planned amount is required" }, { status: 400 });
    }

    const budgetCategories = await ensureOrganizationBudgetCategories(membership.organizationId);
    if (!budgetCategories.some((item) => item.id === budgetCategoryId)) {
      return NextResponse.json({ error: "Budget category not found" }, { status: 400 });
    }

    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        projectId: project.id,
        budgetCategoryId,
      },
    });

    if (existingLine) {
      return NextResponse.json({ error: "Budget line already exists for this category" }, { status: 400 });
    }

    const budgetCategory = budgetCategories.find((item) => item.id === budgetCategoryId);

    if (shouldRequireBudgetApproval(membership.role, plannedAmountInCents)) {
      const approvalRequest = await createApprovalRequest({
        organizationId: membership.organizationId,
        projectId: project.id,
        requestedById: userId,
        entityType: "PROJECT_BUDGET_LINE",
        action: "CREATE",
        summary: `Create budget line for ${budgetCategory?.name ?? "Unknown"}`,
        payload: {
          type: "CREATE",
          projectId: project.id,
          budgetCategoryId,
          budgetCategoryName: budgetCategory?.name ?? "Unknown",
          plannedAmountInCents,
          note: typeof body?.note === "string" ? body.note.trim() || null : null,
        },
      });

      await createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId: project.id,
        entityType: "APPROVAL_REQUEST",
        entityId: approvalRequest.id,
        action: "CREATE",
        summary: `Requested approval to create budget line for ${budgetCategory?.name ?? "Unknown"}`,
        after: approvalRequest,
      });

      return NextResponse.json(
        {
          success: true,
          approvalRequired: true,
          message: "Budget approval request submitted",
        },
        { status: 202 },
      );
    }

    const createdLine = await prisma.projectBudgetLine.create({
      data: {
        organizationId: membership.organizationId,
        projectId: project.id,
        budgetCategoryId,
        plannedAmountInCents,
        note: typeof body?.note === "string" ? body.note.trim() || null : null,
      },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: membership.organizationId,
        projectId: project.id,
        projectBudgetLineId: createdLine.id,
        changedById: userId,
        action: "CREATE",
        budgetCategoryName: budgetCategory?.name ?? "Unknown",
        newAmountInCents: createdLine.plannedAmountInCents,
        note: createdLine.note,
        reason: "Created from project budget manager",
      }),
      createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId: project.id,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: createdLine.id,
        action: "CREATE",
        summary: `Created budget line for ${budgetCategory?.name ?? "Unknown"}`,
        after: createdLine,
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create project budget line error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
