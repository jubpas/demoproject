"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/dashboard/status-badge";

type ApprovalRequestItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  summary: string;
  action: string;
  entityType: string;
  projectName: string | null;
  requestedByName: string;
  approvedByName: string | null;
  responseNote: string | null;
  createdAt: string;
  respondedAt: string | null;
};

type Props = {
  locale: "th" | "en";
  orgSlug: string;
  canApprove: boolean;
  thresholdInCents: number;
  pendingRequests: ApprovalRequestItem[];
  recentRequests: ApprovalRequestItem[];
  copy: {
    common: {
      approve: string;
      reject: string;
      unauthorized: string;
      noData: string;
    };
    reports: {
      approvalSubmittedMetric: string;
      pendingApprovals: string;
      recentApprovals: string;
      requester: string;
      approver: string;
      requestedAt: string;
      respondedAt: string;
      responseNote: string;
      noPendingApprovals: string;
      noRecentApprovals: string;
      pending: string;
      approved: string;
      rejected: string;
      thresholdHint: string;
    };
  };
};

function getStatusMeta(status: ApprovalRequestItem["status"], copy: Props["copy"]) {
  switch (status) {
    case "APPROVED":
      return { label: copy.reports.approved, tone: "green" as const };
    case "REJECTED":
      return { label: copy.reports.rejected, tone: "red" as const };
    default:
      return { label: copy.reports.pending, tone: "amber" as const };
  }
}

export function ApprovalRequestManager({ locale, orgSlug, canApprove, thresholdInCents, pendingRequests, recentRequests, copy }: Props) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const moneyFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );

  async function submitDecision(requestId: string, action: "approve" | "reject") {
    if (!canApprove) {
      setError(copy.common.unauthorized);
      return;
    }

    setSubmittingId(requestId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/approval-requests/${requestId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(action === "approve" ? copy.common.approve : copy.common.reject);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={copy.reports.approvalSubmittedMetric} value={String(pendingRequests.length + recentRequests.length)} tone="blue" />
        <MetricCard label={copy.reports.pendingApprovals} value={String(pendingRequests.length)} tone="slate" />
        <MetricCard label={copy.reports.approved} value={String(recentRequests.filter((item) => item.status === "APPROVED").length)} tone="green" />
        <MetricCard label={copy.reports.rejected} value={String(recentRequests.filter((item) => item.status === "REJECTED").length)} tone="red" />
      </section>

      <DataPanel title={copy.reports.pendingApprovals} description={`${copy.reports.thresholdHint}: ${moneyFormatter.format(thresholdInCents / 100)}`}>
        <div className="space-y-4">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500">{copy.reports.noPendingApprovals}</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const status = getStatusMeta(request.status, copy);
                return (
                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={status.label} tone={status.tone} />
                          <StatusBadge label={request.entityType} tone="slate" />
                          <StatusBadge label={request.action} tone="blue" />
                        </div>
                        <p className="font-semibold text-slate-950">{request.summary}</p>
                        <p className="text-xs text-slate-500">{copy.reports.requester}: {request.requestedByName}</p>
                        <p className="text-xs text-slate-500">{copy.reports.requestedAt}: {request.createdAt.slice(0, 16).replace("T", " ")}</p>
                        <p className="text-xs text-slate-500">{request.projectName || copy.common.noData}</p>
                      </div>
                      {canApprove ? (
                        <div className="flex gap-2">
                          <button type="button" disabled={submittingId === request.id} onClick={() => void submitDecision(request.id, "approve")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60">{copy.common.approve}</button>
                          <button type="button" disabled={submittingId === request.id} onClick={() => void submitDecision(request.id, "reject")} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-60">{copy.common.reject}</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DataPanel>

      <DataPanel title={copy.reports.recentApprovals}>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-slate-500">{copy.reports.noRecentApprovals}</p>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((request) => {
              const status = getStatusMeta(request.status, copy);
              return (
                <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={status.label} tone={status.tone} />
                        <StatusBadge label={request.entityType} tone="slate" />
                        <StatusBadge label={request.action} tone="blue" />
                      </div>
                      <p className="font-semibold text-slate-950">{request.summary}</p>
                      <p className="text-xs text-slate-500">{copy.reports.requester}: {request.requestedByName}</p>
                      <p className="text-xs text-slate-500">{copy.reports.approver}: {request.approvedByName || copy.common.noData}</p>
                      <p className="text-xs text-slate-500">{copy.reports.respondedAt}: {request.respondedAt ? request.respondedAt.slice(0, 16).replace("T", " ") : copy.common.noData}</p>
                      <p className="text-xs text-slate-500">{copy.reports.responseNote}: {request.responseNote || copy.common.noData}</p>
                    </div>
                    <p className="text-xs text-slate-500">{request.projectName || copy.common.noData}</p>
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
