import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import type { Locale } from "@/lib/locales";
import { isLocale, withLocale } from "@/lib/locales";
import { getMembershipByOrgSlug } from "@/lib/organization";

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

  return {
    id: userId,
    email: session.user?.email ?? "",
    name: session.user?.name ?? null,
  };
});

export const getUserOrganizations = cache(async (userId: string) => {
  return prisma.membership.findMany({
    where: { userId },
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

  if (!membership) {
    redirect(await getHomeRedirectPath(locale));
  }

  return {
    user,
    membership,
    organization: membership.organization,
  };
}
