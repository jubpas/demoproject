import prisma from "@/lib/db";
import { WorkLogManager } from "@/components/org/work-log-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function WorkLogsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [workLogs, teams, projects, members] = await Promise.all([
    prisma.workLog.findMany({
      where: { organizationId: organization.id },
      include: {
        workerTeam: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
        worker: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.workerTeam.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      select: {
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <WorkLogManager
      locale={validLocale}
      orgSlug={orgSlug}
      workLogs={workLogs.map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        checkIn: log.checkIn?.toISOString() ?? null,
        checkOut: log.checkOut?.toISOString() ?? null,
        durationMinutes: log.durationMinutes,
        status: log.status,
        notes: log.notes,
        completionPercent: log.completionPercent,
        workerTeam: log.workerTeam,
        project: log.project,
        task: log.task,
        worker: {
          id: log.worker.id,
          name: log.worker.name || log.worker.email || "User",
          email: log.worker.email,
        },
      }))}
      teams={teams}
      projects={projects}
      workers={members.map((m) => ({
        userId: m.userId,
        name: m.user.name || m.user.email || "User",
        email: m.user.email,
      }))}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, workLog: messages.workLog }}
    />
  );
}
