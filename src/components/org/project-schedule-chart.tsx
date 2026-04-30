import type { TaskPriority, TaskStatus, SurveyAppointmentStatus } from "@prisma/client";
import { StatusBadge } from "@/components/dashboard/status-badge";

type ScheduleTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToName: string | null;
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
  progressPercent: number;
};

type ScheduleAppointment = {
  id: string;
  title: string;
  status: SurveyAppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string | null;
};

type Props = {
  locale: "th" | "en";
  project: {
    name: string;
    startDate: string | null;
    endDate: string | null;
  };
  tasks: ScheduleTask[];
  appointments: ScheduleAppointment[];
  copy: {
    common: { noData: string };
    projects: Record<string, string>;
  };
};

const dayInMs = 24 * 60 * 60 * 1000;

function toDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getSpanPercent(start: Date, end: Date, rangeStart: Date, totalDays: number) {
  const left = Math.max(0, Math.round((start.getTime() - rangeStart.getTime()) / dayInMs));
  const width = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayInMs) + 1);
  return {
    left: `${(left / totalDays) * 100}%`,
    width: `${(width / totalDays) * 100}%`,
  };
}

function getTaskTone(status: TaskStatus) {
  if (status === "DONE") return "green" as const;
  if (status === "BLOCKED") return "amber" as const;
  if (status === "CANCELLED") return "red" as const;
  if (status === "IN_PROGRESS") return "blue" as const;
  return "slate" as const;
}

function getTaskBarClassName(status: TaskStatus, priority: TaskPriority) {
  if (status === "DONE") return "bg-emerald-500";
  if (status === "BLOCKED" || priority === "URGENT") return "bg-red-500";
  if (priority === "HIGH") return "bg-amber-500";
  if (status === "IN_PROGRESS") return "bg-blue-500";
  return "bg-slate-500";
}

function getTaskStatusLabel(status: TaskStatus, copy: Props["copy"]) {
  const labels: Record<TaskStatus, string> = {
    TODO: copy.projects.taskTodo,
    IN_PROGRESS: copy.projects.taskInProgress,
    BLOCKED: copy.projects.taskBlocked,
    DONE: copy.projects.taskDone,
    CANCELLED: copy.projects.taskCancelled,
  };
  return labels[status];
}

export function ProjectScheduleChart({ locale, project, tasks, appointments, copy }: Props) {
  const formatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { day: "2-digit", month: "short" });
  const datedTasks = tasks
    .map((task) => {
      const start = toDate(task.startDate) ?? toDate(task.dueDate) ?? toDate(task.endDate);
      const end = toDate(task.endDate) ?? toDate(task.dueDate) ?? start;
      return start && end ? { ...task, start: startOfDay(start), end: startOfDay(end) } : null;
    })
    .filter(Boolean) as Array<ScheduleTask & { start: Date; end: Date }>;
  const datedAppointments = appointments.map((item) => ({ ...item, start: startOfDay(new Date(item.scheduledStart)) }));
  const boundaryDates = [
    toDate(project.startDate),
    toDate(project.endDate),
    ...datedTasks.flatMap((task) => [task.start, task.end]),
    ...datedAppointments.map((item) => item.start),
  ].filter(Boolean) as Date[];

  if (boundaryDates.length === 0) {
    return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">{copy.projects.scheduleNoItems}</div>;
  }

  const minDate = startOfDay(new Date(Math.min(...boundaryDates.map((date) => date.getTime()))));
  const maxDate = startOfDay(new Date(Math.max(...boundaryDates.map((date) => date.getTime()))));
  const rangeStart = addDays(minDate, -2);
  const rangeEnd = addDays(maxDate, 2);
  const totalDays = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / dayInMs) + 1);
  const tickCount = Math.min(8, totalDays);
  const ticks = Array.from({ length: tickCount }, (_, index) => addDays(rangeStart, Math.round((index / Math.max(1, tickCount - 1)) * (totalDays - 1))));
  const today = startOfDay(new Date());
  const showToday = today >= rangeStart && today <= rangeEnd;
  const scheduledItemCount = datedTasks.length + datedAppointments.length;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="absolute right-8 top-0 h-32 w-32 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{copy.projects.scheduleRange}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{formatter.format(rangeStart)} - {formatter.format(rangeEnd)}</p>
            <p className="mt-2 text-sm text-slate-300">{project.name}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs text-slate-400">{copy.projects.scheduleTasks}</p>
              <p className="mt-1 text-xl font-semibold">{datedTasks.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs text-slate-400">{copy.projects.scheduleAppointments}</p>
              <p className="mt-1 text-xl font-semibold">{datedAppointments.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs text-slate-400">{copy.projects.scheduleItems}</p>
              <p className="mt-1 text-xl font-semibold">{scheduledItemCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-8 rounded-full bg-blue-500" />{copy.projects.scheduleTaskBar}</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" />{copy.projects.scheduleMilestone}</span>
        <span className="inline-flex items-center gap-2"><span className="h-4 border-l border-red-400" />{copy.projects.today}</span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[780px] space-y-4">
          <div className="relative ml-56 h-8 border-b border-slate-200 text-xs text-slate-500">
            {ticks.map((tick) => {
              const left = `${Math.max(0, Math.round((tick.getTime() - rangeStart.getTime()) / dayInMs)) / totalDays * 100}%`;
              return <span key={tick.toISOString()} className="absolute top-0 -translate-x-1/2" style={{ left }}>{formatter.format(tick)}</span>;
            })}
            {showToday ? (
              <span className="absolute top-0 h-full border-l border-red-400" style={{ left: `${Math.round((today.getTime() - rangeStart.getTime()) / dayInMs) / totalDays * 100}%` }}>
                <span className="absolute -top-1 ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100">{copy.projects.today}</span>
              </span>
            ) : null}
          </div>

          {datedTasks.map((task) => {
            const span = getSpanPercent(task.start <= task.end ? task.start : task.end, task.end >= task.start ? task.end : task.start, rangeStart, totalDays);
            const taskBarClassName = getTaskBarClassName(task.status, task.priority);
            return (
              <div key={task.id} className="grid grid-cols-[13rem_1fr] items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950">{task.title}</p>
                    <StatusBadge label={getTaskStatusLabel(task.status, copy)} tone={getTaskTone(task.status)} />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{task.assignedToName || copy.projects.noAssignee} · {task.progressPercent}%</p>
                </div>
                <div className="relative h-9 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                  <div className={`absolute top-2 h-5 rounded-full ${taskBarClassName}`} style={span}>
                    <span className="absolute inset-y-0 left-0 rounded-full bg-white/25" style={{ width: `${task.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            );
          })}

          {datedAppointments.map((appointment) => {
            const left = `${Math.max(0, Math.round((appointment.start.getTime() - rangeStart.getTime()) / dayInMs)) / totalDays * 100}%`;
            return (
              <div key={appointment.id} className="grid grid-cols-[13rem_1fr] items-center gap-4">
                <div>
                  <p className="truncate text-sm font-semibold text-slate-950">{appointment.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{copy.projects.scheduleMilestone}</p>
                </div>
                <div className="relative h-9 rounded-2xl bg-slate-50">
                  <span className="absolute top-2 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-white bg-red-500 shadow" style={{ left }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
