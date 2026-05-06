"use client";

import { useState, useCallback } from "react";

type AuditLog = {
  id: string;
  organizationId: string;
  projectId: string | null;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string; // ISO string
  actor: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  initialLogs: AuditLog[];
  orgSlug: string;
  noData: string;
};

const ENTITY_COLORS: Record<string, string> = {
  Transaction: "bg-emerald-100 text-emerald-700",
  Project: "bg-blue-100 text-blue-700",
  ProjectTask: "bg-violet-100 text-violet-700",
  Quotation: "bg-amber-100 text-amber-700",
  BudgetCategory: "bg-cyan-100 text-cyan-700",
  ProjectBudgetLine: "bg-teal-100 text-teal-700",
  SurveyAppointment: "bg-orange-100 text-orange-700",
  WorkLog: "bg-indigo-100 text-indigo-700",
  Customer: "bg-pink-100 text-pink-700",
  Organization: "bg-slate-100 text-slate-700",
  Membership: "bg-gray-100 text-gray-700",
  WorkerTeam: "bg-lime-100 text-lime-700",
  BudgetRevision: "bg-yellow-100 text-yellow-700",
  ApprovalRequest: "bg-rose-100 text-rose-700",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  APPROVE: "bg-emerald-100 text-emerald-700",
  REJECT: "bg-rose-100 text-rose-700",
  CONVERT: "bg-blue-100 text-blue-700",
};

function getDateGroup(date: Date): "today" | "yesterday" | "earlier" {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  if (date >= todayStart) return "today";
  if (date >= yesterdayStart) return "yesterday";
  return "earlier";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

const GROUP_LABELS: Record<"today" | "yesterday" | "earlier", string> = {
  today: "วันนี้",
  yesterday: "เมื่อวาน",
  earlier: "ก่อนหน้า",
};

export default function RecentActivity({ initialLogs, orgSlug, noData }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = logs.length;
      const res = await fetch(`/api/org/${orgSlug}/audit-logs?skip=${skip}&take=10`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLogs((prev) => [...prev, ...data.logs]);
      setHasMore(data.hasMore);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลเพิ่มเติมได้");
    } finally {
      setLoading(false);
    }
  }, [logs.length, orgSlug]);

  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">{noData}</p>;
  }

  // Group logs by date
  const grouped: Record<"today" | "yesterday" | "earlier", AuditLog[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const log of logs) {
    const date = new Date(log.createdAt);
    const group = getDateGroup(date);
    grouped[group].push(log);
  }

  const groups: ("today" | "yesterday" | "earlier")[] = ["today", "yesterday", "earlier"];

  return (
    <div className="space-y-4">
      {groups.map((groupKey) => {
        const groupLogs = grouped[groupKey];
        if (groupLogs.length === 0) return null;

        return (
          <div key={groupKey}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              {GROUP_LABELS[groupKey]}
            </p>
            <div className="space-y-2">
              {groupLogs.map((log) => {
                const date = new Date(log.createdAt);
                const entityColor = ENTITY_COLORS[log.entityType] || "bg-slate-100 text-slate-700";
                const actionColor = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700";

                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${entityColor}`}
                          >
                            {log.entityType}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${actionColor}`}
                          >
                            {log.action}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-slate-950">{log.summary}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {log.actor.name || log.actor.email || "ไม่ระบุ"} ·{" "}
                          {log.project?.name || log.entityType} · {formatTime(date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
