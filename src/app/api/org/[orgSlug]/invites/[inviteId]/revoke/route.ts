import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
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

    const updatedInvite = await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    await createAuditLog({
      organizationId: access.organization.id,
      actorId: userId,
      entityType: "ORGANIZATION_INVITE",
      entityId: invite.id,
      action: "UPDATE",
      summary: `Revoked invite for ${invite.email}`,
      before: { email: invite.email, role: invite.role, status: invite.status },
      after: { email: updatedInvite.email, role: updatedInvite.role, status: updatedInvite.status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
