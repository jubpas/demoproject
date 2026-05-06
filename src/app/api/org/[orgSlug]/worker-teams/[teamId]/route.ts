import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(_request);
    const { teamId } = await params;

    const team = await prisma.workerTeam.findFirst({
      where: {
        id: teamId,
        organizationId: organization.id,
      },
      include: {
        members: {
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
        },
        _count: {
          select: {
            workLogs: true,
          },
        },
      },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    return Response.json(team);
  } catch (error) {
    console.error("GET /worker-teams/[teamId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);
    const { teamId } = await params;

    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, isActive } = await request.json();

    const existing = await prisma.workerTeam.findFirst({
      where: { id: teamId, organizationId: organization.id },
    });

    if (!existing) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    const team = await prisma.workerTeam.update({
      where: { id: teamId },
      data: {
        name: name?.trim() || existing.name,
        description: description?.trim() || existing.description,
        isActive: isActive ?? existing.isActive,
      },
      include: {
        members: {
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
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeam",
        entityId: team.id,
        action: "UPDATE",
        summary: `Worker team "${team.name}" updated`,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(team),
      },
    });

    return Response.json(team);
  } catch (error) {
    console.error("PUT /worker-teams/[teamId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; teamId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(_request);
    const { teamId } = await params;

    if (!["OWNER", "ADMIN"].includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await prisma.workerTeam.findFirst({
      where: { id: teamId, organizationId: organization.id },
      select: { name: true },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    await prisma.workerTeam.delete({ where: { id: teamId } });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkerTeam",
        entityId: teamId,
        action: "DELETE",
        summary: `Worker team "${team.name}" deleted`,
        beforeJson: JSON.stringify(team),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /worker-teams/[teamId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
