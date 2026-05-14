"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ProjectStatus,
  TaskStatus,
  WorkerAssignmentStatus,
  WorkerCompensationType,
} from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type TeamMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isMainWorker: boolean;
  compensationType: WorkerCompensationType;
  dailyWageInCents: number | null;
  monthlyWageInCents: number | null;
};

type Team = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  workLogCount: number;
  createdAt: string;
  estimatedCost: number;
  actualCost: number;
  actualHours: number;
  members: TeamMember[];
};

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

type ProjectOption = {
  id: string;
  name: string;
  code: string | null;
  status: ProjectStatus;
};

type TaskOption = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
};

type WorkerAssignment = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  plannedDays: number;
  compensationType: WorkerCompensationType;
  wageInCents: number;
  estimatedCostInCents: number;
  status: WorkerAssignmentStatus;
  notes: string | null;
  project: { id: string; name: string; code: string | null };
  task: { id: string; title: string } | null;
  workerTeam: { id: string; name: string };
  worker: { id: string; name: string; email: string } | null;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  teams: Team[];
  allMembers: Member[];
  projects: ProjectOption[];
  tasks: TaskOption[];
  assignments: WorkerAssignment[];
  canManage: boolean;
  costSummary: {
    totalEstimatedCostInCents: number;
    totalActualCostInCents: number;
    totalActualHours: number;
    activeWorkLogCount: number;
  };
  actualCostByProject: Array<{
    projectId: string;
    costInCents: number;
    hours: number;
  }>;
  actualCostByWorker: Array<{
    userId: string;
    name: string;
    costInCents: number;
    hours: number;
  }>;
  copy: {
    common: Record<string, string>;
    workerTeam: Record<string, string>;
  };
};

type TeamForm = {
  name: string;
  description: string;
};

type MemberForm = {
  userId: string;
  role: "LEADER" | "MEMBER" | "SUBCONTRACTOR";
  compensationType: WorkerCompensationType;
  dailyWageAmount: string;
  monthlyWageAmount: string;
};

type AssignmentForm = {
  title: string;
  projectId: string;
  taskId: string;
  workerTeamId: string;
  workerUserId: string;
  startDate: string;
  endDate: string;
  plannedDays: string;
  compensationType: WorkerCompensationType;
  wageAmount: string;
  notes: string;
};

const emptyTeamForm: TeamForm = { name: "", description: "" };
const emptyMemberForm: MemberForm = {
  userId: "",
  role: "MEMBER",
  compensationType: "DAILY",
  dailyWageAmount: "",
  monthlyWageAmount: "",
};
const today = new Date().toISOString().slice(0, 10);
const emptyAssignmentForm: AssignmentForm = {
  title: "",
  projectId: "",
  taskId: "",
  workerTeamId: "",
  workerUserId: "",
  startDate: today,
  endDate: today,
  plannedDays: "1",
  compensationType: "DAILY",
  wageAmount: "",
  notes: "",
};

function t(copy: Props["copy"], key: string, fallback: string) {
  return copy.workerTeam[key] ?? fallback;
}

