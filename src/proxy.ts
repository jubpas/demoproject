import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";

const authRoutes = new Set(["/login", "/register"]);
const onboardingRoute = "/onboarding/create-organization";

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

export default auth((req) => {
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

  if (!userId) {
    if (authRoutes.has(pathWithoutLocale)) {
      return;
    }

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return prisma.membership
    .findFirst({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    })
    .then((membership) => {
      const targetPath = membership
        ? `/${locale}/org/${membership.organization.slug}/dashboard`
        : `/${locale}${onboardingRoute}`;

      if (pathWithoutLocale === "/") {
        const url = req.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }

      if (authRoutes.has(pathWithoutLocale)) {
        const url = req.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }

      if (!membership && pathWithoutLocale !== onboardingRoute) {
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}${onboardingRoute}`;
        return NextResponse.redirect(url);
      }

      if (membership && pathWithoutLocale === onboardingRoute) {
        const url = req.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }

      return undefined;
    });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
