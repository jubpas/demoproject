"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkLogStatus } from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type TeamOption = { id: string; name: string };
type ProjectOption = { id: string; name: string; code: string | null };
type WorkerOption = { userId: string; name: string; email: string };

type WorkLogItem = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  durationMinutes: number | null;
  status: WorkLogStatus;
  notes: string | null;
  completionPercent: number;
  workerTeam: { id: string; name: string };
  project: { id: string; name: string; code: string | null } | null;
  task: { id: string; title: string } | null;
  worker: { id: string; name: string | null; email: string };
};

type WorkLogForm = {
  projectId: string;
  taskId: string;
  workerTeamId: string;
  workerUserId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  completionPercent: string;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  workLogs: WorkLogItem[];
  teams: TeamOption[];
  projects: ProjectOption[];
  workers: WorkerOption[];
  canManage: boolean;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      noData: string;
      approve: string;
      reject: string;
      unauthorized: string;
    };
    workLog: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      date: string;
      timeIn: string;
      timeOut: string;
      duration: string;
      workerTeam: string;
      project: string;
      task: string;
      worker: string;
      status: string;
      notes: string;
      completionPercent: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      statusPending: string;
      statusApproved: string;
      statusRejected: string;
      allStatuses: string;
      allTeams: string;
      allProjects: string;
      clearFilters: string;
      searchWorkLogsPlaceholder: string;
      noTeam: string;
      noProject: string;
      noTask: string;
      approveSuccess: string;
      rejectSuccess: string;
      requiredDate: string;
      requiredTeam: string;
      requiredMember: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
      noData: string;
      invalidCheckInOut: string;
      approve: string;
      approveLoading: string;
      reject: string;
      rejectLoading: string;
      approveConfirm: string;
      rejectConfirm: string;
    };
  };
};

const emptyForm: WorkLogForm = {
  projectId: "",
  taskId: "",
  workerTeamId: "",
  workerUserId: "",
  date: new Date().toISOString().slice(0, 10),
  checkIn: "",
  checkOut: "",
  notes: "",
  completionPercent: "0",
};

