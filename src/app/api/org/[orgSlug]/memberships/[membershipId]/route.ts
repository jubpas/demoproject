import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import prisma from "@/lib/db";
import {
  canAssignMemberRole,
  canManageOrganizationMembers,
  getOrganizationScopedAccess,
} from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; membershipId: string }>;
};

const allowedRoles = new Set(["OWNER", "ADMIN", "MANAGER", "STAFF"] as const);

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, membershipId } = await params;
    const access = await getOrganizationScopedAccess(userId, orgSlug);

    if (!access || (!access.isSuperAdmin && !canManageOrganizationMembers(access.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const role = body?.role;

    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: "Invalid member role" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: access.organization.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (membership.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: {
          organizationId: access.organization.id,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json({ error: "The last owner cannot be reassigned" }, { status: 400 });
      }
    }

    if (!access.isSuperAdmin) {
      if (membership.userId === userId) {
        return NextResponse.json({ error: "You cannot update your own role" }, { status: 400 });
      }

      if (membership.role === "OWNER") {
        return NextResponse.json({ error: "Owner role can only be managed by super admin" }, { status: 403 });
      }

      if (role === "OWNER" || !canAssignMemberRole(access.role, membership.role) || !canAssignMemberRole(access.role, role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updatedMembership = await prisma.membership.update({
      where: { id: membership.id },
      data: { role },
    });

    await createAuditLog({
      organizationId: access.organization.id,
      actorId: userId,
      entityType: "MEMBERSHIP",
      entityId: updatedMembership.id,
      action: "UPDATE",
      summary: `Updated member role for ${membership.user.email}`,
      before: { role: membership.role, email: membership.user.email },
      after: { role: updatedMembership.role, email: membership.user.email },
    });

    return NextResponse.json({ membership: updatedMembership });
  } catch (error) {
    console.error("Update membership error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, membershipId } = await params;
    const access = await getOrganizationScopedAccess(userId, orgSlug);

    if (!access || (!access.isSuperAdmin && !canManageOrganizationMembers(access.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: access.organization.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (membership.role === "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: {
          organizationId: access.organization.id,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json({ error: "The last owner cannot be removed" }, { status: 400 });
      }
    }

    if (!access.isSuperAdmin) {
      if (membership.userId === userId) {
        return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
      }

      if (membership.role === "OWNER") {
        return NextResponse.json({ error: "Owner membership can only be managed by super admin" }, { status: 403 });
      }

      if (!canAssignMemberRole(access.role, membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.$transaction([
      prisma.userPreference.updateMany({
        where: {
          userId: membership.userId,
          lastOrganizationId: access.organization.id,
        },
        data: {
          lastOrganizationId: null,
        },
      }),
      prisma.membership.delete({
        where: { id: membership.id },
      }),
    ]);

    await createAuditLog({
      organizationId: access.organization.id,
      actorId: userId,
      entityType: "MEMBERSHIP",
      entityId: membership.id,
      action: "DELETE",
      summary: `Removed member ${membership.userId}`,
      before: { role: membership.role, userId: membership.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete membership error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
