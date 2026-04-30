import "server-only";

import type { OrganizationRole } from "@prisma/client";
import prisma from "@/lib/db";
import { isSuperAdminAccess } from "@/lib/system-access";

export const managerRoles: OrganizationRole[] = ["OWNER", "ADMIN", "MANAGER"];
export const budgetApprovalRoles: OrganizationRole[] = ["OWNER", "ADMIN"];
export const memberAdminRoles: OrganizationRole[] = ["OWNER", "ADMIN"];
export const projectTaskWriteRoles: OrganizationRole[] = ["OWNER", "ADMIN", "MANAGER"];
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

export async function getOrganizationScopedAccess(userId: string, orgSlug: string) {
  const [membership, user] = await Promise.all([
    getMembershipByOrgSlug(userId, orgSlug),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        systemRole: true,
      },
    }),
  ]);

  if (membership) {
    return {
      organization: membership.organization,
      membership,
      role: membership.role,
      isSuperAdmin: user ? isSuperAdminAccess(user) : false,
    };
  }

  if (!user || !isSuperAdminAccess(user)) {
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) {
    return null;
  }

  return {
    organization,
    membership: null,
    role: "OWNER" as const,
    isSuperAdmin: true,
  };
}

export function canManageOrganizationData(role: OrganizationRole) {
  return managerRoles.includes(role);
}

export function canManageOrganizationMembers(role: OrganizationRole) {
  return memberAdminRoles.includes(role);
}

export function canManageProjectTasks(role: OrganizationRole) {
  return projectTaskWriteRoles.includes(role);
}

export function canWriteTransactions(role: OrganizationRole) {
  return transactionWriteRoles.includes(role);
}

export function canApproveBudgetRequests(role: OrganizationRole) {
  return budgetApprovalRoles.includes(role);
}

export function getAssignableMemberRoles(role: OrganizationRole) {
  if (role === "OWNER") {
    return ["ADMIN", "MANAGER", "STAFF"];
  }

  if (role === "ADMIN") {
    return ["MANAGER", "STAFF"];
  }

  return [];
}

export function canAssignMemberRole(actorRole: OrganizationRole, targetRole: OrganizationRole) {
  return getAssignableMemberRoles(actorRole).includes(targetRole);
}
