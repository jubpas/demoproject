import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { slugify } from "@/lib/slug";
import { isSuperAdminAccess, normalizeEmail } from "@/lib/system-access";

type Props = {
  params: Promise<{ organizationId: string }>;
};

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

async function createUniqueSlug(baseValue: string, organizationId: string) {
  const baseSlug = slugify(baseValue) || "organization";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug } });

    if (!existing || existing.id === organizationId) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function POST(request: Request, { params }: Props) {
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

    const { organizationId } = await params;
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

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const slug = await createUniqueSlug(requestedSlug || name, organization.id);

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name,
        slug,
        description,
      },
    });

    if (ownerEmail) {
      const ownerUser = await prisma.user.findUnique({
        where: { email: ownerEmail },
        select: { id: true },
      });

      if (!ownerUser) {
        return NextResponse.json({ error: "Owner email must belong to an existing user" }, { status: 400 });
      }

      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: ownerUser.id,
            organizationId: organization.id,
          },
        },
        update: {
          role: "OWNER",
        },
        create: {
          userId: ownerUser.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });
    }

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/organizations`);
    revalidatePath(`/${locale}/admin/organizations/${organization.id}`);

    return NextResponse.redirect(new URL(`/${locale}/admin/organizations/${organization.id}`, request.url), 303);
  } catch (error) {
    console.error("Update admin organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
