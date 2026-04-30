import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { isSuperAdminAccess } from "@/lib/system-access";

const guestOnlyRoutes = new Set(["/login", "/register", "/forgot-password"]);
const onboardingRoute = "/onboarding/create-organization";
const adminRoute = "/admin";

function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : null;
}

function stripLocaleFromPathname(pathname: string, locale: string) {
  if (pathname === `/${locale}`) {
    return "/";
  }

  return pathname.replace(`/${locale}`, "") || "/";
}

export const proxy = auth(async (req) => {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return;
  }

  const { pathname } = req.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const pathWithoutLocale = stripLocaleFromPathname(pathname, locale);
  const userId = req.auth?.user?.id;
  const isInviteRoute = pathWithoutLocale.startsWith("/invite/");
  const isResetPasswordRoute = pathWithoutLocale.startsWith("/reset-password/");
  const isAdminRoute = pathWithoutLocale === adminRoute || pathWithoutLocale.startsWith(`${adminRoute}/`);

  if (!userId) {
    if (guestOnlyRoutes.has(pathWithoutLocale) || isInviteRoute || isResetPasswordRoute) {
      return;
    }

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      systemRole: true,
    },
  });
  const isSuperAdmin = user ? isSuperAdminAccess(user) : false;

  if (isInviteRoute) {
    return;
  }

  if (isAdminRoute) {
    if (isSuperAdmin) {
      return;
    }

    const fallbackUrl = req.nextUrl.clone();
    fallbackUrl.pathname = `/${locale}`;
    return NextResponse.redirect(fallbackUrl);
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { lastOrganizationId: true },
  });

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      ...(preference?.lastOrganizationId
        ? { organizationId: preference.lastOrganizationId }
        : {}),
    },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const fallbackMembership = membership
    ? null
    : await prisma.membership.findFirst({
        where: { userId },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      });

  const activeFallbackMembership = fallbackMembership?.organization.archivedAt ? null : fallbackMembership;
  const activeMembership = membership?.organization.archivedAt ? null : membership;

  const targetMembership = activeMembership ?? activeFallbackMembership;
  const targetPath = targetMembership
    ? `/${locale}/org/${targetMembership.organization.slug}/dashboard`
    : isSuperAdmin
      ? `/${locale}${adminRoute}`
      : `/${locale}${onboardingRoute}`;

  if (isSuperAdmin && pathWithoutLocale === adminRoute) {
    return;
  }

  if (pathWithoutLocale === "/") {
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.redirect(url);
  }

  if (guestOnlyRoutes.has(pathWithoutLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.redirect(url);
  }

  if (!targetMembership && pathWithoutLocale !== onboardingRoute) {
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.redirect(url);
  }

  if (targetMembership && targetMembership.organization.archivedAt) {
    const url = req.nextUrl.clone();
    url.pathname = isSuperAdmin ? `/${locale}${adminRoute}` : `/${locale}${onboardingRoute}`;
    return NextResponse.redirect(url);
  }

  if (targetMembership && pathWithoutLocale === onboardingRoute) {
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.redirect(url);
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
