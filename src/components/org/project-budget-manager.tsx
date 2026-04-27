"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";

type BudgetCategory = {
  id: string;
  name: string;
};

type BudgetLine = {
  id: string;
  budgetCategoryId: string;
  budgetCategoryName: string;
  plannedAmountInCents: number;
  actualAmountInCents: number;
  varianceInCents: number;
  note: string | null;
};

type BudgetSummary = {
  totalPlannedInCents: number;
  totalActualInCents: number;
  remainingBudgetInCents: number;
  varianceInCents: number;
  budgetUsagePercent: number;
  unassignedExpenseInCents: number;
};

type BudgetLineForm = {
  budgetCategoryId: string;
  plannedAmount: string;
  note: string;
};

type Props = {
  locale: "th" | "en";
  orgSlug: string;
  projectId: string;
  canManage: boolean;
  budgetCategories: BudgetCategory[];
  budgetLines: BudgetLine[];
  summary: BudgetSummary;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      unauthorized: string;
      noData: string;
    };
    projects: {
      budgetControl: string;
      budgetOverview: string;
      budgetLines: string;
      addBudgetLine: string;
      editBudgetLine: string;
      budgetCategory: string;
      plannedAmount: string;
      noteOptional: string;
      plannedBudget: string;
      actualExpense: string;
      remainingBudget: string;
      variance: string;
      budgetUsage: string;
      unassignedExpense: string;
      createBudgetLineAction: string;
      updateBudgetLineAction: string;
      deleteBudgetLineConfirm: string;
      requiredBudgetCategory: string;
      requiredPlannedAmount: string;
      budgetLineCreatedSuccess: string;
      budgetLineUpdatedSuccess: string;
      budgetLineDeletedSuccess: string;
      noBudgetLines: string;
      budgetLineDeleteBlocked: string;
      approvalRequestSubmitted: string;
    };
  };
};

const emptyForm: BudgetLineForm = {
  budgetCategoryId: "",
  plannedAmount: "",
  note: "",
};

function toForm(line: BudgetLine): BudgetLineForm {
  return {
    budgetCategoryId: line.budgetCategoryId,
    plannedAmount: String(line.plannedAmountInCents / 100),
    note: line.note ?? "",
  };
}

