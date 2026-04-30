import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationMembers, getOrganizationScopedAccess } from "@/lib/organization";
import { revalidatePath } from "next/cache";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const access = await getOrganizationScopedAccess(userId, orgSlug);

    if (!access || (!access.isSuperAdmin && !canManageOrganizationMembers(access.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const raw = formData.get("approvalThresholdInBaht") as string;

    const thresholdInBaht = Number(raw);

    if (!Number.isFinite(thresholdInBaht) || thresholdInBaht < 0) {
      return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
    }

    const thresholdInCents = Math.round(thresholdInBaht * 100);

    await prisma.organization.update({
      where: { id: access.organization.id },
      data: { approvalThresholdInCents: thresholdInCents },
    });

    const referer = request.headers.get("referer");
    const redirectUrl = referer
      ? new URL(referer)
      : new URL(`/th/org/${orgSlug}/settings`, request.url);

    revalidatePath(redirectUrl.pathname);
    revalidatePath(redirectUrl.pathname.replace(/\/settings$/, "/reports/approvals"));

    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error("Update threshold error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
