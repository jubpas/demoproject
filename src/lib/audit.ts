import "server-only";

import prisma from "@/lib/db";

function serialize(value: unknown) {
  return value === undefined ? null : JSON.stringify(value);
}

export async function createAuditLog(input: {
  organizationId: string;
  actorId: string;
  projectId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  before?: unknown;
  after?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      beforeJson: serialize(input.before),
      afterJson: serialize(input.after),
    },
  });
}

export async function createBudgetRevision(input: {
  organizationId: string;
  projectId: string;
  changedById: string;
  action: string;
  budgetCategoryName: string;
  previousAmountInCents?: number | null;
  newAmountInCents?: number | null;
  note?: string | null;
  reason?: string | null;
  projectBudgetLineId?: string | null;
}) {
  return prisma.budgetRevision.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      projectBudgetLineId: input.projectBudgetLineId ?? null,
      changedById: input.changedById,
      action: input.action,
      budgetCategoryName: input.budgetCategoryName,
      previousAmountInCents: input.previousAmountInCents ?? null,
      newAmountInCents: input.newAmountInCents ?? null,
      note: input.note ?? null,
      reason: input.reason ?? null,
    },
  });
}