export function ProjectBudgetManager({ locale, orgSlug, projectId, canManage, budgetCategories, budgetLines, summary, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BudgetLineForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<BudgetLineForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  function updateFormValue(field: keyof BudgetLineForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditingFormValue(field: keyof BudgetLineForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value }));
  }

  function validateBudgetLine(formValue: BudgetLineForm) {
    if (!formValue.budgetCategoryId) {
      return copy.projects.requiredBudgetCategory;
    }

    const plannedAmount = Number(formValue.plannedAmount);
    if (Number.isNaN(plannedAmount) || plannedAmount < 0) {
      return copy.projects.requiredPlannedAmount;
    }

    return null;
  }

  async function createBudgetLine() {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateBudgetLine(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/projects/${projectId}/budget-lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setForm(emptyForm);
      setSuccess(data.approvalRequired ? copy.projects.approvalRequestSubmitted : copy.projects.budgetLineCreatedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateBudgetLine(budgetLineId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateBudgetLine(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/projects/${projectId}/budget-lines/${budgetLineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setEditingId(null);
      setSuccess(data.approvalRequired ? copy.projects.approvalRequestSubmitted : copy.projects.budgetLineUpdatedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBudgetLine(budgetLineId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!window.confirm(copy.projects.deleteBudgetLineConfirm)) {
      return;
    }

    setDeletingId(budgetLineId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/projects/${projectId}/budget-lines/${budgetLineId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(data.approvalRequired ? copy.projects.approvalRequestSubmitted : copy.projects.budgetLineDeletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  const inputClassName = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={copy.projects.plannedBudget} value={moneyFormatter.format(summary.totalPlannedInCents / 100)} tone="blue" />
        <MetricCard label={copy.projects.actualExpense} value={moneyFormatter.format(summary.totalActualInCents / 100)} tone="red" />
        <MetricCard label={copy.projects.remainingBudget} value={moneyFormatter.format(summary.remainingBudgetInCents / 100)} tone={summary.remainingBudgetInCents >= 0 ? "green" : "red"} />
        <MetricCard label={copy.projects.variance} value={moneyFormatter.format(summary.varianceInCents / 100)} tone={summary.varianceInCents >= 0 ? "green" : "red"} />
        <MetricCard label={copy.projects.budgetUsage} value={`${summary.budgetUsagePercent.toFixed(1)}%`} tone="slate" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataPanel title={copy.projects.budgetOverview}>
          <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <div className="flex items-center justify-between"><span>{copy.projects.plannedBudget}</span><span>{moneyFormatter.format(summary.totalPlannedInCents / 100)}</span></div>
            <div className="flex items-center justify-between"><span>{copy.projects.actualExpense}</span><span>{moneyFormatter.format(summary.totalActualInCents / 100)}</span></div>
            <div className="flex items-center justify-between"><span>{copy.projects.unassignedExpense}</span><span>{moneyFormatter.format(summary.unassignedExpenseInCents / 100)}</span></div>
            <div className="flex items-center justify-between"><span>{copy.projects.remainingBudget}</span><span>{moneyFormatter.format(summary.remainingBudgetInCents / 100)}</span></div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between font-semibold text-slate-950"><span>{copy.projects.variance}</span><span>{moneyFormatter.format(summary.varianceInCents / 100)}</span></div>
          </div>
        </DataPanel>

        <DataPanel title={editingId ? copy.projects.editBudgetLine : copy.projects.addBudgetLine}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.budgetCategory}</span><select value={editingId ? editingForm.budgetCategoryId : form.budgetCategoryId} onChange={(event) => editingId ? updateEditingFormValue("budgetCategoryId", event.target.value) : updateFormValue("budgetCategoryId", event.target.value)} className={inputClassName}><option value="">{copy.common.noData}</option>{budgetCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.plannedAmount}</span><input type="number" min="0" step="0.01" value={editingId ? editingForm.plannedAmount : form.plannedAmount} onChange={(event) => editingId ? updateEditingFormValue("plannedAmount", event.target.value) : updateFormValue("plannedAmount", event.target.value)} className={inputClassName} /></label>
              <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.projects.noteOptional}</span><textarea rows={3} value={editingId ? editingForm.note : form.note} onChange={(event) => editingId ? updateEditingFormValue("note", event.target.value) : updateFormValue("note", event.target.value)} className={inputClassName} /></label>
            </div>
            {editingId ? (
              <div className="flex gap-3">
                <button type="button" disabled={submitting} onClick={() => void updateBudgetLine(editingId)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.projects.updateBudgetLineAction}</button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
              </div>
            ) : (
              <button type="button" disabled={submitting || !canManage} onClick={() => void createBudgetLine()} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{copy.projects.createBudgetLineAction}</button>
            )}
          </div>
        </DataPanel>
      </div>

      <DataPanel title={copy.projects.budgetLines}>
        {budgetLines.length === 0 ? (
          <p className="text-sm text-slate-500">{copy.projects.noBudgetLines}</p>
        ) : (
          <div className="space-y-3">
            {budgetLines.map((line) => (
              <div key={line.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{line.budgetCategoryName}</p>
                    <p className="mt-1 text-sm text-slate-500">{line.note || copy.common.noData}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3 lg:min-w-[28rem]">
                    <div><p className="text-slate-500">{copy.projects.plannedBudget}</p><p className="font-medium text-slate-950">{moneyFormatter.format(line.plannedAmountInCents / 100)}</p></div>
                    <div><p className="text-slate-500">{copy.projects.actualExpense}</p><p className="font-medium text-slate-950">{moneyFormatter.format(line.actualAmountInCents / 100)}</p></div>
                    <div><p className="text-slate-500">{copy.projects.variance}</p><p className={`font-medium ${line.varianceInCents >= 0 ? "text-emerald-700" : "text-red-700"}`}>{moneyFormatter.format(line.varianceInCents / 100)}</p></div>
                  </div>
                </div>
                {canManage ? (
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => { setEditingId(line.id); setEditingForm(toForm(line)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button>
                    <button type="button" disabled={deletingId === line.id} onClick={() => void deleteBudgetLine(line.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === line.id ? copy.common.deleting : copy.common.delete}</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
