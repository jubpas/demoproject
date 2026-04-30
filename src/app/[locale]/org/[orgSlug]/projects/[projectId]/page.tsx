import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectBudgetManager } from "@/components/org/project-budget-manager";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";
import { isTaskOverdue } from "@/lib/project-tasks";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; projectId: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, orgSlug, projectId } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [project, recentTransactions, projectTransactions, budgetCategories, budgetRevisions, auditLogs] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: organization.id,
      },
      include: {
        customer: true,
        quotations: {
          orderBy: { createdAt: "desc" },
        },
        surveyAppointments: {
          orderBy: { scheduledStart: "desc" },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
        },
        budgetLines: {
          include: {
            budgetCategory: true,
          },
          orderBy: {
            budgetCategory: {
              sortOrder: "asc",
            },
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        projectId,
        organizationId: organization.id,
      },
      orderBy: { transactionDate: "desc" },
      take: 8,
      include: {
        budgetCategory: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        projectId,
        organizationId: organization.id,
      },
      select: {
        type: true,
        amountInCents: true,
        budgetCategoryId: true,
      },
    }),
    ensureOrganizationBudgetCategories(organization.id),
    prisma.budgetRevision.findMany({
      where: {
        projectId,
        organizationId: organization.id,
      },
      include: {
        changedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.auditLog.findMany({
      where: {
        projectId,
        organizationId: organization.id,
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (!project) {
    notFound();
  }

  const moneyFormatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const incomeTotal = projectTransactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + item.amountInCents, 0);
  const expenseTotal = projectTransactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + item.amountInCents, 0);
  const netTotal = incomeTotal - expenseTotal;
  const totalPlannedInCents = project.budgetLines.reduce((sum, item) => sum + item.plannedAmountInCents, 0);
  const actualExpenseByCategory = new Map<string, number>();

  for (const transaction of projectTransactions) {
    if (transaction.type !== "EXPENSE" || !transaction.budgetCategoryId) {
      continue;
    }

    actualExpenseByCategory.set(
      transaction.budgetCategoryId,
      (actualExpenseByCategory.get(transaction.budgetCategoryId) ?? 0) + transaction.amountInCents,
    );
  }

  const unassignedExpenseInCents = projectTransactions
    .filter((item) => item.type === "EXPENSE" && !item.budgetCategoryId)
    .reduce((sum, item) => sum + item.amountInCents, 0);

  const budgetLines = project.budgetLines.map((line) => {
    const actualAmountInCents = actualExpenseByCategory.get(line.budgetCategoryId) ?? 0;
    return {
      id: line.id,
      budgetCategoryId: line.budgetCategoryId,
      budgetCategoryName: line.budgetCategory.name,
      plannedAmountInCents: line.plannedAmountInCents,
      actualAmountInCents,
      varianceInCents: line.plannedAmountInCents - actualAmountInCents,
      note: line.note,
    };
  });

  const budgetUsagePercent = totalPlannedInCents > 0 ? (expenseTotal / totalPlannedInCents) * 100 : 0;

  const projectStatusMap = {
    ACTIVE: { label: messages.projects.active, tone: "blue" as const },
    CANCELLED: { label: messages.projects.cancelled, tone: "red" as const },
    COMPLETED: { label: messages.projects.completed, tone: "green" as const },
    ON_HOLD: { label: messages.projects.onHold, tone: "amber" as const },
    PLANNING: { label: messages.projects.planning, tone: "slate" as const },
  };

  const quotationStatusMap = {
    ACCEPTED: { label: messages.quotations.accepted, tone: "green" as const },
    DRAFT: { label: messages.quotations.draft, tone: "slate" as const },
    EXPIRED: { label: messages.quotations.expired, tone: "amber" as const },
    REJECTED: { label: messages.quotations.rejected, tone: "red" as const },
    SENT: { label: messages.quotations.sent, tone: "blue" as const },
  };

  const appointmentStatusMap = {
    CANCELLED: { label: messages.surveyAppointments.cancelled, tone: "red" as const },
    COMPLETED: { label: messages.surveyAppointments.completed, tone: "green" as const },
    CONFIRMED: { label: messages.surveyAppointments.confirmed, tone: "blue" as const },
    PENDING: { label: messages.surveyAppointments.pending, tone: "slate" as const },
    RESCHEDULED: { label: messages.surveyAppointments.rescheduled, tone: "amber" as const },
  };

  const projectStatus = projectStatusMap[project.status];
  const openTasks = project.tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED");
  const completedTasks = project.tasks.filter((task) => task.status === "DONE");
  const overdueTasks = project.tasks.filter((task) => isTaskOverdue({ dueDate: task.dueDate, completedAt: task.completedAt, status: task.status }));
  const upcomingMilestones = [
    ...project.tasks.filter((task) => task.dueDate && task.status !== "DONE" && task.status !== "CANCELLED").map((task) => ({ id: task.id, title: task.title, date: task.dueDate })),
    ...project.surveyAppointments.map((appointment) => ({ id: appointment.id, title: appointment.title, date: appointment.scheduledStart })),
  ]
    .filter((item): item is { id: string; title: string; date: Date } => Boolean(item.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);
  const revisionActionMap = {
    CREATE: messages.projects.revisionCreated,
    UPDATE: messages.projects.revisionUpdated,
    DELETE: messages.projects.revisionDeleted,
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.code || organization.slug}
        title={project.name}
        description={messages.projects.detailSubtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects/${project.id}/tasks`}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {messages.projects.viewTasks}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects/${project.id}/schedule`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.projects.viewSchedule}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.projects.title}
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.projects.budget} value={totalPlannedInCents > 0 ? moneyFormatter.format(totalPlannedInCents / 100) : project.budgetInCents ? moneyFormatter.format(project.budgetInCents / 100) : messages.common.noData} tone="blue" />
        <MetricCard label={messages.transactions.income} value={moneyFormatter.format(incomeTotal / 100)} tone="green" />
        <MetricCard label={messages.transactions.expense} value={moneyFormatter.format(expenseTotal / 100)} tone="red" />
        <MetricCard label="Net" value={moneyFormatter.format(netTotal / 100)} tone={netTotal >= 0 ? "green" : "red"} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.projects.openTasks} value={String(openTasks.length)} tone="blue" />
        <MetricCard label={messages.projects.overdueTasks} value={String(overdueTasks.length)} tone={overdueTasks.length > 0 ? "red" : "green"} />
        <MetricCard label={messages.projects.completedTasks} value={String(completedTasks.length)} tone="green" />
        <MetricCard label={messages.projects.upcomingMilestones} value={String(upcomingMilestones.length)} tone="slate" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DataPanel title={messages.projects.overview}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">{messages.projects.status}</p>
              <div className="mt-2"><StatusBadge label={projectStatus.label} tone={projectStatus.tone} /></div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">{messages.projects.customer}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{project.customer?.name || messages.projects.noCustomer}</p>
              <p className="mt-1 text-sm text-slate-500">{project.customer?.companyName || project.customer?.email || project.customer?.phone || messages.common.noData}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">{messages.projects.location}</p>
              <p className="mt-2 text-slate-950">{project.location || messages.common.noData}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">{messages.projects.startDate} / {messages.projects.endDate}</p>
              <p className="mt-2 text-slate-950">{project.startDate ? project.startDate.toISOString().slice(0, 10) : messages.common.noData} - {project.endDate ? project.endDate.toISOString().slice(0, 10) : messages.common.noData}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-slate-500">{messages.projects.description}</p>
              <p className="mt-2 text-slate-950">{project.description || messages.common.noData}</p>
            </div>
          </div>
        </DataPanel>

        <DataPanel title={messages.projects.financialOverview}>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <div className="flex items-center justify-between"><span>{messages.projects.budget}</span><span>{totalPlannedInCents > 0 ? moneyFormatter.format(totalPlannedInCents / 100) : project.budgetInCents ? moneyFormatter.format(project.budgetInCents / 100) : messages.common.noData}</span></div>
            <div className="flex items-center justify-between"><span>{messages.transactions.income}</span><span>{moneyFormatter.format(incomeTotal / 100)}</span></div>
            <div className="flex items-center justify-between"><span>{messages.transactions.expense}</span><span>{moneyFormatter.format(expenseTotal / 100)}</span></div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between font-semibold text-slate-950"><span>Net</span><span>{moneyFormatter.format(netTotal / 100)}</span></div>
          </div>
        </DataPanel>
      </div>

      <ProjectBudgetManager
        locale={validLocale}
        orgSlug={orgSlug}
        projectId={project.id}
        canManage={canManageOrganizationData(membership.role)}
        budgetCategories={budgetCategories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        budgetLines={budgetLines}
        summary={{
          totalPlannedInCents,
          totalActualInCents: expenseTotal,
          remainingBudgetInCents: totalPlannedInCents - expenseTotal,
          varianceInCents: totalPlannedInCents - expenseTotal,
          budgetUsagePercent,
          unassignedExpenseInCents,
        }}
        copy={{ common: messages.common, projects: messages.projects }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title={messages.projects.recentTasks} actions={<Link href={`/${validLocale}/org/${orgSlug}/projects/${project.id}/tasks`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">{messages.projects.viewTasks}</Link>}>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.projects.noRecentTasks}</p>
          ) : (
            <div className="space-y-3">
              {project.tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{task.assignedTo?.name || task.assignedTo?.email || messages.projects.noAssignee}</p>
                    </div>
                    <p className="text-xs font-medium text-slate-500">{task.progressPercent}%</p>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{messages.projects.dueDate}: {task.dueDate ? task.dueDate.toISOString().slice(0, 10) : messages.common.noData}</p>
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.projects.recentBudgetRevisions}>
          {budgetRevisions.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.projects.noRevisions}</p>
          ) : (
            <div className="space-y-3">
              {budgetRevisions.map((revision) => (
                <div key={revision.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{revision.budgetCategoryName}</p>
                      <p className="mt-1 text-xs text-slate-500">{revisionActionMap[revision.action as keyof typeof revisionActionMap] ?? revision.action}</p>
                    </div>
                    <p className="text-xs text-slate-500">{revision.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p>{messages.projects.beforeAmount}: {revision.previousAmountInCents === null ? messages.common.noData : moneyFormatter.format(revision.previousAmountInCents / 100)}</p>
                    <p>{messages.projects.afterAmount}: {revision.newAmountInCents === null ? messages.common.noData : moneyFormatter.format(revision.newAmountInCents / 100)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{messages.projects.changedBy}: {revision.changedBy.name || revision.changedBy.email || messages.common.noData}</p>
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.projects.recentAuditLog}>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.projects.noAuditLog}</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{log.summary}</p>
                      <p className="mt-1 text-xs text-slate-500">{log.entityType} · {log.action}</p>
                    </div>
                    <p className="text-xs text-slate-500">{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{messages.projects.changedBy}: {log.actor.name || log.actor.email || messages.common.noData}</p>
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title={messages.projects.relatedQuotations}>
          {project.quotations.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.projects.noRelatedQuotations}</p>
          ) : (
            <div className="space-y-3">
              {project.quotations.map((quotation) => {
                const status = quotationStatusMap[quotation.status];
                return (
                  <div key={quotation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{quotation.quotationNumber}</p>
                        <p className="mt-1 text-sm text-slate-500">{quotation.issueDate.toISOString().slice(0, 10)}</p>
                      </div>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                      <span>{messages.quotations.total}</span>
                      <span>{moneyFormatter.format(quotation.totalInCents / 100)}</span>
                    </div>
                    <Link href={`/${validLocale}/org/${orgSlug}/quotations/${quotation.id}`} className="mt-4 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">
                      {messages.common.view}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.projects.relatedAppointments}>
          {project.surveyAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.projects.noRelatedAppointments}</p>
          ) : (
            <div className="space-y-3">
              {project.surveyAppointments.map((appointment) => {
                const status = appointmentStatusMap[appointment.status];
                return (
                  <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{appointment.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{appointment.location}</p>
                      </div>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{appointment.scheduledStart.toISOString().slice(0, 16).replace("T", " ")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </DataPanel>
      </div>

        <DataPanel title={messages.projects.recentTransactions}>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-500">{messages.projects.noRecentTransactions}</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{transaction.category}</p>
                    <p className="mt-1 text-xs text-slate-500">{transaction.transactionDate.toISOString().slice(0, 10)}</p>
                    <p className="mt-1 text-xs text-slate-500">{transaction.budgetCategory?.name || messages.transactions.noBudgetCategory}</p>
                  </div>
                  <p className={transaction.type === "INCOME" ? "text-emerald-700" : "text-red-700"}>
                    {moneyFormatter.format(transaction.amountInCents / 100)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
