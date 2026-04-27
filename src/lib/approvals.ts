import "server-only";

import type { ApprovalRequest, OrganizationRole } from "@prisma/client";
import prisma from "@/lib/db";
import { createAuditLog, createBudgetRevision } from "@/lib/audit";

export const BUDGET_APPROVAL_THRESHOLD_IN_CENTS = 100000 * 100;

export type BudgetApprovalPayload = {
  type: "CREATE" | "UPDATE" | "DELETE";
  projectId: string;
  budgetLineId?: string;
  budgetCategoryId: string;
  budgetCategoryName: string;
  plannedAmountInCents?: number;
  previousAmountInCents?: number;
  note?: string | null;
};

export function canApproveBudgetRequests(role: OrganizationRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function shouldRequireBudgetApproval(role: OrganizationRole, deltaInCents: number) {
  return !canApproveBudgetRequests(role) && deltaInCents >= BUDGET_APPROVAL_THRESHOLD_IN_CENTS;
}

export async function createApprovalRequest(input: {
  organizationId: string;
  projectId?: string | null;
  requestedById: string;
  entityType: string;
  action: string;
  summary: string;
  payload: BudgetApprovalPayload;
}) {
  return prisma.approvalRequest.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
      requestedById: input.requestedById,
      entityType: input.entityType,
      action: input.action,
      summary: input.summary,
      payloadJson: JSON.stringify(input.payload),
    },
  });
}

function parseBudgetApprovalPayload(request: ApprovalRequest) {
  const payload = JSON.parse(request.payloadJson) as BudgetApprovalPayload;
  return payload;
}

export async function approveBudgetApprovalRequest(request: ApprovalRequest, approverId: string) {
  const payload = parseBudgetApprovalPayload(request);

  if (request.entityType !== "PROJECT_BUDGET_LINE") {
    throw new Error("UNSUPPORTED_APPROVAL_ENTITY");
  }

  if (payload.type === "CREATE") {
    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        projectId: payload.projectId,
        budgetCategoryId: payload.budgetCategoryId,
        organizationId: request.organizationId,
      },
    });

    if (existingLine) {
      throw new Error("BUDGET_LINE_EXISTS");
    }

    const createdLine = await prisma.projectBudgetLine.create({
      data: {
        organizationId: request.organizationId,
        projectId: payload.projectId,
        budgetCategoryId: payload.budgetCategoryId,
        plannedAmountInCents: payload.plannedAmountInCents ?? 0,
        note: payload.note ?? null,
      },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: request.organizationId,
        projectId: payload.projectId,
        projectBudgetLineId: createdLine.id,
        changedById: approverId,
        action: "CREATE",
        budgetCategoryName: payload.budgetCategoryName,
        newAmountInCents: createdLine.plannedAmountInCents,
        note: createdLine.note,
        reason: `Approved request ${request.id}`,
      }),
      createAuditLog({
        organizationId: request.organizationId,
        actorId: approverId,
        projectId: payload.projectId,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: createdLine.id,
        action: "CREATE",
        summary: `Approved and created budget line for ${payload.budgetCategoryName}`,
        after: createdLine,
      }),
    ]);
  }

  if (payload.type === "UPDATE") {
    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        id: payload.budgetLineId,
        projectId: payload.projectId,
        organizationId: request.organizationId,
      },
    });

    if (!existingLine) {
      throw new Error("BUDGET_LINE_NOT_FOUND");
    }

    const conflictLine = await prisma.projectBudgetLine.findFirst({
      where: {
        projectId: payload.projectId,
        budgetCategoryId: payload.budgetCategoryId,
        id: { not: existingLine.id },
      },
    });

    if (conflictLine) {
      throw new Error("BUDGET_LINE_EXISTS");
    }

    const updatedLine = await prisma.projectBudgetLine.update({
      where: { id: existingLine.id },
      data: {
        budgetCategoryId: payload.budgetCategoryId,
        plannedAmountInCents: payload.plannedAmountInCents ?? existingLine.plannedAmountInCents,
        note: payload.note ?? null,
      },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: request.organizationId,
        projectId: payload.projectId,
        projectBudgetLineId: updatedLine.id,
        changedById: approverId,
        action: "UPDATE",
        budgetCategoryName: payload.budgetCategoryName,
        previousAmountInCents: existingLine.plannedAmountInCents,
        newAmountInCents: updatedLine.plannedAmountInCents,
        note: updatedLine.note,
        reason: `Approved request ${request.id}`,
      }),
      createAuditLog({
        organizationId: request.organizationId,
        actorId: approverId,
        projectId: payload.projectId,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: updatedLine.id,
        action: "UPDATE",
        summary: `Approved and updated budget line for ${payload.budgetCategoryName}`,
        before: existingLine,
        after: updatedLine,
      }),
    ]);
  }

  if (payload.type === "DELETE") {
    const existingLine = await prisma.projectBudgetLine.findFirst({
      where: {
        id: payload.budgetLineId,
        projectId: payload.projectId,
        organizationId: request.organizationId,
      },
    });

    if (!existingLine) {
      throw new Error("BUDGET_LINE_NOT_FOUND");
    }

    const linkedTransactionsCount = await prisma.transaction.count({
      where: {
        organizationId: request.organizationId,
        projectId: payload.projectId,
        budgetCategoryId: existingLine.budgetCategoryId,
      },
    });

    if (linkedTransactionsCount > 0) {
      throw new Error("BUDGET_LINE_DELETE_BLOCKED");
    }

    await prisma.projectBudgetLine.delete({
      where: { id: existingLine.id },
    });

    await Promise.all([
      createBudgetRevision({
        organizationId: request.organizationId,
        projectId: payload.projectId,
        changedById: approverId,
        action: "DELETE",
        budgetCategoryName: payload.budgetCategoryName,
        previousAmountInCents: existingLine.plannedAmountInCents,
        note: existingLine.note,
        reason: `Approved request ${request.id}`,
      }),
      createAuditLog({
        organizationId: request.organizationId,
        actorId: approverId,
        projectId: payload.projectId,
        entityType: "PROJECT_BUDGET_LINE",
        entityId: existingLine.id,
        action: "DELETE",
        summary: `Approved and deleted budget line for ${payload.budgetCategoryName}`,
        before: existingLine,
      }),
    ]);
  }

  const approvedRequest = await prisma.approvalRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      approvedById: approverId,
      respondedAt: new Date(),
    },
  });

  await createAuditLog({
    organizationId: request.organizationId,
    actorId: approverId,
    projectId: request.projectId,
    entityType: "APPROVAL_REQUEST",
    entityId: request.id,
    action: "APPROVE",
    summary: `Approved request ${request.summary}`,
    before: request,
    after: approvedRequest,
  });

  return approvedRequest;
}

export async function rejectBudgetApprovalRequest(request: ApprovalRequest, approverId: string, responseNote?: string | null) {
  const rejectedRequest = await prisma.approvalRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      approvedById: approverId,
      respondedAt: new Date(),
      responseNote: responseNote ?? null,
    },
  });

  await createAuditLog({
    organizationId: request.organizationId,
    actorId: approverId,
    projectId: request.projectId,
    entityType: "APPROVAL_REQUEST",
    entityId: request.id,
    action: "REJECT",
    summary: `Rejected request ${request.summary}`,
    before: request,
    after: rejectedRequest,
  });

  return rejectedRequest;
}
