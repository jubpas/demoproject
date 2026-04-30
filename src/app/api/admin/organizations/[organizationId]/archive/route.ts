import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { isSuperAdminAccess } from "@/lib/system-access";

type Props = {
  params: Promise<{ organizationId: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        systemRole: true,
      },
    });

    if (!actor || !isSuperAdminAccess(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { organizationId } = await params;
    const formData = await request.formData();
    const locale = isLocale(String(formData.get("locale") ?? ""))
      ? String(formData.get("locale"))
      : defaultLocale;
    const shouldArchive = String(formData.get("action") ?? "archive") !== "restore";

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        archivedAt: shouldArchive ? new Date() : null,
      },
    });

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/organizations`);
    revalidatePath(`/${locale}/admin/organizations/${organizationId}`);

    return NextResponse.redirect(new URL(`/${locale}/admin/organizations/${organizationId}`, request.url), 303);
  } catch (error) {
    console.error("Archive admin organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
