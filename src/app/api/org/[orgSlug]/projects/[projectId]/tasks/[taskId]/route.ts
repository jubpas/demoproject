import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManageProjectTasks, getMembershipByOrgSlug } from "@/lib/organization";
import {
  parseTaskDate,
  parseTaskPriority,
  parseTaskProgress,
  parseTaskStatus,
  syncTaskCompletionFields,
  validateTaskDates,
} from "@/lib/project-tasks";

type Props = {
  params: Promise<{ orgSlug: string; projectId: string; taskId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId, taskId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageProjectTasks(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const assignedToId = typeof body?.assignedToId === "string" && body.assignedToId.trim() ? body.assignedToId.trim() : null;
    const parentTaskId = typeof body?.parentTaskId === "string" && body.parentTaskId.trim() ? body.parentTaskId.trim() : null;
    const progressPercent = parseTaskProgress(body?.progressPercent);
    const startDate = parseTaskDate(body?.startDate);
    const dueDate = parseTaskDate(body?.dueDate);
    const endDate = parseTaskDate(body?.endDate);
    const status = parseTaskStatus(body?.status);
    const priority = parseTaskPriority(body?.priority);
    const sortOrder = typeof body?.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.max(0, Math.round(body.sortOrder))
      : existingTask.sortOrder;

    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    if (progressPercent === null) {
      return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
    }

    const dateValidation = validateTaskDates({ startDate, dueDate, endDate });

    if (dateValidation) {
      return NextResponse.json({ error: "Invalid task date range" }, { status: 400 });
    }

    if (assignedToId) {
      const assigneeMembership = await prisma.membership.findFirst({
        where: {
          organizationId: membership.organizationId,
          userId: assignedToId,
        },
        select: { id: true },
      });

      if (!assigneeMembership) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
      }
    }

    if (parentTaskId) {
      if (parentTaskId === existingTask.id) {
        return NextResponse.json({ error: "A task cannot be its own parent" }, { status: 400 });
      }

      const parentTask = await prisma.projectTask.findFirst({
        where: {
          id: parentTaskId,
          projectId,
          organizationId: membership.organizationId,
        },
        select: { id: true },
      });

      if (!parentTask) {
        return NextResponse.json({ error: "Parent task not found" }, { status: 400 });
      }
    }

    const completionFields = syncTaskCompletionFields({
      status,
      progressPercent,
      endDate,
    });

    const task = await prisma.projectTask.update({
      where: { id: existingTask.id },
      data: {
        parentTaskId,
        assignedToId,
        title,
        description: description || null,
        status,
        priority,
        startDate,
        dueDate,
        endDate: completionFields.endDate,
        progressPercent: completionFields.progressPercent,
        completedAt: completionFields.completedAt,
        sortOrder,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorId: userId,
      projectId,
      entityType: "PROJECT_TASK",
      entityId: task.id,
      action: "UPDATE",
      summary: `Updated task ${task.title}`,
      before: existingTask,
      after: task,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Update project task error:", error);
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

    const { orgSlug, projectId, taskId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageProjectTasks(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.projectTask.delete({
      where: { id: existingTask.id },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorId: userId,
      projectId,
      entityType: "PROJECT_TASK",
      entityId: existingTask.id,
      action: "DELETE",
      summary: `Deleted task ${existingTask.title}`,
      before: existingTask,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
