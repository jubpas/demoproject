import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";
import type { WorkLogStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    const body = await request.json();
    const {
      projectId,
      taskId,
      workerTeamId,
      workerUserId,
      date,
      checkIn,
      checkOut,
      notes,
      completionPercent = 0,
    } = body;

    if (!date) {
      return Response.json({ error: "Date is required" }, { status: 400 });
    }

    if (!workerTeamId || !workerUserId) {
      return Response.json(
        { error: "workerTeamId and workerUserId are required" },
        { status: 400 }
      );
    }

    const team = await prisma.workerTeam.findFirst({
      where: { id: workerTeamId, organizationId: organization.id },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    let durationMinutes = null;
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        durationMinutes = Math.round(
          (end.getTime() - start.getTime()) / 60000
        );
      }
    }

    const workLog = await prisma.workLog.create({
      data: {
        organizationId: organization.id,
        projectId: projectId || null,
        taskId: taskId || null,
        workerTeamId,
        workerUserId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        durationMinutes,
        notes: notes?.trim() || null,
        completionPercent: Math.min(100, Math.max(0, completionPercent)),
      },
      include: {
        workerTeam: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        worker: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: membership.userId,
        entityType: "WorkLog",
        entityId: workLog.id,
        action: "CREATE",
        summary: `Work log created for ${workLog.worker.name || workLog.worker.email}`,
        afterJson: JSON.stringify(workLog),
      },
    });

    return Response.json(workLog, { status: 201 });
  } catch (error) {
    console.error("POST /work-logs error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    const url = new URL(request.url);
    const workerUserId = url.searchParams.get("workerUserId");
    const workerTeamId = url.searchParams.get("workerTeamId");
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const where: {
      organizationId: string;
      workerUserId?: string;
      workerTeamId?: string;
      projectId?: string;
      status?: WorkLogStatus;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      organizationId: organization.id,
    };

    if (workerUserId) where.workerUserId = workerUserId;
    if (workerTeamId) where.workerTeamId = workerTeamId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status as WorkLogStatus;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const workLogs = await prisma.workLog.findMany({
      where,
      include: {
        workerTeam: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        worker: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return Response.json(workLogs);
  } catch (error) {
    console.error("GET /work-logs error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);
    await params;

    const body = await request.json();
    const { id, notes, completionPercent, status } = body;

    if (!id) {
      return Response.json(
        { error: "workLog id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.workLog.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!existing) {
      return Response.json({ error: "Work log not found" }, { status: 404 });
    }

    const updated = await prisma.workLog.update({
      where: { id },
      data: {
        notes: notes?.trim() || existing.notes,
        completionPercent:
          completionPercent !== undefined
            ? Math.min(100, Math.max(0, completionPercent))
            : existing.completionPercent,
        status: status || existing.status,
      },
      include: {
        workerTeam: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        worker: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (status && status !== existing.status) {
      await prisma.auditLog.create({
        data: {
          organizationId: organization.id,
          actorId: membership.userId,
          entityType: "WorkLog",
          entityId: updated.id,
          action:
            status === "APPROVED"
              ? "APPROVE"
              : status === "REJECTED"
              ? "REJECT"
              : "UPDATE",
          summary: `Work log status changed to ${status}`,
          beforeJson: JSON.stringify({ status: existing.status }),
          afterJson: JSON.stringify({ status: updated.status }),
        },
      });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("PUT /work-logs error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
