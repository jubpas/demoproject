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
  const [members, teams, projects, tasks, assignments] = await Promise.all([
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
  ]);

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
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, workerTeam: messages.workerTeam }}
    />
  );
}
