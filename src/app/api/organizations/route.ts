import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { slugify } from "@/lib/slug";

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
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const description = body?.description?.trim() || null;
    const locale = isLocale(body?.locale) ? body.locale : defaultLocale;

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อบริษัทหรือทีม" }, { status: 400 });
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
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
