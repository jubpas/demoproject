import "server-only";

import type { OrganizationRole } from "@prisma/client";
import prisma from "@/lib/db";

export const managerRoles: OrganizationRole[] = ["OWNER", "ADMIN", "MANAGER"];
export const budgetApprovalRoles: OrganizationRole[] = ["OWNER", "ADMIN"];
export const transactionWriteRoles: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "STAFF",
];

export async function getMembershipByOrgSlug(userId: string, orgSlug: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      organization: {
        slug: orgSlug,
      },
    },
    include: {
      organization: true,
    },
  });
}

export function canManageOrganizationData(role: OrganizationRole) {
  return managerRoles.includes(role);
}

export function canWriteTransactions(role: OrganizationRole) {
  return transactionWriteRoles.includes(role);
}

export function canApproveBudgetRequests(role: OrganizationRole) {
  return budgetApprovalRoles.includes(role);
}
