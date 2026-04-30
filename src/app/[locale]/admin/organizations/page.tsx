import Link from "next/link";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireSuperAdmin } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminOrganizationsPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);
  await requireSuperAdmin(validLocale);
  const messages = getMessages(validLocale);

  const organizations = await prisma.organization.findMany({
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
      },
      subscriptions: {
        include: { plan: true },
        orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader title={messages.admin.organizationsTitle} description={messages.admin.organizationsSubtitle} />

      <DataPanel title={messages.admin.organizationsTitle}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">{messages.admin.organizationName}</th>
                <th className="pb-3 font-medium">{messages.admin.ownerEmail}</th>
                <th className="pb-3 font-medium">{messages.members.currentPlan}</th>
                <th className="pb-3 font-medium">{messages.reports.status}</th>
                <th className="pb-3 text-right font-medium">{messages.common.view}</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => {
                const owner = organization.memberships[0]?.user;
                const subscription = organization.subscriptions[0];

                return (
                  <tr key={organization.id} className="border-b border-slate-100 align-top last:border-b-0">
                    <td className="py-4">
                      <p className="font-medium text-slate-950">{organization.name}</p>
                      <p className="mt-1 text-xs text-slate-500">/{organization.slug}</p>
                    </td>
                    <td className="py-4">{owner?.email || messages.common.noData}</td>
                    <td className="py-4">{subscription?.plan.name || messages.members.noSubscription}</td>
                    <td className="py-4">{organization.archivedAt ? messages.admin.archivedStatus : messages.admin.activeStatus}</td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/${validLocale}/admin/organizations/${organization.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {messages.admin.manageOrganizationAction}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </div>
  );
}
