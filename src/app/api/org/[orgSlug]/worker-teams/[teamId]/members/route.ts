import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

// POST /api/org/[orgSlug]/worker-teams/[teamId]/members

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);
    const { teamId } = await params;

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, compensationType, dailyWageAmount, monthlyWageAmount } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const team = await prisma.workerTeam.findFirst({
      where: { id: teamId, organizationId: organization.id },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is already a member of this team
    const existing = await prisma.workerTeamMember.findUnique({
      where: {
        workerTeamId_userId: { workerTeamId: teamId, userId },
      },
    });

    if (existing) {
      return Response.json({ error: "User is already a member of this team" }, { status: 409 });
    }

    // Verify user is a member of the organization
    const orgMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: organization.id },
      },
    });

    if (!orgMembership) {
      return Response.json({ error: "User is not a member of this organization" }, { status: 400 });
    }

    // If adding a second leader, unmark the existing leader
    const isMainWorker = role === "LEADER";
    if (isMainWorker) {
      await prisma.workerTeamMember.updateMany({
        where: { workerTeamId: teamId, isMainWorker: true },
        data: { isMainWorker: false },
      });
    }

    const member = await prisma.workerTeamMember.create({
      data: {
        workerTeamId: teamId,
        userId,
        role: role || "MEMBER",
        isMainWorker,
        compensationType: compensationType === "MONTHLY" ? "MONTHLY" : "DAILY",
        dailyWageInCents:
          dailyWageAmount !== undefined && Number.isFinite(Number(dailyWageAmount))
            ? Math.max(0, Math.round(Number(dailyWageAmount) * 100))
            : null,
        monthlyWageInCents:
          monthlyWageAmount !== undefined && Number.isFinite(Number(monthlyWageAmount))
            ? Math.max(0, Math.round(Number(monthlyWageAmount) * 100))
            : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeamMember",
        entityId: member.id,
        action: "CREATE",
        summary: `${member.user.name || member.user.email} added to worker team "${team.name}"`,
        afterJson: JSON.stringify(member),
      },
    });

    return Response.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /worker-teams/[teamId]/members error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
