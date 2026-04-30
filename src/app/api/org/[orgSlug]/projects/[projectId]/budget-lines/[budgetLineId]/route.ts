import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createApprovalRequest, shouldRequireBudgetApproval } from "@/lib/approvals";
import { createAuditLog, createBudgetRevision } from "@/lib/audit";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; projectId: string; budgetLineId: string }>;
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

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId, budgetLineId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        id: budgetLineId,
        projectId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingLine) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
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

    const conflictLine = await prisma.projectBudgetLine.findFirst({
      where: {
        projectId,
        budgetCategoryId,
        id: { not: budgetLineId },
      },
    });

    if (conflictLine) {
      return NextResponse.json({ error: "Budget line already exists for this category" }, { status: 400 });
    }

    const budgetCategory = budgetCategories.find((item) => item.id === budgetCategoryId);
    const amountDeltaInCents = Math.abs(plannedAmountInCents - existingLine.plannedAmountInCents);

    if (shouldRequireBudgetApproval(membership.role, amountDeltaInCents, membership.organization.approvalThresholdInCents)) {
      const approvalRequest = await createApprovalRequest({
        organizationId: membership.organizationId,
        projectId,
        requestedById: userId,
        entityType: "PROJECT_BUDGET_LINE",
        action: "UPDATE",
        summary: `Update budget line for ${budgetCategory?.name ?? "Unknown"}`,
        payload: {
          type: "UPDATE",
          projectId,
          budgetLineId: existingLine.id,
          budgetCategoryId,
          budgetCategoryName: budgetCategory?.name ?? "Unknown",
          plannedAmountInCents,
          previousAmountInCents: existingLine.plannedAmountInCents,
          note: typeof body?.note === "string" ? body.note.trim() || null : null,
        },
      });

      await createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId,
        entityType: "APPROVAL_REQUEST",
        entityId: approvalRequest.id,
        action: "CREATE",
        summary: `Requested approval to update budget line for ${budgetCategory?.name ?? "Unknown"}`,
        before: existingLine,
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

    const updatedLine = await prisma.projectBudgetLine.update({
      where: { id: existingLine.id },
      data: {
        budgetCategoryId,
        plannedAmountInCents,
        note: typeof body?.note === "string" ? body.note.trim() || null : null,
      },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: membership.organizationId,
        projectId,
        projectBudgetLineId: updatedLine.id,
        changedById: userId,
        action: "UPDATE",
        budgetCategoryName: budgetCategory?.name ?? "Unknown",
        previousAmountInCents: existingLine.plannedAmountInCents,
        newAmountInCents: updatedLine.plannedAmountInCents,
        note: updatedLine.note,
        reason: "Updated from project budget manager",
      }),
      createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: updatedLine.id,
        action: "UPDATE",
        summary: `Updated budget line for ${budgetCategory?.name ?? "Unknown"}`,
        before: existingLine,
        after: updatedLine,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update project budget line error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId, budgetLineId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        id: budgetLineId,
        projectId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingLine) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    const linkedTransactionsCount = await prisma.transaction.count({
      where: {
        organizationId: membership.organizationId,
        projectId,
        budgetCategoryId: existingLine.budgetCategoryId,
      },
    });

    if (linkedTransactionsCount > 0) {
      return NextResponse.json({ error: "This budget line cannot be deleted because transactions are already linked to it" }, { status: 400 });
    }

    const existingCategory = await prisma.budgetCategory.findUnique({
      where: { id: existingLine.budgetCategoryId },
      select: { name: true },
    });

    if (shouldRequireBudgetApproval(membership.role, existingLine.plannedAmountInCents, membership.organization.approvalThresholdInCents)) {
      const approvalRequest = await createApprovalRequest({
        organizationId: membership.organizationId,
        projectId,
        requestedById: userId,
        entityType: "PROJECT_BUDGET_LINE",
        action: "DELETE",
        summary: `Delete budget line for ${existingCategory?.name ?? "Unknown"}`,
        payload: {
          type: "DELETE",
          projectId,
          budgetLineId: existingLine.id,
          budgetCategoryId: existingLine.budgetCategoryId,
          budgetCategoryName: existingCategory?.name ?? "Unknown",
          previousAmountInCents: existingLine.plannedAmountInCents,
          note: existingLine.note,
        },
      });

      await createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId,
        entityType: "APPROVAL_REQUEST",
        entityId: approvalRequest.id,
        action: "CREATE",
        summary: `Requested approval to delete budget line for ${existingCategory?.name ?? "Unknown"}`,
        before: existingLine,
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

    await prisma.projectBudgetLine.delete({
      where: { id: existingLine.id },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: membership.organizationId,
        projectId,
        changedById: userId,
        action: "DELETE",
        budgetCategoryName: existingCategory?.name ?? "Unknown",
        previousAmountInCents: existingLine.plannedAmountInCents,
        note: existingLine.note,
        reason: "Deleted from project budget manager",
      }),
      createAuditLog({
        organizationId: membership.organizationId,
        actorId: userId,
        projectId,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: existingLine.id,
        action: "DELETE",
        summary: `Deleted budget line for ${existingCategory?.name ?? "Unknown"}`,
        before: existingLine,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project budget line error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
