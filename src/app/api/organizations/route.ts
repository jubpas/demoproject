import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import { slugify } from "@/lib/slug";

type OrganizationErrorMessages = {
  unauthorized: string;
  requiredName: string;
  generic: string;
};

const errorMessages: Record<Locale, OrganizationErrorMessages> = {
  th: {
    unauthorized: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
    requiredName: "กรุณากรอกชื่อบริษัทหรือทีม",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่",
  },
  en: {
    unauthorized: "Please sign in before continuing",
    requiredName: "Please enter a company or team name",
    generic: "Something went wrong. Please try again",
  },
};

async function createUniqueSlug(baseName: string) {
  const baseSlug = slugify(baseName) || "organization";
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

export async function POST(request: Request) {
  let locale = defaultLocale;

  try {
    const session = await auth();
    const userId = session?.user?.id;
    const body = await request.json();
    locale = isLocale(body?.locale) ? body.locale : defaultLocale;
    const messages = errorMessages[locale];

    if (!userId) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() || null : null;

    if (!name) {
      return NextResponse.json({ error: messages.requiredName }, { status: 400 });
    }

    const slug = await createUniqueSlug(name);

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        createdById: userId,
        memberships: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    await prisma.userPreference.upsert({
      where: { userId },
      update: {
        lastOrganizationId: organization.id,
        locale,
      },
      create: {
        userId,
        lastOrganizationId: organization.id,
        locale,
      },
    });

    await ensureOrganizationBudgetCategories(organization.id);

    return NextResponse.json({
      success: true,
      redirectTo: `/${locale}/org/${organization.slug}/dashboard`,
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: errorMessages[locale].generic },
      { status: 500 },
    );
  }
}
