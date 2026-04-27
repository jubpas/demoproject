import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{
    actor?: string | string[];
    entity?: string | string[];
    action?: string | string[];
    projectId?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseDateBoundary(value: string, endOfDay: boolean) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function truncateJson(value: string | null) {
  if (!value) {
    return null;
  }

  return value.length > 160 ? `${value.slice(0, 160)}...` : value;
}

export default async function AuditExplorerPage({ params, searchParams }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const resolvedSearchParams = await searchParams;

  const actorKeyword = getSingleValue(resolvedSearchParams.actor).trim();
  const entityType = getSingleValue(resolvedSearchParams.entity).trim();
  const actionType = getSingleValue(resolvedSearchParams.action).trim();
  const projectId = getSingleValue(resolvedSearchParams.projectId).trim();
  const fromDate = getSingleValue(resolvedSearchParams.from).trim();
  const toDate = getSingleValue(resolvedSearchParams.to).trim();

  const createdAtFilter = {
    ...(fromDate ? { gte: parseDateBoundary(fromDate, false) } : {}),
    ...(toDate ? { lte: parseDateBoundary(toDate, true) } : {}),
  };

  const where = {
    organizationId: organization.id,
    ...(entityType ? { entityType } : {}),
    ...(actionType ? { action: actionType } : {}),
    ...(projectId ? { projectId } : {}),
    ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
    ...(actorKeyword
      ? {
          actor: {
            OR: [
              { name: { contains: actorKeyword } },
              { email: { contains: actorKeyword } },
            ],
          },
        }
      : {}),
  };

  const [auditLogs, projects] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const entityOptions = ["PROJECT_BUDGET_LINE", "TRANSACTION", "APPROVAL_REQUEST"];
  const actionOptions = ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT"];
  const entityCounts = auditLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.entityType] = (acc[log.entityType] ?? 0) + 1;
    return acc;
  }, {});
  const actionCounts = auditLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.slug}
        title={messages.reports.auditExplorerTitle}
        description={messages.reports.auditExplorerSubtitle}
        actions={
          <>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.nav.reports}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports/approvals`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.reports.openApprovals}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports/audit`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.reports.clearFilters}
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.reports.auditCount} value={auditLogs.length.toString()} tone="blue" />
        <MetricCard label="TRANSACTION" value={String(entityCounts.TRANSACTION ?? 0)} tone="red" />
        <MetricCard label="PROJECT_BUDGET_LINE" value={String(entityCounts.PROJECT_BUDGET_LINE ?? 0)} tone="green" />
        <MetricCard label="UPDATE" value={String(actionCounts.UPDATE ?? 0)} tone="slate" />
      </section>

      <DataPanel title={messages.reports.filterTitle}>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.reports.actorKeyword}</span>
            <input name="actor" defaultValue={actorKeyword} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.reports.entityType}</span>
            <select name="entity" defaultValue={entityType} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="">{messages.reports.allEntities}</option>
              {entityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.reports.actionType}</span>
            <select name="action" defaultValue={actionType} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="">{messages.reports.allActions}</option>
              {actionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.projects.title}</span>
            <select name="projectId" defaultValue={projectId} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="">{messages.reports.allProjects}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.reports.fromDate}</span>
            <input type="date" name="from" defaultValue={fromDate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{messages.reports.toDate}</span>
            <input type="date" name="to" defaultValue={toDate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-6">
            <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">{messages.reports.applyFilters}</button>
            <Link href={`/${validLocale}/org/${orgSlug}/reports/audit`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{messages.reports.clearFilters}</Link>
          </div>
        </form>
      </DataPanel>

      <DataPanel title={messages.reports.auditLogTitle}>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">{messages.reports.noAuditResults}</p>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => {
              const actionTone = log.action === "DELETE" ? "red" : log.action === "UPDATE" ? "amber" : "green";

              return (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={log.action} tone={actionTone} />
                        <StatusBadge label={log.entityType} tone="slate" />
                        {log.project ? <StatusBadge label={log.project.name} tone="blue" /> : null}
                      </div>
                      <p className="font-semibold text-slate-950">{log.summary}</p>
                      <p className="text-xs text-slate-500">{messages.reports.actor}: {log.actor.name || log.actor.email || messages.common.noData}</p>
                    </div>
                    <p className="text-xs text-slate-500">{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{messages.reports.before}</p>
                      <p className="mt-2 break-all font-mono text-xs text-slate-600">{truncateJson(log.beforeJson) || messages.common.noData}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{messages.reports.after}</p>
                      <p className="mt-2 break-all font-mono text-xs text-slate-600">{truncateJson(log.afterJson) || messages.common.noData}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
