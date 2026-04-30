import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireSuperAdmin } from "@/lib/app-context";
import { ensureDefaultSubscriptionPlans, getOrganizationSeatSummary } from "@/lib/subscription";

type Props = {
  params: Promise<{ locale: string; organizationId: string }>;
};

export default async function AdminOrganizationDetailPage({ params }: Props) {
  const { locale, organizationId } = await params;
  const validLocale = await requireLocale(locale);
  await requireSuperAdmin(validLocale);
  const messages = getMessages(validLocale);

  const [organization, plans, seatSummary] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        },
        subscriptions: {
          include: { plan: true },
          orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
          take: 5,
        },
      },
    }),
    ensureDefaultSubscriptionPlans(),
    getOrganizationSeatSummary(organizationId),
  ]);

  if (!organization) {
    notFound();
  }

  const currentSubscription = seatSummary.subscription;
  const owner = organization.memberships.find((item) => item.role === "OWNER");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={organization.slug} title={organization.name} description={messages.admin.organizationDetailSubtitle} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={messages.members.seatsUsed} value={seatSummary.seatLimit === null ? `${seatSummary.usedSeats}` : `${seatSummary.usedSeats} / ${seatSummary.seatLimit}`} tone="blue" />
        <MetricCard label={messages.members.currentPlan} value={currentSubscription?.plan.name || messages.members.noSubscription} tone="slate" />
        <MetricCard label={messages.admin.ownerEmail} value={owner?.user.email || messages.common.noData} tone="green" />
        <MetricCard label={messages.reports.status} value={organization.archivedAt ? messages.admin.archivedStatus : messages.admin.activeStatus} tone={organization.archivedAt ? "red" : "green"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DataPanel title={messages.admin.editOrganizationTitle}>
          <form action={`/api/admin/organizations/${organization.id}`} method="POST" className="space-y-4">
            <input type="hidden" name="locale" value={validLocale} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationName}</span>
                <input name="name" defaultValue={organization.name} required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationSlug}</span>
                <input name="slug" defaultValue={organization.slug} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.ownerEmail}</span>
                <input name="ownerEmail" type="email" defaultValue={owner?.user.email || ""} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.organizationDescription}</span>
                <textarea name="description" rows={4} defaultValue={organization.description || ""} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
              {messages.common.save}
            </button>
          </form>
        </DataPanel>

        <DataPanel title={messages.admin.subscriptionTitle}>
          <form action={`/api/admin/organizations/${organization.id}/subscription`} method="POST" className="space-y-4">
            <input type="hidden" name="locale" value={validLocale} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.subscriptionPlan}</span>
                <select name="planId" defaultValue={currentSubscription?.planId || plans[0]?.id} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{`${plan.name} (${plan.billingInterval})`}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.reports.status}</span>
                <select name="status" defaultValue={currentSubscription?.status || "ACTIVE"} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELED">CANCELED</option>
                  <option value="LIFETIME">LIFETIME</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.seatLimitOverride}</span>
                <input name="seatLimitOverride" type="number" min={0} defaultValue={currentSubscription?.seatLimitOverride ?? ""} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.startedAt}</span>
                <input name="startedAt" type="date" defaultValue={currentSubscription?.startedAt.toISOString().slice(0, 10) ?? ""} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.renewAt}</span>
                <input name="renewAt" type="date" defaultValue={currentSubscription?.renewAt?.toISOString().slice(0, 10) ?? ""} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{messages.admin.adminNote}</span>
                <textarea name="note" rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
            <button type="submit" className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">
              {messages.admin.assignSubscriptionAction}
            </button>
          </form>
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DataPanel title={messages.admin.archiveTitle}>
          <form action={`/api/admin/organizations/${organization.id}/archive`} method="POST" className="space-y-4">
            <input type="hidden" name="locale" value={validLocale} />
            <input type="hidden" name="action" value={organization.archivedAt ? "restore" : "archive"} />
            <p className="text-sm leading-7 text-slate-500">{messages.admin.archiveDescription}</p>
            <button
              type="submit"
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${organization.archivedAt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {organization.archivedAt ? messages.admin.restoreOrganizationAction : messages.admin.archiveOrganizationAction}
            </button>
          </form>
        </DataPanel>

        <DataPanel title={messages.admin.membersSnapshotTitle}>
          <div className="space-y-3">
            {organization.memberships.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-950">{item.user.name || item.user.email}</p>
                <p className="mt-1 text-sm text-slate-500">{item.user.email}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{item.role}</p>
              </div>
            ))}
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
