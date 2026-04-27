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
};

export default async function ReportsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

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
        type: true,
        amountInCents: true,
        budgetCategoryId: true,
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
