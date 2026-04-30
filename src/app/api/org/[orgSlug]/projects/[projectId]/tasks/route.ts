import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { getMembershipByOrgSlug, canManageProjectTasks } from "@/lib/organization";
import {
  parseTaskDate,
  parseTaskPriority,
  parseTaskProgress,
  parseTaskStatus,
  syncTaskCompletionFields,
  validateTaskDates,
} from "@/lib/project-tasks";

type Props = {
  params: Promise<{ orgSlug: string; projectId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: membership.organizationId,
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tasks = await prisma.projectTask.findMany({
      where: {
        projectId: project.id,
        organizationId: membership.organizationId,
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("List project tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, projectId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageProjectTasks(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: membership.organizationId,
      },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
      const parentTask = await prisma.projectTask.findFirst({
        where: {
          id: parentTaskId,
          projectId: project.id,
          organizationId: membership.organizationId,
        },
        select: { id: true },
      });

      if (!parentTask) {
        return NextResponse.json({ error: "Parent task not found" }, { status: 400 });
      }
    }

    const lastTask = await prisma.projectTask.findFirst({
      where: {
        projectId: project.id,
        organizationId: membership.organizationId,
      },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      select: { sortOrder: true },
    });

    const completionFields = syncTaskCompletionFields({
      status,
      progressPercent,
      endDate,
    });

    const task = await prisma.projectTask.create({
      data: {
        organizationId: membership.organizationId,
        projectId: project.id,
        parentTaskId,
        assignedToId,
        createdById: userId,
        title,
        description: description || null,
        status,
        priority,
        startDate,
        dueDate,
        endDate: completionFields.endDate,
        progressPercent: completionFields.progressPercent,
        completedAt: completionFields.completedAt,
        sortOrder: (lastTask?.sortOrder ?? -1) + 1,
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
      projectId: project.id,
      entityType: "PROJECT_TASK",
      entityId: task.id,
      action: "CREATE",
      summary: `Created task ${task.title}`,
      after: task,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create project task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