function getStatusLabel(status: WorkLogStatus, copy: Props["copy"]) {
  switch (status) {
    case "PENDING":
      return copy.workLog.statusPending;
    case "APPROVED":
      return copy.workLog.statusApproved;
    case "REJECTED":
      return copy.workLog.statusRejected;
  }
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export function WorkLogManager({
  locale,
  orgSlug,
  workLogs,
  teams,
  projects,
  workers,
  canManage,
  copy,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<WorkLogForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<WorkLogForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkLogStatus | "ALL">("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const filteredWorkLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return workLogs.filter((log) => {
      const matchesKeyword = keyword
        ? [
            log.workerTeam.name,
            log.project?.name,
            log.project?.code,
            log.worker.name,
            log.worker.email,
            log.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;
      const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
      const matchesTeam = teamFilter === "ALL" || log.workerTeam.id === teamFilter;
      const matchesProject = projectFilter === "ALL" || (projectFilter === "NONE" ? !log.project : log.project?.id === projectFilter);
      const matchesStartDate = startDateFilter ? new Date(log.date) >= new Date(startDateFilter) : true;
      const matchesEndDate = endDateFilter ? new Date(log.date) <= new Date(endDateFilter) : true;
      return matchesKeyword && matchesStatus && matchesTeam && matchesProject && matchesStartDate && matchesEndDate;
    });
  }, [workLogs, query, statusFilter, teamFilter, projectFilter, startDateFilter, endDateFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setTeamFilter("ALL");
    setProjectFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
  }

  function updateForm(field: keyof WorkLogForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditingForm(field: keyof WorkLogForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm(formValue: WorkLogForm) {
    if (!formValue.date) {
      return copy.workLog.requiredDate;
    }
    if (!formValue.workerTeamId) {
      return copy.workLog.requiredTeam;
    }
    if (!formValue.workerUserId) {
      return copy.workLog.requiredMember;
    }
    if (formValue.checkIn && formValue.checkOut) {
      const start = new Date(formValue.checkIn);
      const end = new Date(formValue.checkOut);
      if (end <= start) {
        return copy.workLog.invalidCheckInOut;
      }
    }
    return null;
  }

  async function createWorkLog() {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        projectId: form.projectId || null,
        taskId: form.taskId || null,
        workerTeamId: form.workerTeamId,
        workerUserId: form.workerUserId,
        date: form.date,
        notes: form.notes,
        completionPercent: Number(form.completionPercent) || 0,
      };

      if (form.checkIn) body.checkIn = form.checkIn;
      if (form.checkOut) body.checkOut = form.checkOut;

      const response = await fetch(`/api/org/${orgSlug}/work-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setForm(emptyForm);
      setSuccess(copy.workLog.createdSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateWorkLog(workLogId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateForm(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        id: workLogId,
        notes: editingForm.notes,
        completionPercent: Number(editingForm.completionPercent) || 0,
      };

      const response = await fetch(`/api/org/${orgSlug}/work-logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setEditingId(null);
      setSuccess(copy.workLog.updatedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function approveWorkLog(workLogId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/work-logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workLogId, status: "APPROVED" }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.workLog.approveSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    }
  }

  async function rejectWorkLog(workLogId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/work-logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workLogId, status: "REJECTED" }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.workLog.rejectSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    }
  }

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      <PageHeader title={copy.workLog.title} description={copy.workLog.subtitle} />

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      ) : null}

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder={copy.workLog.searchWorkLogsPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[200px] rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkLogStatus | "ALL")}
            className={inputClassName}
          >
            <option value="ALL">{copy.workLog.allStatuses}</option>
            <option value="PENDING">{copy.workLog.statusPending}</option>
            <option value="APPROVED">{copy.workLog.statusApproved}</option>
            <option value="REJECTED">{copy.workLog.statusRejected}</option>
          </select>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className={inputClassName}
          >
            <option value="ALL">{copy.workLog.allTeams}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className={inputClassName}
          >
            <option value="ALL">{copy.workLog.allProjects}</option>
            <option value="NONE">{copy.workLog.noProject}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code ? `${project.code} - ${project.name}` : project.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className={inputClassName}
            placeholder={copy.workLog.date}
          />
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className={inputClassName}
          />
          <button
            onClick={clearFilters}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            {copy.workLog.clearFilters}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {canManage ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">{copy.workLog.createTitle}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.date}</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.workerTeam}</span>
              <select
                value={form.workerTeamId}
                onChange={(e) => updateForm("workerTeamId", e.target.value)}
                className={inputClassName}
              >
                <option value="">{copy.workLog.noTeam}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.worker}</span>
              <select
                value={form.workerUserId}
                onChange={(e) => updateForm("workerUserId", e.target.value)}
                className={inputClassName}
              >
                <option value="">{copy.workLog.noTeam}</option>
                {workers.map((worker) => (
                  <option key={worker.userId} value={worker.userId}>
                    {worker.name || worker.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.project}</span>
              <select
                value={form.projectId}
                onChange={(e) => updateForm("projectId", e.target.value)}
                className={inputClassName}
              >
                <option value="">{copy.workLog.noProject}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code ? `${project.code} - ${project.name}` : project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.timeIn}</span>
              <input
                type="datetime-local"
                value={form.checkIn}
                onChange={(e) => updateForm("checkIn", e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.timeOut}</span>
              <input
                type="datetime-local"
                value={form.checkOut}
                onChange={(e) => updateForm("checkOut", e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.completionPercent}</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.completionPercent}
                onChange={(e) => updateForm("completionPercent", e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-2 md:col-span-3">
              <span className="text-sm font-medium text-slate-700">{copy.workLog.notes}</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
          <button
            onClick={createWorkLog}
            disabled={submitting}
            className="rounded-2xl bg-[#0007cd] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0007cd]/90 disabled:opacity-50"
          >
            {submitting ? copy.workLog.createLoading : copy.workLog.createAction}
          </button>
        </div>
      ) : null}

      {/* Work Logs Table */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">{copy.workLog.listTitle}</h3>
        {filteredWorkLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            {query || statusFilter !== "ALL" || teamFilter !== "ALL" || projectFilter !== "ALL" || startDateFilter || endDateFilter
              ? copy.workLog.noData
              : copy.workLog.emptyDescription}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">{copy.workLog.date}</th>
                  <th className="px-4 py-3">{copy.workLog.workerTeam}</th>
                  <th className="px-4 py-3">{copy.workLog.worker}</th>
                  <th className="px-4 py-3">{copy.workLog.project}</th>
                  <th className="px-4 py-3">{copy.workLog.duration}</th>
                  <th className="px-4 py-3">{copy.workLog.completionPercent}</th>
                  <th className="px-4 py-3">{copy.workLog.status}</th>
                  <th className="px-4 py-3">{copy.common.edit}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{formatDate(log.date)}</td>
                    <td className="px-4 py-3 text-slate-700">{log.workerTeam.name}</td>
                    <td className="px-4 py-3 text-slate-700">{log.worker.name || log.worker.email}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.project
                        ? log.project.code
                          ? `${log.project.code} - ${log.project.name}`
                          : log.project.name
                        : copy.workLog.noProject}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDuration(log.durationMinutes)}</td>
                    <td className="px-4 py-3 text-slate-700">{log.completionPercent}%</td>
                      <td className="px-4 py-3">
                      <StatusBadge
                        label={getStatusLabel(log.status, copy)}
                        tone={
                          log.status === "APPROVED"
                            ? "success"
                            : log.status === "REJECTED"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {log.status === "PENDING" && canManage ? (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(copy.workLog.approveConfirm)) {
                                  approveWorkLog(log.id);
                                }
                              }}
                              className="rounded-xl bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition hover:bg-green-100"
                            >
                              {copy.workLog.approve}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(copy.workLog.rejectConfirm)) {
                                  rejectWorkLog(log.id);
                                }
                              }}
                              className="rounded-xl bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              {copy.workLog.reject}
                            </button>
                          </>
                        ) : null}
                        {canManage ? (
                          <button
                            onClick={() => {
                              if (editingId === log.id) {
                                setEditingId(null);
                              } else {
                                setEditingId(log.id);
                                setEditingForm({
                                  projectId: log.project?.id ?? "",
                                  taskId: log.task?.id ?? "",
                                  workerTeamId: log.workerTeam.id,
                                  workerUserId: log.worker.id,
                                  date: log.date.slice(0, 10),
                                  checkIn: log.checkIn ? new Date(log.checkIn).toISOString().slice(0, 16) : "",
                                  checkOut: log.checkOut ? new Date(log.checkOut).toISOString().slice(0, 16) : "",
                                  notes: log.notes ?? "",
                                  completionPercent: String(log.completionPercent),
                                });
                              }
                            }}
                            className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                          >
                            {editingId === log.id ? copy.common.cancel : copy.common.edit}
                          </button>
                        ) : null}
                      </div>
                      {editingId === log.id ? (
                        <div className="mt-2 space-y-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-medium text-slate-600">{copy.workLog.completionPercent}</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingForm.completionPercent}
                              onChange={(e) => updateEditingForm("completionPercent", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-medium text-slate-600">{copy.workLog.notes}</span>
                            <textarea
                              rows={2}
                              value={editingForm.notes}
                              onChange={(e) => updateEditingForm("notes", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                            />
                          </label>
                          <button
                            onClick={() => updateWorkLog(log.id)}
                            disabled={submitting}
                            className="rounded-xl bg-[#0007cd] px-3 py-1 text-xs font-medium text-white transition hover:bg-[#0007cd]/90 disabled:opacity-50"
                          >
                            {submitting ? copy.workLog.createLoading : copy.workLog.updateAction}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
