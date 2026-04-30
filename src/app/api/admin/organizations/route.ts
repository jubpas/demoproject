import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { slugify } from "@/lib/slug";
import { isSuperAdminAccess, normalizeEmail } from "@/lib/system-access";

async function getActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      systemRole: true,
    },
  });
}

async function createUniqueSlug(baseValue: string) {
  const baseSlug = slugify(baseValue) || "organization";
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

    const actor = await getActor(userId);

    if (!actor || !isSuperAdminAccess(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const locale = isLocale(String(formData.get("locale") ?? ""))
      ? String(formData.get("locale"))
      : defaultLocale;
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const ownerEmail = normalizeEmail(formData.get("ownerEmail"));
    const requestedSlug = String(formData.get("slug") ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const ownerUser = await prisma.user.findUnique({
      where: { email: ownerEmail || actor.email },
      select: { id: true, email: true },
    });

    if (!ownerUser) {
      return NextResponse.json({ error: "Owner email must belong to an existing user" }, { status: 400 });
    }

    const slug = await createUniqueSlug(requestedSlug || name);
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        createdById: ownerUser.id,
        memberships: {
          create: {
            userId: ownerUser.id,
            role: "OWNER",
          },
        },
      },
    });

    await prisma.userPreference.upsert({
      where: { userId: ownerUser.id },
      update: {
        lastOrganizationId: organization.id,
        locale,
      },
      create: {
        userId: ownerUser.id,
        lastOrganizationId: organization.id,
        locale,
      },
    });

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/organizations`);

    return NextResponse.redirect(new URL(`/${locale}/admin/organizations/${organization.id}`, request.url), 303);
  } catch (error) {
    console.error("Create admin organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
