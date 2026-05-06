import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import RecentActivity from "@/components/dashboard/recent-activity";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const dashboardUi = validLocale === "th"
    ? { netLabel: "สุทธิ", overviewLabel: "ภาพรวมการทำงาน", separator: " | " }
    : { netLabel: "Net", overviewLabel: "Active overview", separator: " | " };

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

  const [
    projectCount,
    customerCount,
    totals,
    recentTransactions,
    openTaskCount,
    overdueTaskCount,
    upcomingAppointments,
    recentTasks,
    projectHealthRows,
    recentAuditLogs,
    // This month data
    thisMonthIncome,
    thisMonthExpense,
    thisMonthProjects,
    thisMonthCustomers,
    // Last month data
    lastMonthIncome,
    lastMonthExpense,
    lastMonthProjects,
    lastMonthCustomers,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId: organization.id } }),
    prisma.customer.count({ where: { organizationId: organization.id } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { organizationId: organization.id },
      _sum: { amountInCents: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId: organization.id },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
    }),
    prisma.projectTask.count({
      where: {
        organizationId: organization.id,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.projectTask.count({
      where: {
        organizationId: organization.id,
        dueDate: { lt: today },
        completedAt: null,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.surveyAppointment.findMany({
      where: {
        organizationId: organization.id,
        scheduledStart: { gte: today },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 4,
    }),
    prisma.projectTask.findMany({
      where: { organizationId: organization.id },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        name: true,
        status: true,
        budgetLines: { select: { plannedAmountInCents: true } },
        transactions: { select: { type: true, amountInCents: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: organization.id },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // This month income
    prisma.transaction.aggregate({
      where: {
        organizationId: organization.id,
        type: "INCOME",
        transactionDate: { gte: thisMonthStart },
      },
      _sum: { amountInCents: true },
    }),
    // This month expense
    prisma.transaction.aggregate({
      where: {
        organizationId: organization.id,
        type: "EXPENSE",
        transactionDate: { gte: thisMonthStart },
      },
      _sum: { amountInCents: true },
    }),
    // This month projects
    prisma.project.count({
      where: {
        organizationId: organization.id,
        createdAt: { gte: thisMonthStart },
      },
    }),
    // This month customers
    prisma.customer.count({
      where: {
        organizationId: organization.id,
        createdAt: { gte: thisMonthStart },
      },
    }),
    // Last month income
    prisma.transaction.aggregate({
      where: {
        organizationId: organization.id,
        type: "INCOME",
        transactionDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amountInCents: true },
    }),
    // Last month expense
    prisma.transaction.aggregate({
      where: {
        organizationId: organization.id,
        type: "EXPENSE",
        transactionDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amountInCents: true },
    }),
    // Last month projects
    prisma.project.count({
      where: {
        organizationId: organization.id,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    // Last month customers
    prisma.customer.count({
      where: {
        organizationId: organization.id,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
  ]);

  // Serialize audit logs for client component (Date โ’ ISO string)
  const serializedAuditLogs = recentAuditLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  const totalIncome = totals.find((item) => item.type === "INCOME")?._sum.amountInCents ?? 0;
  const totalExpense = totals.find((item) => item.type === "EXPENSE")?._sum.amountInCents ?? 0;
  const totalNet = totalIncome - totalExpense;
  const moneyFormatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Helper to calculate percentage change
  const calcTrend = (current: number, previous: number): { percentage: string; direction: "up" | "down" | "same"; trend: string } => {
    if (previous === 0 && current === 0) return { percentage: "0%", direction: "same", trend: "0%" };
    if (previous === 0) return { percentage: "+100%", direction: "up", trend: "+100%" };
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const rounded = Math.round(change * 10) / 10;
    const sign = rounded > 0 ? "+" : "";
    const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "same";
    return { percentage: `${sign}${rounded}%`, direction, trend: `${sign}${rounded}%` };
  };

  // Calculate trends for this month vs last month
  const incomeTrend = calcTrend(thisMonthIncome._sum.amountInCents ?? 0, lastMonthIncome._sum.amountInCents ?? 0);
  const expenseTrend = calcTrend(thisMonthExpense._sum.amountInCents ?? 0, lastMonthExpense._sum.amountInCents ?? 0);
  const projectTrend = calcTrend(thisMonthProjects, lastMonthProjects);
  const customerTrend = calcTrend(thisMonthCustomers, lastMonthCustomers);

  type StatItem = {
    label: string;
    value: string;
    tone: "blue" | "green" | "red" | "slate";
    trend?: string;
    trendTone?: "good" | "bad";
  };

  const stats: StatItem[] = [
    {
      label: messages.dashboard.totalProjects,
      value: projectCount.toString(),
      tone: "blue" as const,
      trend: projectTrend.trend,
      trendTone: projectTrend.direction === "up" ? "good" : projectTrend.direction === "down" ? "bad" : undefined,
    },
    {
      label: messages.dashboard.totalCustomers,
      value: customerCount.toString(),
      tone: "slate" as const,
      trend: customerTrend.trend,
      trendTone: customerTrend.direction === "up" ? "good" : customerTrend.direction === "down" ? "bad" : undefined,
    },
    {
      label: messages.dashboard.totalIncome,
      value: moneyFormatter.format(totalIncome / 100),
      tone: "green" as const,
      trend: incomeTrend.trend,
      trendTone: incomeTrend.direction === "up" ? "good" : incomeTrend.direction === "down" ? "bad" : undefined,
    },
    {
      label: messages.dashboard.totalExpense,
      value: moneyFormatter.format(totalExpense / 100),
      tone: "red" as const,
      trend: expenseTrend.trend,
      trendTone: expenseTrend.direction === "up" ? "bad" : expenseTrend.direction === "down" ? "good" : undefined,
    },
  ];
  const activeProjectCount = projectHealthRows.filter((project) => project.status === "ACTIVE").length;
  const completedProjectCount = projectHealthRows.filter((project) => project.status === "COMPLETED").length;
  const overBudgetProjectCount = projectHealthRows.filter((project) => {
    const planned = project.budgetLines.reduce((sum, line) => sum + line.plannedAmountInCents, 0);
    const expense = project.transactions.filter((transaction) => transaction.type === "EXPENSE").reduce((sum, transaction) => sum + transaction.amountInCents, 0);
    return planned > 0 && expense > planned;
  }).length;
  const projectHealthPreview = projectHealthRows.slice(0, 4).map((project) => {
    const planned = project.budgetLines.reduce((sum, line) => sum + line.plannedAmountInCents, 0);
    const income = project.transactions.filter((transaction) => transaction.type === "INCOME").reduce((sum, transaction) => sum + transaction.amountInCents, 0);
    const expense = project.transactions.filter((transaction) => transaction.type === "EXPENSE").reduce((sum, transaction) => sum + transaction.amountInCents, 0);
    const percentage = planned > 0 ? (expense / planned) * 100 : 0;
    const status: "healthy" | "warning" | "overBudget" =
      percentage >= 100 ? "overBudget" : percentage >= 80 ? "warning" : "healthy";
    return { id: project.id, name: project.name, planned, income, expense, net: income - expense, percentage, status };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.slug}
        title={messages.dashboard.greeting}
        description={messages.dashboard.subtitle}
        actions={
          <>
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects`}
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {messages.dashboard.projects}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/transactions`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.dashboard.transactions}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.dashboard.reports}
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} trend={item.trend} trendTone={item.trendTone} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label={messages.dashboard.openTasks} value={openTaskCount.toString()} tone="blue" />
        <MetricCard label={messages.dashboard.overdueTasks} value={overdueTaskCount.toString()} tone={overdueTaskCount > 0 ? "red" : "green"} />
        <MetricCard label={messages.dashboard.upcomingAppointments} value={upcomingAppointments.length.toString()} tone="slate" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label={messages.dashboard.activeProjects} value={activeProjectCount.toString()} tone="blue" />
        <MetricCard label={messages.dashboard.completedProjects} value={completedProjectCount.toString()} tone="green" />
        <MetricCard label={messages.dashboard.overBudgetProjects} value={overBudgetProjectCount.toString()} tone={overBudgetProjectCount > 0 ? "red" : "slate"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DataPanel
          title={messages.dashboard.quickActions}
          description={messages.dashboard.recentActivityDescription}
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {messages.dashboard.projects}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/customers`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {messages.dashboard.customers}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/transactions`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {messages.dashboard.transactions}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {messages.dashboard.reports}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{dashboardUi.netLabel}</p>
              <p className={`mt-2 text-2xl font-semibold ${totalNet >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {moneyFormatter.format(totalNet / 100)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{dashboardUi.overviewLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge label={messages.dashboard.projects} tone="blue" />
                <StatusBadge label={messages.dashboard.customers} tone="slate" />
                <StatusBadge label={messages.dashboard.transactions} tone="amber" />
              </div>
            </div>
          </div>
        </DataPanel>

        <DataPanel title={messages.dashboard.projectHealthTitle} description={messages.dashboard.projectHealthDescription}>
          {projectHealthPreview.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.dashboard.noProjects}</p>
          ) : (
            <div className="space-y-3">
              {projectHealthPreview.map((project) => {
                const pct = Math.min(project.percentage, 100);
                const barColor =
                  project.status === "overBudget" ? "bg-red-500" :
                  project.status === "warning" ? "bg-amber-400" : "bg-emerald-500";
                const labelColor =
                  project.status === "overBudget" ? "text-red-700" :
                  project.status === "warning" ? "text-amber-600" : "text-emerald-700";
                const statusLabel =
                  project.status === "overBudget" ? messages.reports.overBudget :
                  project.status === "warning" ? messages.reports.warning : messages.reports.healthy;
                return (
                  <Link key={project.id} href={`/${validLocale}/org/${orgSlug}/projects/${project.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-950">{project.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{messages.dashboard.netSnapshot}: {moneyFormatter.format(project.net / 100)}</p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${labelColor}`}>{project.planned > 0 ? `${project.percentage.toFixed(0)}%` : "0%"}</p>
                        <p className={`mt-0.5 text-[11px] font-medium ${labelColor}`}>{statusLabel}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.dashboard.recentActivity} description={messages.dashboard.recentActivityDescription}>
          <RecentActivity
            initialLogs={serializedAuditLogs}
            orgSlug={orgSlug}
            noData={messages.dashboard.noRecentActivity}
          />
        </DataPanel>

        <DataPanel title={messages.dashboard.workloadTitle} description={messages.dashboard.workloadDescription}>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm leading-7 text-slate-500">{messages.dashboard.noRecentTasks}</p>
            ) : (
              recentTasks.map((task) => (
                <Link key={task.id} href={`/${validLocale}/org/${orgSlug}/projects/${task.project.id}/tasks`} className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{task.project.name}{dashboardUi.separator}{task.assignedTo?.name || task.assignedTo?.email || messages.projects.noAssignee}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{task.progressPercent}%</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{messages.dashboard.upcomingAppointments}</p>
            <div className="mt-3 space-y-2">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">{messages.dashboard.noUpcomingAppointments}</p>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    <p className="font-medium text-slate-950">{appointment.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{appointment.project?.name || messages.transactions.noProject}{dashboardUi.separator}{appointment.scheduledStart.toISOString().slice(0, 16).replace("T", " ")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DataPanel>

        <DataPanel title={messages.transactions.recentTitle}>
          {recentTransactions.length === 0 ? (
            <p className="text-sm leading-7 text-slate-500">
              {messages.dashboard.recentActivityDescription}
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{transaction.category}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.project?.name || messages.transactions.noProject}
                      </p>
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
      </section>
    </div>
  );
}


