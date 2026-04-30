import "server-only";

import { TaskPriority, TaskStatus } from "@prisma/client";

export function parseTaskStatus(value: unknown) {
  return typeof value === "string" && value in TaskStatus
    ? (value as TaskStatus)
    : TaskStatus.TODO;
}

export function parseTaskPriority(value: unknown) {
  return typeof value === "string" && value in TaskPriority
    ? (value as TaskPriority)
    : TaskPriority.MEDIUM;
}

export function parseTaskDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseTaskProgress(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export function syncTaskCompletionFields(input: {
  status: TaskStatus;
  progressPercent: number;
  endDate: Date | null;
}) {
  if (input.status === TaskStatus.DONE) {
    return {
      progressPercent: 100,
      completedAt: new Date(),
      endDate: input.endDate ?? new Date(),
    };
  }

  return {
    progressPercent: input.progressPercent,
    completedAt: null,
    endDate: input.endDate,
  };
}

export function validateTaskDates(input: {
  startDate: Date | null;
  dueDate: Date | null;
  endDate: Date | null;
}) {
  if (input.startDate && input.dueDate && input.startDate > input.dueDate) {
    return "START_AFTER_DUE";
  }

  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return "START_AFTER_END";
  }

  return null;
}

export function isTaskOverdue(input: {
  dueDate: Date | null;
  completedAt: Date | null;
  status: TaskStatus;
}) {
  return Boolean(
    input.dueDate &&
      !input.completedAt &&
      input.status !== TaskStatus.DONE &&
      input.status !== TaskStatus.CANCELLED &&
      input.dueDate.getTime() < Date.now(),
  );
}
