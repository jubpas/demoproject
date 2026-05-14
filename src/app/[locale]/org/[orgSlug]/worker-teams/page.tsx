import prisma from "@/lib/db";
import { WorkerTeamManager } from "@/components/org/worker-team-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function WorkerTeamsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const [members, teams, projects, tasks, assignments, workLogs, memberWages] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      select: { userId: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.workerTeam.findMany({
      where: { organizationId: organization.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { workLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, code: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectTask.findMany({
      where: { organizationId: organization.id },
      select: { id: true, projectId: true, title: true, status: true, startDate: true, dueDate: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.workerAssignment.findMany({
      where: { organizationId: organization.id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        workerTeam: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.workLog.findMany({
      where: { organizationId: organization.id },
      select: {
        workerTeamId: true,
        workerUserId: true,
        projectId: true,
        durationMinutes: true,
        status: true,
      },
    }),
    prisma.workerTeamMember.findMany({
      where: {
        workerTeam: { organizationId: organization.id },
      },
      select: {
        id: true,
        workerTeamId: true,
        userId: true,
        dailyWageInCents: true,
        monthlyWageInCents: true,
        compensationType: true,
        isMainWorker: true,
      },
    }),
  ]);

  // Calculate actual cost from work logs
  // Only count APPROVED work logs
  const approvedWorkLogs = workLogs.filter((log) => log.status === "APPROVED");

  // Calculate actual cost by team
  // hourlyRate = dailyWage / 8 hours
  // actualCost = (durationMinutes / 60) * hourlyRate
  const actualCostByTeam = new Map<string, number>();
  const actualHoursByTeam = new Map<string, number>();
  const actualCostByProject = new Map<string, number>();
  const actualHoursByProject = new Map<string, number>();
  const actualCostByWorker = new Map<string, { name: string; totalCost: number; totalHours: number }>();

  for (const log of approvedWorkLogs) {
    if (!log.durationMinutes) continue;

    // Find member wage
    const memberWage = memberWages.find(
      (m) => m.workerTeamId === log.workerTeamId && m.userId === log.workerUserId,
    );
    const dailyWage = memberWage?.dailyWageInCents ?? 0;
    const hourlyRate = dailyWage > 0 ? dailyWage / 8 : 0;
    const costInCents = hourlyRate > 0 ? Math.round((log.durationMinutes / 60) * hourlyRate * 100) : 0;
    const hours = log.durationMinutes / 60;

    // By team
    const teamCost = actualCostByTeam.get(log.workerTeamId) ?? 0;
    actualCostByTeam.set(log.workerTeamId, teamCost + costInCents);
    const teamHours = actualHoursByTeam.get(log.workerTeamId) ?? 0;
    actualHoursByTeam.set(log.workerTeamId, teamHours + hours);

    // By project
    if (log.projectId) {
      const projectCost = actualCostByProject.get(log.projectId) ?? 0;
      actualCostByProject.set(log.projectId, projectCost + costInCents);
      const projectHours = actualHoursByProject.get(log.projectId) ?? 0;
      actualHoursByProject.set(log.projectId, projectHours + hours);
    }

    // By worker
    const workerName = members.find((m) => m.userId === log.workerUserId)?.user.name || log.workerUserId;
    const workerData = actualCostByWorker.get(log.workerUserId) ?? { name: workerName, totalCost: 0, totalHours: 0 };
    workerData.totalCost += costInCents;
    workerData.totalHours += hours;
    actualCostByWorker.set(log.workerUserId, workerData);
  }

  const totalEstimatedCost = assignments.reduce((sum, a) => sum + a.estimatedCostInCents, 0);
  const totalActualCost = Array.from(actualCostByTeam.values()).reduce((sum, c) => sum + c, 0);
  const totalActualHours = Array.from(actualHoursByTeam.values()).reduce((sum, h) => sum + h, 0);
  const activeWorkLogCount = approvedWorkLogs.length;

  return (
    <WorkerTeamManager
      locale={validLocale}
      orgSlug={orgSlug}
      teams={teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        isActive: team.isActive,
        memberCount: team.members.length,
        workLogCount: team._count.workLogs,
        createdAt: team.createdAt.toISOString(),
        estimatedCost: assignments
          .filter((a) => a.workerTeamId === team.id)
          .reduce((sum, a) => sum + a.estimatedCostInCents, 0),
        actualCost: actualCostByTeam.get(team.id) ?? 0,
        actualHours: actualHoursByTeam.get(team.id) ?? 0,
        members: team.members.map((m) => ({
          userId: m.userId,
          memberId: m.id,
          name: m.user.name || m.user.email || "User",
          email: m.user.email,
          role: m.role,
          isMainWorker: m.isMainWorker,
          compensationType: m.compensationType,
          dailyWageInCents: m.dailyWageInCents,
          monthlyWageInCents: m.monthlyWageInCents,
        })),
      }))}
      allMembers={members.map((m) => ({
        userId: m.userId,
        name: m.user.name || m.user.email || "User",
        email: m.user.email,
        role: membership.role,
      }))}
      projects={projects}
      tasks={tasks.map((task) => ({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        status: task.status,
        startDate: task.startDate?.toISOString() ?? null,
        dueDate: task.dueDate?.toISOString() ?? null,
      }))}
      assignments={assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate.toISOString(),
        plannedDays: assignment.plannedDays,
        compensationType: assignment.compensationType,
        wageInCents: assignment.wageInCents,
        estimatedCostInCents: assignment.estimatedCostInCents,
        status: assignment.status,
        notes: assignment.notes,
        project: assignment.project,
        task: assignment.task,
        workerTeam: assignment.workerTeam,
        worker: assignment.worker
          ? {
              id: assignment.worker.id,
              name: assignment.worker.name || assignment.worker.email || "User",
              email: assignment.worker.email,
            }
          : null,
      }))}
      costSummary={{
        totalEstimatedCostInCents: totalEstimatedCost,
        totalActualCostInCents: totalActualCost,
        totalActualHours,
        activeWorkLogCount,
      }}
      actualCostByProject={Array.from(actualCostByProject.entries()).map(([projectId, costInCents]) => ({
        projectId,
        costInCents,
        hours: actualHoursByProject.get(projectId) ?? 0,
      }))}
      actualCostByWorker={Array.from(actualCostByWorker.entries()).map(([userId, data]) => ({
        userId,
        name: data.name,
        costInCents: data.totalCost,
        hours: data.totalHours,
      }))}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, workerTeam: messages.workerTeam }}
    />
  );
}
