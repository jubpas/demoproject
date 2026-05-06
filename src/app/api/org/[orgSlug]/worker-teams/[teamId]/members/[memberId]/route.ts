import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

// DELETE /api/org/[orgSlug]/worker-teams/[teamId]/members/[memberId]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string; memberId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);
    const { memberId } = await params;

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.workerTeamMember.findUnique({
      where: { id: memberId },
      include: {
        workerTeam: {
          select: { name: true, organizationId: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!existing) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (existing.workerTeam.organizationId !== organization.id) {
      return Response.json({ error: "Team doesn't belong to this organization" }, { status: 400 });
    }

    const body = await request.json();
    const compensationType = body.compensationType === "MONTHLY" ? "MONTHLY" : "DAILY";
    const dailyWageInCents =
      body.dailyWageAmount !== undefined && Number.isFinite(Number(body.dailyWageAmount))
        ? Math.max(0, Math.round(Number(body.dailyWageAmount) * 100))
        : null;
    const monthlyWageInCents =
      body.monthlyWageAmount !== undefined && Number.isFinite(Number(body.monthlyWageAmount))
        ? Math.max(0, Math.round(Number(body.monthlyWageAmount) * 100))
        : null;

    const member = await prisma.workerTeamMember.update({
      where: { id: memberId },
      data: {
        compensationType,
        dailyWageInCents,
        monthlyWageInCents,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeamMember",
        entityId: member.id,
        action: "UPDATE",
        summary: `Worker wage updated for ${existing.user.name || existing.user.email} in "${existing.workerTeam.name}"`,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(member),
      },
    });

    return Response.json(member);
  } catch (error) {
    console.error("PUT /worker-teams/[teamId]/members/[memberId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string; memberId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(_request);
    const { memberId } = await params;

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const member = await prisma.workerTeamMember.findUnique({
      where: { id: memberId },
      include: {
        workerTeam: {
          select: { name: true, organizationId: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.workerTeam.organizationId !== organization.id) {
      return Response.json({ error: "Team doesn't belong to this organization" }, { status: 400 });
    }

    await prisma.workerTeamMember.delete({ where: { id: memberId } });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeamMember",
        entityId: memberId,
        action: "DELETE",
        summary: `${member.user.name || member.user.email} removed from worker team "${member.workerTeam.name}"`,
        beforeJson: JSON.stringify(member),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /worker-teams/[teamId]/members/[memberId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
