import { NextRequest } from "next/server";
import { requireOrganizationAccess } from "@/lib/require-org-access";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganizationAccess(request);

    const body = await request.json();
    const { logs } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return Response.json(
        { error: "logs array is required and must not be empty" },
        { status: 400 }
      );
    }

    interface BatchResult { success: boolean; error?: string; workLog?: unknown; }
    const results: BatchResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const log of logs) {
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
      } = log;

      if (!date) {
        results.push({ success: false, error: "Date is required" });
        errorCount++;
        continue;
      }

      if (!workerTeamId || !workerUserId) {
        results.push({ success: false, error: "workerTeamId and workerUserId are required" });
        errorCount++;
        continue;
      }

      const team = await prisma.workerTeam.findFirst({
        where: { id: workerTeamId, organizationId: organization.id },
      });

      if (!team) {
        results.push({ success: false, error: "Team not found" });
        errorCount++;
        continue;
      }

      let durationMinutes = null;
      if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        }
      }

      try {
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
            summary: `Batch work log created for ${workLog.worker.name || workLog.worker.email}`,
            afterJson: JSON.stringify(workLog),
          },
        });

        results.push({ success: true, workLog });
        successCount++;
      } catch (createError) {
        results.push({ success: false, error: "Failed to create work log" });
        errorCount++;
      }
    }

    return Response.json({
      success: true,
      total: logs.length,
      successCount,
      errorCount,
      results,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /work-logs/batch error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
