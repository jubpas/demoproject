import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    projectId?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseDateBoundary(value: string, endOfDay: boolean) {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export default async function LaborCostReportPage({ params, searchParams }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const resolvedSearchParams = await searchParams;
  const fromDateValue = getSingleValue(resolvedSearchParams.from).trim();
  const toDateValue = getSingleValue(resolvedSearchParams.to).trim();
  const projectIdFilter = getSingleValue(resolvedSearchParams.projectId).trim();

  const fromDate = parseDateBoundary(fromDateValue, false);
  const toDate = parseDateBoundary(toDateValue, true);

  const whereClause: {
    organizationId: string;
    date?: { gte?: Date; lte?: Date };
    projectId?: string | null;
  } = {
    organizationId: organization.id,
  };

  if (fromDate || toDate) {
    whereClause.date = {};
    if (fromDate) whereClause.date.gte = fromDate;
    if (toDate) whereClause.date.lte = toDate;
  }

  const [workLogs, projects, _workerTeams] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        ...whereClause,
        projectId: projectIdFilter || null,
      },
      include: {
        worker: { select: { id: true, name: true, email: true } },
        workerTeam: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
    }),
    prisma.workerTeam.findMany({
      where: { organizationId: organization.id, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  // Calculate summary statistics
  const totalMinutes = workLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = Math.round(totalHours / 8);

  // Group by worker
  const workerStats = workLogs.reduce((acc, log) => {
    const workerId = log.workerUserId;
    const workerName = log.worker.name || log.worker.email;
    if (!acc[workerId]) {
      acc[workerId] = {
        workerId,
        workerName,
        totalMinutes: 0,
        totalHours: 0,
        logCount: 0,
        projects: new Set<string>(),
      };
    }
    acc[workerId].totalMinutes += log.durationMinutes || 0;
    acc[workerId].logCount += 1;
    if (log.projectId) {
      acc[workerId].projects.add(log.projectId);
    }
    return acc;
  }, {} as Record<string, { workerId: string; workerName: string; totalMinutes: number; totalHours: number; logCount: number; projects: Set<string> }>);

  const workerStatsArray = Object.values(workerStats).map((stat) => ({
    ...stat,
    totalHours: Math.round(stat.totalMinutes / 60),
    projects: Array.from(stat.projects),
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Group by project
  const projectStats = workLogs.reduce((acc, log) => {
    const projectId = log.projectId;
    if (!projectId) return acc;
    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        projectName: log.project?.name || "Unknown",
        totalMinutes: 0,
        logCount: 0,
        workers: new Set<string>(),
      };
    }
    acc[projectId].totalMinutes += log.durationMinutes || 0;
    acc[projectId].logCount += 1;
    acc[projectId].workers.add(log.workerUserId);
    return acc;
  }, {} as Record<string, { projectId: string; projectName: string; totalMinutes: number; logCount: number; workers: Set<string> }>);

  const projectStatsArray = Object.values(projectStats).map((stat) => ({
    ...stat,
    totalHours: Math.round(stat.totalMinutes / 60),
    workers: Array.from(stat.workers),
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Group by team
  const teamStats = workLogs.reduce((acc, log) => {
    const teamId = log.workerTeamId;
    const teamName = log.workerTeam.name || "Unknown";
    if (!acc[teamId]) {
      acc[teamId] = {
        teamId,
        teamName,
        totalMinutes: 0,
        logCount: 0,
        workers: new Set<string>(),
      };
    }
    acc[teamId].totalMinutes += log.durationMinutes || 0;
    acc[teamId].logCount += 1;
    acc[teamId].workers.add(log.workerUserId);
    return acc;
  }, {} as Record<string, { teamId: string; teamName: string; totalMinutes: number; logCount: number; workers: Set<string> }>);

  const teamStatsArray = Object.values(teamStats).map((stat) => ({
    ...stat,
    totalHours: Math.round(stat.totalMinutes / 60),
    workers: Array.from(stat.workers),
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const moneyFormatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.slug}
        title={messages.reports.laborCostTitle}
        description={messages.reports.laborCostDescription}
        actions={
          <>
            <Link
              href={`/${validLocale}/org/${orgSlug}/worker-teams`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.nav.workerTeams}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/work-logs`}
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {messages.nav.workLogs}
            </Link>
          </>
        }
      />

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">{messages.reports.totalWorkLogs}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{workLogs.length}</p>
          <p className="mt-1 text-xs text-slate-500">{messages.reports.workLogsCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">{messages.reports.totalLaborHours}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{totalHours}h</p>
          <p className="mt-1 text-xs text-slate-500">{Math.round(totalMinutes % 60)}m</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">{messages.reports.totalActiveWorkers}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{workerStatsArray.length}</p>
          <p className="mt-1 text-xs text-slate-500">{messages.reports.activeWorkersCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">{messages.reports.totalActiveProjects}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{projectStatsArray.length}</p>
          <p className="mt-1 text-xs text-slate-500">{messages.reports.projectsWithLabor}</p>
        </div>
      </section>

      {/* Filters */}
      <DataPanel title={messages.reports.filtersTitle}>
        <form method="get" className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">{messages.reports.fromDate}</label>
            <input
              type="date"
              name="from"
              defaultValue={fromDateValue}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">{messages.reports.toDate}</label>
            <input
              type="date"
              name="to"
              defaultValue={toDateValue}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">{messages.reports.project}</label>
            <select
              name="projectId"
              defaultValue={projectIdFilter}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">ทั้งหมด</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {messages.common.filter}
            </button>
          </div>
        </form>
      </DataPanel>

      {/* Worker Performance */}
      <DataPanel title={messages.reports.workerPerformance} description={messages.reports.workerPerformanceDescription}>
        {workerStatsArray.length === 0 ? (
          <p className="text-sm text-slate-500">{messages.common.noData}</p>
        ) : (
          <div className="space-y-3">
            {workerStatsArray.map((worker) => (
              <div key={worker.workerId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{worker.workerName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {worker.logCount} {messages.reports.workLogs}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">{worker.totalHours}h</p>
                    <p className="text-xs text-slate-500">{Math.round(worker.totalMinutes % 60)}m</p>
                  </div>
                </div>
                {worker.projects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {worker.projects.map((projectId) => {
                      const project = projects.find((p) => p.id === projectId);
                      return project ? (
                        <span
                          key={projectId}
                          className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {project.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Project Breakdown */}
      <DataPanel title={messages.reports.projectBreakdown} description={messages.reports.projectBreakdownDescription}>
        {projectStatsArray.length === 0 ? (
          <p className="text-sm text-slate-500">{messages.common.noData}</p>
        ) : (
          <div className="space-y-3">
            {projectStatsArray.map((project) => (
              <div key={project.projectId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/${validLocale}/org/${orgSlug}/projects/${project.projectId}`} className="font-medium text-slate-950 hover:text-blue-700">
                      {project.projectName}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.logCount} {messages.reports.workLogs} | {project.workers.length} {messages.reports.workers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">{project.totalHours}h</p>
                    <p className="text-xs text-slate-500">{Math.round(project.totalMinutes % 60)}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Team Summary */}
      <DataPanel title={messages.reports.teamSummary} description={messages.reports.teamSummaryDescription}>
        {teamStatsArray.length === 0 ? (
          <p className="text-sm text-slate-500">{messages.common.noData}</p>
        ) : (
          <div className="space-y-3">
            {teamStatsArray.map((team) => (
              <div key={team.teamId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{team.teamName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {team.logCount} {messages.reports.workLogs} | {team.workers.length} {messages.reports.workers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">{team.totalHours}h</p>
                    <p className="text-xs text-slate-500">{Math.round(team.totalMinutes % 60)}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}