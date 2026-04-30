import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationMembers, getOrganizationScopedAccess } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; inviteId: string }>;
};

export async function POST(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, inviteId } = await params;
    const access = await getOrganizationScopedAccess(userId, orgSlug);

    if (!access || (!access.isSuperAdmin && !canManageOrganizationMembers(access.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invite = await prisma.organizationInvite.findFirst({
      where: {
        id: inviteId,
        organizationId: access.organization.id,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending invites can be revoked" }, { status: 400 });
    }

    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
