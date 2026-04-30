import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import type { Locale } from "@/lib/locales";
import { isLocale, withLocale } from "@/lib/locales";
import { getMembershipByOrgSlug } from "@/lib/organization";
import { isSuperAdminAccess } from "@/lib/system-access";

export async function requireLocale(value: string) {
  if (!isLocale(value)) {
    notFound();
  }

  return value;
}

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      systemRole: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    systemRole: user.systemRole,
    isSuperAdmin: isSuperAdminAccess(user),
  };
});

export const getUserOrganizations = cache(async (userId: string) => {
  return prisma.membership.findMany({
    where: {
      userId,
      organization: {
        archivedAt: null,
      },
    },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
});

export async function getHomeRedirectPath(locale: Locale) {
  const user = await getCurrentUser();

  if (!user) {
    return withLocale(locale, "/login");
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    include: { lastOrganization: true },
  });

  const memberships = await getUserOrganizations(user.id);

  if (memberships.length === 0) {
    if (user.isSuperAdmin) {
      return withLocale(locale, "/admin");
    }

    return withLocale(locale, "/onboarding/create-organization");
  }

  const preferredOrg =
    preference?.lastOrganizationId
      ? memberships.find(
          ({ organizationId }) => organizationId === preference.lastOrganizationId,
        )?.organization
      : null;

  const targetOrganization = preferredOrg ?? memberships[0]?.organization;

  return withLocale(locale, `/org/${targetOrganization.slug}/dashboard`);
}

export async function requireOrganizationAccess(locale: Locale, orgSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(withLocale(locale, "/login"));
  }

  const membership = await getMembershipByOrgSlug(user.id, orgSlug);

  if (!membership && user.isSuperAdmin) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      notFound();
    }

    return {
      user,
      membership: {
        id: `super-admin:${organization.id}`,
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER" as const,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        organization,
      },
      organization,
    };
  }

  if (!membership) {
    redirect(await getHomeRedirectPath(locale));
  }

  if (membership.organization.archivedAt && !user.isSuperAdmin) {
    redirect(await getHomeRedirectPath(locale));
  }

  return {
    user,
    membership,
    organization: membership.organization,
  };
}

export async function requireSuperAdmin(locale: Locale) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(withLocale(locale, "/login"));
  }

  if (!user.isSuperAdmin) {
    redirect(await getHomeRedirectPath(locale));
  }

  return user;
}
