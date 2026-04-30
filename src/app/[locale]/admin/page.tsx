import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireSuperAdmin } from "@/lib/app-context";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);
  await requireSuperAdmin(validLocale);
  const messages = getMessages(validLocale);

  const [organizations, organizationCount, archivedCount, usersCount, plans] = await Promise.all([
    prisma.organization.findMany({
      include: {
        memberships: {
          where: { role: "OWNER" },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          take: 1,
        },
        subscriptions: {
          include: { plan: true },
          orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.organization.count(),
    prisma.organization.count({ where: { archivedAt: { not: null } } }),
    prisma.user.count(),
    ensureDefaultSubscriptionPlans(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Control"
        title={messages.admin.dashboardTitle}
        description={messages.admin.dashboardSubtitle}
        actions={
          <Link
            href={`/${validLocale}/admin/organizations`}
            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {messages.admin.organizationsTitle}
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.admin.totalOrganizations} value={organizationCount.toString()} tone="blue" />
        <MetricCard label={messages.admin.totalUsers} value={usersCount.toString()} tone="green" />
        <MetricCard label={messages.admin.totalPlans} value={plans.length.toString()} tone="slate" />
        <MetricCard label={messages.admin.archivedOrganizations} value={archivedCount.toString()} tone={archivedCount > 0 ? "red" : "slate"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataPanel title={messages.admin.createOrganizationTitle} description={messages.admin.createOrganizationSubtitle}>
          <form action="/api/admin/organizations" method="POST" className="space-y-4">
            <input type="hidden" name="locale" value={validLocale} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationName}</span>
                <input name="name" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationSlug}</span>
                <input name="slug" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.ownerEmail}</span>
                <input name="ownerEmail" type="email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationDescription}</span>
                <textarea name="description" rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>

            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
              {messages.admin.createOrganizationAction}
            </button>
          </form>
        </DataPanel>

        <DataPanel title={messages.admin.latestOrganizationsTitle} description={messages.admin.latestOrganizationsSubtitle}>
          <div className="space-y-3">
            {organizations.map((organization) => {
              const owner = organization.memberships[0]?.user;
              const subscription = organization.subscriptions[0];

              return (
                <div key={organization.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{organization.name}</p>
                      <p className="mt-1 text-sm text-slate-500">/{organization.slug}</p>
                      <p className="mt-2 text-sm text-slate-500">{owner?.name || owner?.email || messages.common.noData}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {organization.archivedAt ? messages.admin.archivedStatus : subscription?.plan.name || messages.members.noSubscription}
                      </p>
                    </div>
                    <Link
                      href={`/${validLocale}/admin/organizations/${organization.id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {messages.admin.manageOrganizationAction}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </DataPanel>
      </div>

      <DataPanel title={messages.admin.availablePlansTitle} description={messages.admin.availablePlansSubtitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-950">{plan.name}</p>
              <p className="mt-2 text-sm text-slate-500">{plan.billingInterval}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                {plan.seatLimit === null ? messages.admin.unlimitedSeats : `${plan.seatLimit} seats`}
              </p>
            </div>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}
