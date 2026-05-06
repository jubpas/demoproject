import { NextRequest } from "next/server";
import type { WorkerAssignmentStatus, WorkerCompensationType } from "@prisma/client";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

const managerRoles = ["OWNER", "ADMIN", "MANAGER"];
const assignmentStatuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
const compensationTypes = ["DAILY", "MONTHLY"];

function parseCents(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculatePlannedDays(startDate: Date, endDate: Date, explicitDays: unknown) {
  const parsedDays = Number(explicitDays);
  if (Number.isFinite(parsedDays) && parsedDays > 0) {
    return parsedDays;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
}

function calculateEstimatedCost(
  wageInCents: number,
  plannedDays: number,
  compensationType: WorkerCompensationType,
) {
  if (compensationType === "MONTHLY") {
    return Math.round((wageInCents / 30) * plannedDays);
  }

  return Math.round(wageInCents * plannedDays);
}

export async function POST(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    if (!managerRoles.includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const taskId = typeof body.taskId === "string" && body.taskId ? body.taskId : null;
    const workerTeamId = typeof body.workerTeamId === "string" ? body.workerTeamId : "";
    const workerUserId = typeof body.workerUserId === "string" && body.workerUserId ? body.workerUserId : null;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);
    const compensationType = compensationTypes.includes(body.compensationType)
      ? (body.compensationType as WorkerCompensationType)
      : "DAILY";
    const wageInCents = parseCents(body.wageAmount);
    const status = assignmentStatuses.includes(body.status)
      ? (body.status as WorkerAssignmentStatus)
      : "PLANNED";

    if (!title || !projectId || !workerTeamId || !startDate || !endDate || wageInCents === null) {
      return Response.json({ error: "Missing required assignment fields" }, { status: 400 });
    }

    if (endDate < startDate) {
      return Response.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const [project, team, workerMembership, task] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, organizationId: organization.id } }),
      prisma.workerTeam.findFirst({ where: { id: workerTeamId, organizationId: organization.id } }),
      workerUserId
        ? prisma.membership.findUnique({
            where: { userId_organizationId: { userId: workerUserId, organizationId: organization.id } },
          })
        : Promise.resolve(null),
      taskId
        ? prisma.projectTask.findFirst({
            where: { id: taskId, projectId, organizationId: organization.id },
          })
        : Promise.resolve(null),
    ]);

    if (!project || !team) {
      return Response.json({ error: "Project or team not found" }, { status: 404 });
    }

    if (workerUserId && !workerMembership) {
      return Response.json({ error: "Worker is not a member of this organization" }, { status: 400 });
    }

    if (taskId && !task) {
      return Response.json({ error: "Task not found in selected project" }, { status: 404 });
    }

    const plannedDays = calculatePlannedDays(startDate, endDate, body.plannedDays);
    const estimatedCostInCents = calculateEstimatedCost(wageInCents, plannedDays, compensationType);

    const assignment = await prisma.workerAssignment.create({
      data: {
        organizationId: organization.id,
        projectId,
        taskId,
        workerTeamId,
        workerUserId,
        assignedById: membership.userId,
        title,
        startDate,
        endDate,
        plannedDays,
        compensationType,
        wageInCents,
        estimatedCostInCents,
        status,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        workerTeam: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        projectId,
        actorId: membership.userId,
        entityType: "WorkerAssignment",
        entityId: assignment.id,
        action: "CREATE",
        summary: `Worker assignment "${assignment.title}" planned for ${assignment.workerTeam.name}`,
        afterJson: JSON.stringify(assignment),
      },
    });

    return Response.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/worker-assignments error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    if (!managerRoles.includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = assignmentStatuses.includes(body.status)
      ? (body.status as WorkerAssignmentStatus)
      : null;

    if (!id || !status) {
      return Response.json({ error: "Assignment id and status are required" }, { status: 400 });
    }

    const existing = await prisma.workerAssignment.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!existing) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    const assignment = await prisma.workerAssignment.update({
      where: { id },
      data: { status },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        workerTeam: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        projectId: assignment.projectId,
        actorId: membership.userId,
        entityType: "WorkerAssignment",
        entityId: assignment.id,
        action: "UPDATE",
        summary: `Worker assignment "${assignment.title}" status changed to ${status}`,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(assignment),
      },
    });

    return Response.json(assignment);
  } catch (error) {
    console.error("PUT /api/worker-assignments error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
