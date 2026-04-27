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
};

export default async function DashboardPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [projectCount, customerCount, totals, recentTransactions] = await Promise.all([
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
  ]);

  const totalIncome = totals.find((item) => item.type === "INCOME")?._sum.amountInCents ?? 0;
  const totalExpense = totals.find((item) => item.type === "EXPENSE")?._sum.amountInCents ?? 0;
  const totalNet = totalIncome - totalExpense;
  const moneyFormatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const stats = [
    { label: messages.dashboard.totalProjects, value: projectCount.toString(), tone: "blue" as const },
    { label: messages.dashboard.totalCustomers, value: customerCount.toString(), tone: "slate" as const },
    { label: messages.dashboard.totalIncome, value: moneyFormatter.format(totalIncome / 100), tone: "green" as const },
    { label: messages.dashboard.totalExpense, value: moneyFormatter.format(totalExpense / 100), tone: "red" as const },
  ];

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
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
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
              <p className="text-sm text-slate-500">Net</p>
              <p className={`mt-2 text-2xl font-semibold ${totalNet >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {moneyFormatter.format(totalNet / 100)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Active overview</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge label={messages.dashboard.projects} tone="blue" />
                <StatusBadge label={messages.dashboard.customers} tone="slate" />
                <StatusBadge label={messages.dashboard.transactions} tone="amber" />
              </div>
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