function formatMoney(cents: number | null | undefined) {
  if (!cents) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusTone(status: WorkerAssignmentStatus) {
  if (status === "ACTIVE") return "brand";
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "neutral";
  return "warning";
}

function getInclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000`);
  const end = new Date(`${endDate}T00:00:00.000`);
  const msPerDay = 24 * 60 * 60 * 1000;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }

  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
}

export function WorkerTeamManager({
  copy,
  orgSlug,
  teams,
  allMembers,
  projects,
  tasks,
  assignments,
  canManage,
  costSummary,
  actualCostByProject: _actualCostByProject,
  actualCostByWorker: _actualCostByWorker,
}: Props) {
  const router = useRouter();
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [memberForms, setMemberForms] = useState<Record<string, MemberForm>>({});
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(emptyAssignmentForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<"ALL" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const membersByTeam = useMemo(() => {
    return new Map(teams.map((team) => [team.id, team.members]));
  }, [teams]);

  const selectedTeamMembers = assignmentForm.workerTeamId
    ? membersByTeam.get(assignmentForm.workerTeamId) ?? []
    : [];
  const projectTasks = assignmentForm.projectId
    ? tasks.filter((task) => task.projectId === assignmentForm.projectId)
    : [];

  const filteredTeams = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return teams.filter((team) => {
      const matchesKeyword = keyword
        ? [team.name, team.description, ...team.members.map((m) => m.name)]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;
      const matchesStatus =
        statusFilter === "ALL" || (statusFilter === "ACTIVE" ? team.isActive : !team.isActive);
      return matchesKeyword && matchesStatus;
    });
  }, [teams, query, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesProject = projectFilter === "ALL" || assignment.project.id === projectFilter;
      const matchesStatus = assignmentStatusFilter === "ALL" || assignment.status === assignmentStatusFilter;
      return matchesProject && matchesStatus;
    });
  }, [assignments, projectFilter, assignmentStatusFilter]);

  const assignmentCost = filteredAssignments.reduce(
    (sum, assignment) => sum + assignment.estimatedCostInCents,
    0,
  );
  const plannedHeadcount = filteredAssignments.length;
  const activeAssignmentCount = filteredAssignments.filter((item) =>
    ["PLANNED", "ACTIVE"].includes(item.status),
  ).length;
  const totalWorkerCount = new Set(teams.flatMap((team) => team.members.map((member) => member.userId))).size;

  const previewDays =
    Number(assignmentForm.plannedDays) > 0
      ? Number(assignmentForm.plannedDays)
      : getInclusiveDays(assignmentForm.startDate, assignmentForm.endDate);
  const previewWage = Number(assignmentForm.wageAmount) || 0;
  const previewCost =
    assignmentForm.compensationType === "MONTHLY"
      ? Math.round((previewWage / 30) * previewDays)
      : Math.round(previewWage * previewDays);

  function updateMemberForm(teamId: string, patch: Partial<MemberForm>) {
    setMemberForms((current) => ({
      ...current,
      [teamId]: { ...(current[teamId] ?? emptyMemberForm), ...patch },
    }));
  }

  function selectWorker(member: TeamMember) {
    const wage =
      member.compensationType === "MONTHLY"
        ? member.monthlyWageInCents
        : member.dailyWageInCents;
    setAssignmentForm((current) => ({
      ...current,
      workerUserId: member.userId,
      compensationType: member.compensationType,
      wageAmount: wage ? String(wage / 100) : current.wageAmount,
    }));
  }

  async function createTeam() {
    if (!canManage) {
      setError(copy.common.unauthorized ?? "Unauthorized");
      return;
    }
    if (!teamForm.name.trim()) {
      setError(t(copy, "requiredName", "Please enter a team name"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/worker-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }
      setTeamForm(emptyTeamForm);
      setSuccess(t(copy, "createdSuccess", "Worker team created successfully"));
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function addMember(teamId: string) {
    const form = memberForms[teamId] ?? emptyMemberForm;
    if (!form.userId) {
      setError(t(copy, "requiredMember", "Please select a member"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/worker-teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }
      updateMemberForm(teamId, emptyMemberForm);
      setSuccess(t(copy, "memberAddedSuccess", "Member added to team"));
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateMemberWage(teamId: string, member: TeamMember) {
    const dailyWageAmount = window.prompt(
      t(copy, "dailyWage", "Daily wage"),
      member.dailyWageInCents ? String(member.dailyWageInCents / 100) : "",
    );
    if (dailyWageAmount === null) return;

    const monthlyWageAmount = window.prompt(
      t(copy, "monthlyWage", "Monthly wage"),
      member.monthlyWageInCents ? String(member.monthlyWageInCents / 100) : "",
    );
    if (monthlyWageAmount === null) return;

    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/org/${orgSlug}/worker-teams/${teamId}/members/${member.memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            compensationType: member.compensationType,
            dailyWageAmount,
            monthlyWageAmount,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }
      setSuccess(t(copy, "wageUpdatedSuccess", "Worker wage updated"));
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized ?? "Something went wrong");
    }
  }

  async function createAssignment() {
    if (!canManage) {
      setError(copy.common.unauthorized ?? "Unauthorized");
      return;
    }
    if (
      !assignmentForm.title.trim() ||
      !assignmentForm.projectId ||
      !assignmentForm.workerTeamId ||
      !assignmentForm.startDate ||
      !assignmentForm.endDate ||
      !assignmentForm.wageAmount
    ) {
      setError(t(copy, "requiredAssignment", "Please fill required assignment fields"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/worker-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }
      setAssignmentForm(emptyAssignmentForm);
      setSuccess(t(copy, "assignmentCreatedSuccess", "Worker assignment created"));
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateAssignmentStatus(id: string, status: WorkerAssignmentStatus) {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/worker-assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }
      setSuccess(t(copy, "assignmentUpdatedSuccess", "Assignment updated"));
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized ?? "Something went wrong");
    }
  }

  const inputClassName =
    "w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
  const panelClassName = "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5";
  const labelClassName = "space-y-2 text-sm font-medium text-[var(--muted)]";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(copy, "title", "Worker team management")}
        description={t(
          copy,
          "subtitle",
          "Organize workers into teams, plan manpower against projects and tasks, and estimate daily or monthly labor cost.",
        )}
      />

      {error ? <div className="rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">{error}</div> : null}
      {success ? <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t(copy, "teams", "Teams")}</p>
          <p className="mt-3 text-3xl font-medium text-[var(--foreground)]">{teams.length}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t(copy, "workers", "Workers")}</p>
          <p className="mt-3 text-3xl font-medium text-[var(--foreground)]">{totalWorkerCount}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t(copy, "activePlans", "Active plans")}</p>
          <p className="mt-3 text-3xl font-medium text-[var(--foreground)]">{activeAssignmentCount}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t(copy, "plannedCost", "Planned labor cost")}</p>
          <p className="mt-3 text-2xl font-medium text-[var(--foreground)]">{formatMoney(assignmentCost)}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Actual labor cost</p>
          <p className="mt-3 text-2xl font-medium text-[var(--success)]">{formatMoney(costSummary.totalActualCostInCents)}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">Actual hours</p>
          <p className="mt-3 text-2xl font-medium text-[var(--accent-cyan)]">{costSummary.totalActualHours.toFixed(1)}h</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Approved logs</p>
          <p className="mt-3 text-3xl font-medium text-[var(--foreground)]">{costSummary.activeWorkLogCount}</p>
        </div>
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Est. vs Actual</p>
          <p className="mt-3 text-lg font-medium text-[var(--foreground)]">{formatMoney(costSummary.totalEstimatedCostInCents)} / {formatMoney(costSummary.totalActualCostInCents)}</p>
        </div>
      </div>

      {canManage ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className={panelClassName}>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t(copy, "createTitle", "Add new worker team")}</h2>
            <div className="mt-4 grid gap-4">
              <label className={labelClassName}>
                {t(copy, "name", "Team name")}
                <input
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {t(copy, "description", "Description")}
                <textarea
                  rows={3}
                  value={teamForm.description}
                  onChange={(event) => setTeamForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder={t(copy, "descriptionPlaceholder", "e.g. Electrical installation team")}
                  className={inputClassName}
                />
              </label>
              <button
                type="button"
                onClick={createTeam}
                disabled={submitting}
                className="rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-active)] disabled:opacity-50"
              >
                {submitting ? t(copy, "createLoading", "Creating...") : t(copy, "createAction", "Create team")}
              </button>
            </div>
          </section>

          <section className={panelClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{t(copy, "assignmentTitle", "Plan manpower")}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {t(copy, "assignmentHint", "Link a worker team or specific worker to a project task and estimate wage cost before work starts.")}
                </p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)]">
                {formatMoney(previewCost * 100)}
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className={`${labelClassName} md:col-span-2`}>
                {t(copy, "assignmentName", "Plan title")}
                <input
                  value={assignmentForm.title}
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder={t(copy, "assignmentPlaceholder", "e.g. Masonry team for ground floor wall")}
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {t(copy, "project", "Project")}
                <select
                  value={assignmentForm.projectId}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({ ...current, projectId: event.target.value, taskId: "" }))
                  }
                  className={inputClassName}
                >
                  <option value="">{t(copy, "selectProject", "Select project")}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code ? `${project.code} - ${project.name}` : project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                {t(copy, "task", "Task")}
                <select
                  value={assignmentForm.taskId}
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, taskId: event.target.value }))}
                  className={inputClassName}
                >
                  <option value="">{t(copy, "noTask", "No task")}</option>
                  {projectTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                {t(copy, "workerTeam", "Worker team")}
                <select
                  value={assignmentForm.workerTeamId}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({ ...current, workerTeamId: event.target.value, workerUserId: "" }))
                  }
                  className={inputClassName}
                >
                  <option value="">{t(copy, "selectTeam", "Select team")}</option>
                  {teams.filter((team) => team.isActive).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                {t(copy, "worker", "Worker")}
                <select
                  value={assignmentForm.workerUserId}
                  onChange={(event) => {
                    const member = selectedTeamMembers.find((item) => item.userId === event.target.value);
                    if (member) {
                      selectWorker(member);
                    } else {
                      setAssignmentForm((current) => ({ ...current, workerUserId: "" }));
                    }
                  }}
                  className={inputClassName}
                >
                  <option value="">{t(copy, "wholeTeam", "Whole team / not specific")}</option>
                  {selectedTeamMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                {t(copy, "startDate", "Start date")}
                <input
                  type="date"
                  value={assignmentForm.startDate}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                      plannedDays: String(getInclusiveDays(event.target.value, current.endDate)),
                    }))
                  }
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {t(copy, "endDate", "End date")}
                <input
                  type="date"
                  value={assignmentForm.endDate}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                      plannedDays: String(getInclusiveDays(current.startDate, event.target.value)),
                    }))
                  }
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {t(copy, "plannedDays", "Planned days")}
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={assignmentForm.plannedDays}
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, plannedDays: event.target.value }))}
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {t(copy, "compensationType", "Wage type")}
                <select
                  value={assignmentForm.compensationType}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      compensationType: event.target.value as WorkerCompensationType,
                    }))
                  }
                  className={inputClassName}
                >
                  <option value="DAILY">{t(copy, "daily", "Daily")}</option>
                  <option value="MONTHLY">{t(copy, "monthly", "Monthly")}</option>
                </select>
              </label>
              <label className={labelClassName}>
                {assignmentForm.compensationType === "MONTHLY"
                  ? t(copy, "monthlyWage", "Monthly wage")
                  : t(copy, "dailyWage", "Daily wage")}
                <input
                  type="number"
                  min="0"
                  value={assignmentForm.wageAmount}
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, wageAmount: event.target.value }))}
                  className={inputClassName}
                />
              </label>
              <label className={`${labelClassName} md:col-span-2`}>
                {t(copy, "notes", "Notes")}
                <textarea
                  rows={3}
                  value={assignmentForm.notes}
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))}
                  className={inputClassName}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={createAssignment}
              disabled={submitting}
              className="mt-5 rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-active)] disabled:opacity-50"
            >
              {submitting ? t(copy, "assignmentLoading", "Planning...") : t(copy, "createAssignment", "Create manpower plan")}
            </button>
          </section>
        </div>
      ) : null}

      <section className={panelClassName}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t(copy, "listTitle", "Worker teams")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{filteredTeams.length}/{teams.length}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(copy, "searchTeamsPlaceholder", "Search teams")}
              className={inputClassName}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className={inputClassName}
            >
              <option value="ALL">{t(copy, "allStatuses", "All statuses")}</option>
              <option value="ACTIVE">{t(copy, "active", "Active")}</option>
              <option value="INACTIVE">{t(copy, "inactive", "Inactive")}</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("ALL");
              }}
              className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)]"
            >
              {t(copy, "clearFilters", "Clear filters")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {filteredTeams.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--muted)]">
              {t(copy, "emptyDescription", "Start by creating the first worker team for this organization.")}
            </div>
          ) : (
            filteredTeams.map((team) => {
              const form = memberForms[team.id] ?? emptyMemberForm;
              const availableMembers = allMembers.filter(
                (member) => !team.members.some((teamMember) => teamMember.userId === member.userId),
              );

              return (
                <article key={team.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-[var(--foreground)]">{team.name}</h3>
                        <StatusBadge label={team.isActive ? t(copy, "active", "Active") : t(copy, "inactive", "Inactive")} tone={team.isActive ? "success" : "neutral"} />
                      </div>
                      {team.description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{team.description}</p> : null}
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {t(copy, "memberCount", "members")}: {team.memberCount} · {t(copy, "workLogs", "Work logs")}: {team.workLogCount}
                      </p>
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="text-[var(--muted-soft)]">Est: {formatMoney(team.estimatedCost)}</span>
                        <span className="text-[var(--success)] font-medium">Actual: {formatMoney(team.actualCost)}</span>
                        <span className="text-[var(--accent-cyan)]">Hours: {team.actualHours.toFixed(1)}h</span>
                      </div>

                      {(() => {
                        const teamAssignments = assignments.filter(
                          (a) => a.workerTeam.id === team.id,
                        );
                        const activeAssignments = teamAssignments.filter(
                          (a) => ["PLANNED", "ACTIVE"].includes(a.status),
                        );
                        const completedAssignments = teamAssignments.filter(
                          (a) => a.status === "COMPLETED",
                        );
                        const cancelledAssignments = teamAssignments.filter(
                          (a) => a.status === "CANCELLED",
                        );

                        return (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                              {t(copy, "assignments", "Assignments")} ({teamAssignments.length})
                            </p>
                            {teamAssignments.length === 0 ? (
                              <p className="mt-2 text-xs text-[var(--muted-soft)]">
                                {t(copy, "noAssignments", "No assignments yet")}
                              </p>
                            ) : (
                              <div className="mt-2 grid gap-2">
                                {teamAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                                          {assignment.title}
                                        </p>
                                        {assignment.task ? (
                                          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                            → {assignment.task.title}
                                          </p>
                                        ) : null}
                                        <p className="mt-1 text-xs text-[var(--muted-soft)]">
                                          {assignment.project.code
                                            ? `${assignment.project.code} — ${assignment.project.name}`
                                            : assignment.project.name}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                          {formatDate(assignment.startDate)} — {formatDate(assignment.endDate)}
                                          {" · "}
                                          {assignment.plannedDays} {t(copy, "days", "days")}
                                        </p>
                                        <div className="mt-1 flex gap-3 text-xs">
                                          <span className="text-[var(--muted-soft)]">
                                            {t(copy, "estimatedCost", "Estimated cost")}: {formatMoney(assignment.estimatedCostInCents)}
                                          </span>
                                          {assignment.worker ? (
                                            <span className="text-[var(--muted-soft)]">
                                              {assignment.worker.name}
                                            </span>
                                          ) : (
                                            <span className="text-[var(--muted-soft)]">
                                              {t(copy, "wholeTeam", "Whole team")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <StatusBadge
                                        label={assignment.status}
                                        tone={getStatusTone(assignment.status)}
                                      />
                                    </div>
                                    {canManage ? (
                                      <div className="mt-2 flex items-center gap-2">
                                        <select
                                          value={assignment.status}
                                          onChange={(event) =>
                                            updateAssignmentStatus(
                                              assignment.id,
                                              event.target.value as WorkerAssignmentStatus,
                                            )
                                          }
                                          className={`${inputClassName} !min-w-0 !text-xs`}
                                        >
                                          <option value="PLANNED">{t(copy, "planned", "Planned")}</option>
                                          <option value="ACTIVE">{t(copy, "assignmentActive", "Active")}</option>
                                          <option value="COMPLETED">{t(copy, "completed", "Completed")}</option>
                                          <option value="CANCELLED">{t(copy, "cancelled", "Cancelled")}</option>
                                        </select>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {team.members.length === 0 ? (
                      <div className="rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--muted)]">
                        {t(copy, "noMembers", "No members in this team yet")}
                      </div>
                    ) : (
                      team.members.map((member) => (
                        <div key={member.memberId} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">{member.name}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">{member.email}</p>
                            </div>
                            <StatusBadge
                              label={member.isMainWorker ? t(copy, "mainWorker", "Main worker") : member.role}
                              tone={member.isMainWorker ? "brand" : "neutral"}
                            />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                            <span>{t(copy, "dailyWage", "Daily wage")}: {formatMoney(member.dailyWageInCents)}</span>
                            <span>{t(copy, "monthlyWage", "Monthly wage")}: {formatMoney(member.monthlyWageInCents)}</span>
                          </div>
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => updateMemberWage(team.id, member)}
                              className="mt-3 rounded-md border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
                            >
                              {t(copy, "updateWage", "Update wage")}
                            </button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  {canManage ? (
                    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{t(copy, "addMemberToTeam", "Add member to team")}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-5">
                        <select
                          value={form.userId}
                          onChange={(event) => updateMemberForm(team.id, { userId: event.target.value })}
                          className={inputClassName}
                        >
                          <option value="">{t(copy, "selectMember", "Select member")}</option>
                          {availableMembers.map((member) => (
                            <option key={member.userId} value={member.userId}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={form.role}
                          onChange={(event) => updateMemberForm(team.id, { role: event.target.value as MemberForm["role"] })}
                          className={inputClassName}
                        >
                          <option value="LEADER">{t(copy, "leader", "Leader")}</option>
                          <option value="MEMBER">{t(copy, "member", "Member")}</option>
                          <option value="SUBCONTRACTOR">{t(copy, "subcontractor", "Subcontractor")}</option>
                        </select>
                        <select
                          value={form.compensationType}
                          onChange={(event) =>
                            updateMemberForm(team.id, { compensationType: event.target.value as WorkerCompensationType })
                          }
                          className={inputClassName}
                        >
                          <option value="DAILY">{t(copy, "daily", "Daily")}</option>
                          <option value="MONTHLY">{t(copy, "monthly", "Monthly")}</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={form.dailyWageAmount}
                          onChange={(event) => updateMemberForm(team.id, { dailyWageAmount: event.target.value })}
                          placeholder={t(copy, "dailyWage", "Daily wage")}
                          className={inputClassName}
                        />
                        <input
                          type="number"
                          min="0"
                          value={form.monthlyWageAmount}
                          onChange={(event) => updateMemberForm(team.id, { monthlyWageAmount: event.target.value })}
                          placeholder={t(copy, "monthlyWage", "Monthly wage")}
                          className={inputClassName}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addMember(team.id)}
                        disabled={submitting}
                        className="mt-3 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-active)] disabled:opacity-50"
                      >
                        {submitting ? t(copy, "addMemberLoading", "Adding...") : t(copy, "addMember", "Add member")}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className={panelClassName}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t(copy, "assignmentListTitle", "Manpower plan")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t(copy, "plannedHeadcount", "Planned headcount")}: {plannedHeadcount}
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={assignmentStatusFilter}
              onChange={(event) => setAssignmentStatusFilter(event.target.value as typeof assignmentStatusFilter)}
              className={`${inputClassName} max-w-[180px]`}
            >
              <option value="ALL">{t(copy, "allStatuses", "All statuses")}</option>
              <option value="PLANNED">{t(copy, "planned", "Planned")}</option>
              <option value="ACTIVE">{t(copy, "assignmentActive", "Active")}</option>
              <option value="COMPLETED">{t(copy, "completed", "Completed")}</option>
              <option value="CANCELLED">{t(copy, "cancelled", "Cancelled")}</option>
            </select>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className={`${inputClassName} max-w-sm`}
            >
              <option value="ALL">{t(copy, "allProjects", "All projects")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code ? `${project.code} - ${project.name}` : project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {filteredAssignments.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--muted)]">
              {t(copy, "noAssignments", "No manpower plans yet")}
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-3">{t(copy, "assignmentName", "Plan")}</th>
                  <th className="px-3 py-3">{t(copy, "project", "Project")}</th>
                  <th className="px-3 py-3">{t(copy, "workerTeam", "Team")}</th>
                  <th className="px-3 py-3">{t(copy, "worker", "Worker")}</th>
                  <th className="px-3 py-3">{t(copy, "dateRange", "Date range")}</th>
                  <th className="px-3 py-3">{t(copy, "wage", "Wage")}</th>
                  <th className="px-3 py-3">{t(copy, "estimatedCost", "Estimated cost")}</th>
                  <th className="px-3 py-3">{t(copy, "status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-[var(--border)] text-[var(--muted)]">
                    <td className="px-3 py-4">
                      <p className="font-medium text-[var(--foreground)]">{assignment.title}</p>
                      {assignment.task ? <p className="mt-1 text-xs">{assignment.task.title}</p> : null}
                    </td>
                    <td className="px-3 py-4">
                      {assignment.project.code ? `${assignment.project.code} - ${assignment.project.name}` : assignment.project.name}
                    </td>
                    <td className="px-3 py-4">{assignment.workerTeam.name}</td>
                    <td className="px-3 py-4">{assignment.worker?.name ?? t(copy, "wholeTeam", "Whole team")}</td>
                    <td className="px-3 py-4">
                      {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                      <p className="mt-1 text-xs">{assignment.plannedDays} {t(copy, "days", "days")}</p>
                    </td>
                    <td className="px-3 py-4">
                      {formatMoney(assignment.wageInCents)}
                      <p className="mt-1 text-xs">
                        {assignment.compensationType === "MONTHLY" ? t(copy, "monthly", "Monthly") : t(copy, "daily", "Daily")}
                      </p>
                    </td>
                    <td className="px-3 py-4 font-medium text-[var(--foreground)]">{formatMoney(assignment.estimatedCostInCents)}</td>
                    <td className="px-3 py-4">
                      {canManage ? (
                        <select
                          value={assignment.status}
                          onChange={(event) =>
                            updateAssignmentStatus(assignment.id, event.target.value as WorkerAssignmentStatus)
                          }
                          className={inputClassName}
                        >
                          <option value="PLANNED">{t(copy, "planned", "Planned")}</option>
                          <option value="ACTIVE">{t(copy, "assignmentActive", "Active")}</option>
                          <option value="COMPLETED">{t(copy, "completed", "Completed")}</option>
                          <option value="CANCELLED">{t(copy, "cancelled", "Cancelled")}</option>
                        </select>
                      ) : (
                        <StatusBadge label={assignment.status} tone={getStatusTone(assignment.status)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
