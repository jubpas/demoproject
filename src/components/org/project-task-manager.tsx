"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type MemberOption = { id: string; name: string };

type ProjectTaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  assignedToName: string | null;
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
  progressPercent: number;
  completedAt: string | null;
};

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  startDate: string;
  dueDate: string;
  endDate: string;
  progressPercent: string;
};

type Copy = {
  common: {
    cancel: string;
    delete: string;
    deleting: string;
    edit: string;
    noData: string;
    unauthorized: string;
  };
  projects: Record<string, string>;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  projectId: string;
  projectName: string;
  tasks: ProjectTaskItem[];
  members: MemberOption[];
  canManage: boolean;
  copy: Copy;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  assignedToId: "",
  startDate: "",
  dueDate: "",
  endDate: "",
  progressPercent: "0",
};

function toForm(task: ProjectTaskItem): TaskForm {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    assignedToId: task.assignedToId ?? "",
    startDate: task.startDate?.slice(0, 10) ?? "",
    dueDate: task.dueDate?.slice(0, 10) ?? "",
    endDate: task.endDate?.slice(0, 10) ?? "",
    progressPercent: String(task.progressPercent),
  };
}

function getStatusOptions(copy: Copy) {
  return [
    { value: "TODO" as TaskStatus, label: copy.projects.taskTodo, tone: "slate" as const },
    { value: "IN_PROGRESS" as TaskStatus, label: copy.projects.taskInProgress, tone: "blue" as const },
    { value: "BLOCKED" as TaskStatus, label: copy.projects.taskBlocked, tone: "amber" as const },
    { value: "DONE" as TaskStatus, label: copy.projects.taskDone, tone: "green" as const },
    { value: "CANCELLED" as TaskStatus, label: copy.projects.taskCancelled, tone: "red" as const },
  ];
}

function getPriorityOptions(copy: Copy) {
  return [
    { value: "LOW" as TaskPriority, label: copy.projects.priorityLow },
    { value: "MEDIUM" as TaskPriority, label: copy.projects.priorityMedium },
    { value: "HIGH" as TaskPriority, label: copy.projects.priorityHigh },
    { value: "URGENT" as TaskPriority, label: copy.projects.priorityUrgent },
  ];
}

function TaskFields({
  form,
  members,
  copy,
  onChange,
}: {
  form: TaskForm;
  members: MemberOption[];
  copy: Copy;
  onChange: (field: keyof TaskForm, value: string) => void;
}) {
  const inputClassName = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  const statusOptions = getStatusOptions(copy);
  const priorityOptions = getPriorityOptions(copy);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.taskTitleField}</span>
        <input value={form.title} onChange={(event) => onChange("title", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.assignee}</span>
        <select value={form.assignedToId} onChange={(event) => onChange("assignedToId", event.target.value)} className={inputClassName}>
          <option value="">{copy.projects.noAssignee}</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.status}</span>
        <select value={form.status} onChange={(event) => onChange("status", event.target.value)} className={inputClassName}>
          {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.priority}</span>
        <select value={form.priority} onChange={(event) => onChange("priority", event.target.value)} className={inputClassName}>
          {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.progress}</span>
        <input type="number" min="0" max="100" value={form.progressPercent} onChange={(event) => onChange("progressPercent", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.startDate}</span>
        <input type="date" value={form.startDate} onChange={(event) => onChange("startDate", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.dueDate}</span>
        <input type="date" value={form.dueDate} onChange={(event) => onChange("dueDate", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.endDate}</span>
        <input type="date" value={form.endDate} onChange={(event) => onChange("endDate", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-700">{copy.projects.taskDescriptionField}</span>
        <textarea rows={3} value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder={copy.projects.taskDescriptionPlaceholder} className={inputClassName} />
      </label>
    </div>
  );
}

export function ProjectTaskManager({ locale, orgSlug, projectId, projectName, tasks, members, canManage, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const statusOptions = getStatusOptions(copy);
  const statusMap = Object.fromEntries(statusOptions.map((item) => [item.value, item])) as Record<TaskStatus, (typeof statusOptions)[number]>;
  const priorityMap = Object.fromEntries(getPriorityOptions(copy).map((item) => [item.value, item.label])) as Record<TaskPriority, string>;
  const dateFormatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium" });

  const filteredTasks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return tasks;
    return tasks.filter((task) => [task.title, task.description, task.assignedToName].filter(Boolean).join(" ").toLowerCase().includes(keyword));
  }, [tasks, query]);

  function updateForm(field: keyof TaskForm, value: string) {
    setForm((current) => ({ ...current, [field]: value as TaskForm[keyof TaskForm] }));
  }

  function updateEditingForm(field: keyof TaskForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value as TaskForm[keyof TaskForm] }));
  }

  async function submitTask(method: "POST" | "PATCH", taskId?: string) {
    const payload = method === "POST" ? form : editingForm;
    if (!canManage) return setError(copy.common.unauthorized);
    if (!payload.title.trim()) return setError(copy.projects.requiredTaskTitle);

    setError("");
    setSuccess("");
    setSubmitting(true);

    const endpoint = method === "POST"
      ? `/api/org/${orgSlug}/projects/${projectId}/tasks`
      : `/api/org/${orgSlug}/projects/${projectId}/tasks/${taskId}`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      if (method === "POST") {
        setForm(emptyForm);
        setSuccess(copy.projects.taskCreatedSuccess);
      } else {
        setEditingId(null);
        setSuccess(copy.projects.taskUpdatedSuccess);
      }

      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!canManage) return setError(copy.common.unauthorized);
    if (!window.confirm(copy.projects.deleteTaskConfirm)) return;

    setDeletingId(taskId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.projects.taskDeletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value: string | null) {
    return value ? dateFormatter.format(new Date(value)) : copy.common.noData;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.projects.tasksTitle} description={`${projectName} · ${copy.projects.tasksSubtitle}`} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataPanel title={copy.projects.taskCreateTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <TaskFields form={form} members={members} copy={copy} onChange={updateForm} />
            <button type="button" disabled={!canManage || submitting} onClick={() => void submitTask("POST")} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? copy.projects.addTaskLoading : copy.projects.addTask}
            </button>
          </div>
        </DataPanel>

        <DataPanel title={copy.projects.taskListTitle} actions={<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.projects.searchTasksPlaceholder} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />}>
          {filteredTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">{copy.projects.noTasks}</div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isEditing = editingId === task.id;
                const status = statusMap[task.status];

                return (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <TaskFields form={editingForm} members={members} copy={copy} onChange={updateEditingForm} />
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => void submitTask("PATCH", task.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.projects.updateTaskAction}</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">{task.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{task.assignedToName || copy.projects.noAssignee} · {priorityMap[task.priority]}</p>
                          </div>
                          <StatusBadge label={status.label} tone={status.tone} />
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>{copy.projects.startDate}: {formatDate(task.startDate)}</p>
                          <p>{copy.projects.dueDate}: {formatDate(task.dueDate)}</p>
                          <p>{copy.projects.endDate}: {formatDate(task.endDate)}</p>
                          <p>{copy.projects.progress}: {task.progressPercent}%</p>
                        </div>
                        {task.description ? <p className="text-sm text-slate-600">{task.description}</p> : null}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setEditingId(task.id); setEditingForm(toForm(task)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button>
                          <button type="button" disabled={deletingId === task.id} onClick={() => void deleteTask(task.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === task.id ? copy.common.deleting : copy.common.delete}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DataPanel>
      </div>
    </div>
  );
}
