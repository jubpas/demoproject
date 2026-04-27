import Link from "next/link";
import { BUDGET_APPROVAL_THRESHOLD_IN_CENTS } from "@/lib/approvals";
import prisma from "@/lib/db";
import { ApprovalRequestManager } from "@/components/org/approval-request-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canApproveBudgetRequests } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function ApprovalsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [pendingRequests, recentRequests] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: {
        organizationId: organization.id,
        status: "PENDING",
      },
      include: {
        project: { select: { name: true } },
        requestedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.approvalRequest.findMany({
      where: {
        organizationId: organization.id,
        status: { in: ["APPROVED", "REJECTED"] },
      },
      include: {
        project: { select: { name: true } },
        requestedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { respondedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.slug}
        title={messages.reports.approvalsTitle}
        description={messages.reports.approvalsSubtitle}
        actions={
          <>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.nav.reports}
            </Link>
            <Link
              href={`/${validLocale}/org/${orgSlug}/reports/audit`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {messages.reports.auditExplorer}
            </Link>
          </>
        }
      />

      <ApprovalRequestManager
        locale={validLocale}
        orgSlug={orgSlug}
        canApprove={canApproveBudgetRequests(membership.role)}
        thresholdInCents={BUDGET_APPROVAL_THRESHOLD_IN_CENTS}
        pendingRequests={pendingRequests.map((item) => ({
          id: item.id,
          status: item.status,
          summary: item.summary,
          action: item.action,
          entityType: item.entityType,
          projectName: item.project?.name ?? null,
          requestedByName: item.requestedBy.name || item.requestedBy.email,
          approvedByName: item.approvedBy?.name || item.approvedBy?.email || null,
          responseNote: item.responseNote,
          createdAt: item.createdAt.toISOString(),
          respondedAt: item.respondedAt?.toISOString() ?? null,
        }))}
        recentRequests={recentRequests.map((item) => ({
          id: item.id,
          status: item.status,
          summary: item.summary,
          action: item.action,
          entityType: item.entityType,
          projectName: item.project?.name ?? null,
          requestedByName: item.requestedBy.name || item.requestedBy.email,
          approvedByName: item.approvedBy?.name || item.approvedBy?.email || null,
          responseNote: item.responseNote,
          createdAt: item.createdAt.toISOString(),
          respondedAt: item.respondedAt?.toISOString() ?? null,
        }))}
        copy={{ common: messages.common, reports: messages.reports }}
      />
    </div>
  );
}
