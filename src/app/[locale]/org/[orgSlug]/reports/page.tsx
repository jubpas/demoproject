import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    projectId?: string | string[];
    type?: string | string[];
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

export default async function ReportsPage({ params, searchParams }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const resolvedSearchParams = await searchParams;
  const fromDateValue = getSingleValue(resolvedSearchParams.from).trim();
  const toDateValue = getSingleValue(resolvedSearchParams.to).trim();
  const projectIdFilter = getSingleValue(resolvedSearchParams.projectId).trim();
  const typeFilter = getSingleValue(resolvedSearchParams.type).trim();
  const fromDate = parseDateBoundary(fromDateValue, false);
  const toDate = parseDateBoundary(toDateValue, true);

  const [projects, transactions, budgetCategories] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: organization.id },
      include: {
        customer: { select: { name: true } },
        budgetLines: {
          include: {
            budgetCategory: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { organizationId: organization.id },
      select: {
        projectId: true,
        project: { select: { id: true, name: true } },
        type: true,
        category: true,
        amountInCents: true,
        budgetCategoryId: true,
        transactionDate: true,
      },
    }),
    ensureOrganizationBudgetCategories(organization.id),
  ]);

  const moneyFormatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const expenseByProject = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();
  const profitLossByProject = new Map<string, { projectId: string | null; name: string; incomeInCents: number; expenseInCents: number }>();
  const profitLossByCategory = new Map<string, { category: string; incomeInCents: number; expenseInCents: number }>();
  let totalUnassignedExpense = 0;

  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE") {
      continue;
    }

    if (transaction.projectId) {
      expenseByProject.set(transaction.projectId, (expenseByProject.get(transaction.projectId) ?? 0) + transaction.amountInCents);
    }

    if (transaction.budgetCategoryId) {
      expenseByCategory.set(transaction.budgetCategoryId, (expenseByCategory.get(transaction.budgetCategoryId) ?? 0) + transaction.amountInCents);
    } else {
      totalUnassignedExpense += transaction.amountInCents;
    }
  }

  const profitLossTransactions = transactions.filter((transaction) => {
    if (fromDate && transaction.transactionDate < fromDate) return false;
    if (toDate && transaction.transactionDate > toDate) return false;
    if (projectIdFilter && transaction.projectId !== projectIdFilter) return false;
    if (typeFilter && transaction.type !== typeFilter) return false;
    return true;
  });

  for (const transaction of profitLossTransactions) {
    const projectKey = transaction.projectId ?? "UNPROJECTED";
    const projectRow = profitLossByProject.get(projectKey) ?? {
      projectId: transaction.projectId,
      name: transaction.project?.name ?? messages.transactions.noProject,
      incomeInCents: 0,
      expenseInCents: 0,
    };
    const categoryKey = transaction.category || messages.reports.uncategorized;
    const categoryRow = profitLossByCategory.get(categoryKey) ?? {
      category: categoryKey,
      incomeInCents: 0,
      expenseInCents: 0,
    };

    if (transaction.type === "INCOME") {
      projectRow.incomeInCents += transaction.amountInCents;
      categoryRow.incomeInCents += transaction.amountInCents;
    } else {
      projectRow.expenseInCents += transaction.amountInCents;
      categoryRow.expenseInCents += transaction.amountInCents;
    }

    profitLossByProject.set(projectKey, projectRow);
    profitLossByCategory.set(categoryKey, categoryRow);
  }

  const projectRows = projects.map((project) => {
    const plannedInCents = project.budgetLines.reduce((sum, line) => sum + line.plannedAmountInCents, 0);
    const actualInCents = expenseByProject.get(project.id) ?? 0;
    const remainingInCents = plannedInCents - actualInCents;
    const usagePercent = plannedInCents > 0 ? (actualInCents / plannedInCents) * 100 : 0;
    const status = usagePercent > 100 ? "overBudget" : usagePercent >= 80 ? "warning" : "healthy";

    return {
      id: project.id,
      name: project.name,
      customerName: project.customer?.name ?? messages.projects.noCustomer,
      plannedInCents,
      actualInCents,
      remainingInCents,
      varianceInCents: remainingInCents,
      usagePercent,
      status,
    };
  });

  const totalPlannedInCents = projectRows.reduce((sum, row) => sum + row.plannedInCents, 0);
  const totalActualInCents = projectRows.reduce((sum, row) => sum + row.actualInCents, 0);
  const totalRemainingInCents = totalPlannedInCents - totalActualInCents;
  const overBudgetCount = projectRows.filter((row) => row.actualInCents > row.plannedInCents && row.plannedInCents > 0).length;
  const organizationUsagePercent = totalPlannedInCents > 0 ? (totalActualInCents / totalPlannedInCents) * 100 : 0;

  const categoryRows = budgetCategories.map((category) => ({
    id: category.id,
    name: category.name,
    actualInCents: expenseByCategory.get(category.id) ?? 0,
  })).filter((row) => row.actualInCents > 0);
  const profitLossIncomeInCents = profitLossTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + transaction.amountInCents, 0);
  const profitLossExpenseInCents = profitLossTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + transaction.amountInCents, 0);
  const netProfitInCents = profitLossIncomeInCents - profitLossExpenseInCents;
  const profitMargin = profitLossIncomeInCents > 0 ? (netProfitInCents / profitLossIncomeInCents) * 100 : 0;
  const profitLossProjectRows = Array.from(profitLossByProject.values())
    .map((row) => ({ ...row, netInCents: row.incomeInCents - row.expenseInCents }))
    .sort((a, b) => Math.abs(b.netInCents) - Math.abs(a.netInCents));
  const profitLossCategoryRows = Array.from(profitLossByCategory.values())
    .map((row) => ({ ...row, netInCents: row.incomeInCents - row.expenseInCents }))
    .sort((a, b) => Math.abs(b.netInCents) - Math.abs(a.netInCents))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.slug}
        title={messages.reports.title}
        description={messages.reports.subtitle}
        actions={
          <>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports/approvals`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.reports.openApprovals}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports/audit`}
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {messages.reports.openAuditExplorer}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/projects`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.dashboard.projects}
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={messages.reports.totalPlanned} value={moneyFormatter.format(totalPlannedInCents / 100)} tone="blue" />
        <MetricCard label={messages.reports.totalActual} value={moneyFormatter.format(totalActualInCents / 100)} tone="red" />
        <MetricCard label={messages.reports.totalRemaining} value={moneyFormatter.format(totalRemainingInCents / 100)} tone={totalRemainingInCents >= 0 ? "green" : "red"} />
        <MetricCard label={messages.reports.overBudgetProjects} value={overBudgetCount.toString()} tone={overBudgetCount > 0 ? "red" : "slate"} />
        <MetricCard label={messages.reports.budgetUsage} value={`${organizationUsagePercent.toFixed(1)}%`} tone="slate" />
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="absolute right-10 top-0 h-40 w-40 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{messages.reports.periodLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{messages.reports.profitLossTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{messages.reports.profitLossSubtitle}</p>
          </div>
          <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2">
              <span className="text-xs font-medium text-slate-300">{messages.reports.from}</span>
              <input type="date" name="from" defaultValue={fromDateValue} className="w-full rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-slate-300">{messages.reports.to}</span>
              <input type="date" name="to" defaultValue={toDateValue} className="w-full rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-slate-300">{messages.reports.project}</span>
              <select name="projectId" defaultValue={projectIdFilter} className="w-full rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400">
                <option value="">{messages.reports.selectProject}</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-slate-300">{messages.transactions.type}</span>
              <select name="type" defaultValue={typeFilter} className="w-full rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400">
                <option value="">{messages.reports.allTypes}</option>
                <option value="INCOME">{messages.reports.income}</option>
                <option value="EXPENSE">{messages.reports.expense}</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
              <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">{messages.reports.apply}</button>
              <Link href={`/${validLocale}/org/${orgSlug}/reports`} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10">{messages.reports.clearAll}</Link>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.reports.incomeThisPeriod} value={moneyFormatter.format(profitLossIncomeInCents / 100)} tone="green" />
        <MetricCard label={messages.reports.expenseThisPeriod} value={moneyFormatter.format(profitLossExpenseInCents / 100)} tone="red" />
        <MetricCard label={messages.reports.netThisPeriod} value={moneyFormatter.format(netProfitInCents / 100)} tone={netProfitInCents >= 0 ? "green" : "red"} />
        <MetricCard label={messages.reports.profitMargin} value={`${profitMargin.toFixed(1)}%`} tone="blue" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataPanel title={messages.reports.byProject} description={messages.reports.profitLossSubtitle}>
          {profitLossProjectRows.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.reports.noTransactions}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">{messages.reports.project}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.income}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.expense}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.netProfit}</th>
                    <th className="py-3 text-right">{messages.common.view}</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLossProjectRows.map((row) => (
                    <tr key={row.projectId ?? "UNPROJECTED"} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="py-4 pr-4 font-medium text-slate-950">{row.name}</td>
                      <td className="py-4 pr-4 text-right text-emerald-700">{moneyFormatter.format(row.incomeInCents / 100)}</td>
                      <td className="py-4 pr-4 text-right text-red-700">{moneyFormatter.format(row.expenseInCents / 100)}</td>
                      <td className={`py-4 pr-4 text-right font-semibold ${row.netInCents >= 0 ? "text-emerald-700" : "text-red-700"}`}>{moneyFormatter.format(row.netInCents / 100)}</td>
                      <td className="py-4 text-right">
                        {row.projectId ? (
                          <Link href={`/${validLocale}/org/${orgSlug}/projects/${row.projectId}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">{messages.reports.openProject}</Link>
                        ) : (
                          <span className="text-xs text-slate-400">{messages.common.noData}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.reports.byCategory}>
          {profitLossCategoryRows.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.reports.noTransactions}</p>
          ) : (
            <div className="space-y-3">
              {profitLossCategoryRows.map((row) => (
                <div key={row.category} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-950">{row.category}</p>
                    <p className={row.netInCents >= 0 ? "text-emerald-700" : "text-red-700"}>{moneyFormatter.format(row.netInCents / 100)}</p>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <p>{messages.reports.income}: {moneyFormatter.format(row.incomeInCents / 100)}</p>
                    <p>{messages.reports.expense}: {moneyFormatter.format(row.expenseInCents / 100)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataPanel title={messages.reports.projectTableTitle}>
          {projectRows.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.reports.noProjects}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">{messages.reports.project}</th>
                    <th className="py-3 pr-4">{messages.reports.customer}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.planned}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.actual}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.remaining}</th>
                    <th className="py-3 pr-4 text-right">{messages.reports.usage}</th>
                    <th className="py-3 pr-4">{messages.reports.status}</th>
                    <th className="py-3 text-right">{messages.common.view}</th>
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((row) => {
                    const tone = row.status === "overBudget" ? "red" : row.status === "warning" ? "amber" : "green";
                    const statusLabel = row.status === "overBudget" ? messages.reports.overBudget : row.status === "warning" ? messages.reports.warning : messages.reports.healthy;

                    return (
                      <tr key={row.id} className="border-b border-slate-100 align-top last:border-b-0">
                        <td className="py-4 pr-4 font-medium text-slate-950">{row.name}</td>
                        <td className="py-4 pr-4">{row.customerName}</td>
                        <td className="py-4 pr-4 text-right">{moneyFormatter.format(row.plannedInCents / 100)}</td>
                        <td className="py-4 pr-4 text-right">{moneyFormatter.format(row.actualInCents / 100)}</td>
                        <td className={`py-4 pr-4 text-right ${row.remainingInCents >= 0 ? "text-emerald-700" : "text-red-700"}`}>{moneyFormatter.format(row.remainingInCents / 100)}</td>
                        <td className="py-4 pr-4 text-right">{row.usagePercent.toFixed(1)}%</td>
                        <td className="py-4 pr-4"><StatusBadge label={statusLabel} tone={tone} /></td>
                        <td className="py-4 text-right">
                          <Link href={`/${validLocale}/org/${orgSlug}/projects/${row.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                            {messages.reports.openProject}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>

        <DataPanel title={messages.reports.categoryBreakdownTitle}>
          <div className="space-y-3">
            {categoryRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{row.name}</p>
                  <p>{moneyFormatter.format(row.actualInCents / 100)}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">{messages.reports.unassignedExpense}</p>
                <p>{moneyFormatter.format(totalUnassignedExpense / 100)}</p>
              </div>
            </div>
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
