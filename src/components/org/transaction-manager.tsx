"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { PaymentStatus, TransactionType } from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type ProjectOption = { id: string; name: string };
type BudgetCategoryOption = { id: string; name: string };
type AttachmentItem = { id: string; fileName: string; filePath: string };
type TransactionItem = {
  id: string;
  type: TransactionType;
  paymentStatus: PaymentStatus;
  category: string;
  budgetCategoryId: string | null;
  budgetCategoryName: string | null;
  vendorName: string | null;
  referenceNumber: string | null;
  amountInCents: number;
  description: string | null;
  transactionDate: string;
  projectId: string | null;
  projectName: string | null;
  attachments: AttachmentItem[];
};

type TransactionForm = {
  type: TransactionType;
  paymentStatus: PaymentStatus;
  category: string;
  budgetCategoryId: string;
  vendorName: string;
  referenceNumber: string;
  amount: string;
  transactionDate: string;
  projectId: string;
  description: string;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  transactions: TransactionItem[];
  projects: ProjectOption[];
  budgetCategories: BudgetCategoryOption[];
  canWrite: boolean;
  canDelete: boolean;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      unauthorized: string;
      viewReceipt: string;
      receiptOptional: string;
      fileTypeError: string;
      fileSizeError: string;
      noData: string;
      removeReceipt: string;
      replaceReceipt: string;
      keepReceipts: string;
    };
    transactions: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      type: string;
      income: string;
      expense: string;
      category: string;
      budgetCategory: string;
      noBudgetCategory: string;
      paymentStatus: string;
      vendorName: string;
      referenceNumber: string;
      amount: string;
      transactionDate: string;
      project: string;
      description: string;
      receipt: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      requiredCategory: string;
      requiredAmount: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
      noProject: string;
      pending: string;
      paid: string;
      partiallyPaid: string;
      cancelled: string;
      allTypes: string;
      allPaymentStatuses: string;
      allProjects: string;
      allBudgetCategories: string;
      clearFilters: string;
      searchTransactionsPlaceholder: string;
    };
  };
};

const emptyForm: TransactionForm = {
  type: "EXPENSE",
  paymentStatus: "PAID",
  category: "",
  budgetCategoryId: "",
  vendorName: "",
  referenceNumber: "",
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  projectId: "",
  description: "",
};

function toForm(transaction: TransactionItem): TransactionForm {
  return {
    type: transaction.type,
    paymentStatus: transaction.paymentStatus,
    category: transaction.category,
    budgetCategoryId: transaction.budgetCategoryId ?? "",
    vendorName: transaction.vendorName ?? "",
    referenceNumber: transaction.referenceNumber ?? "",
    amount: String(transaction.amountInCents / 100),
    transactionDate: transaction.transactionDate.slice(0, 10),
    projectId: transaction.projectId ?? "",
    description: transaction.description ?? "",
  };
}

function TransactionFields({
  form,
  projects,
  budgetCategories,
  copy,
  onChange,
  allowReceipt,
  onReceiptChange,
}: {
  form: TransactionForm;
  projects: ProjectOption[];
  budgetCategories: BudgetCategoryOption[];
  copy: Props["copy"];
  onChange: (field: keyof TransactionForm, value: string) => void;
  allowReceipt: boolean;
  onReceiptChange?: (file: File | null) => void;
}) {
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.type}</span><select value={form.type} onChange={(event) => onChange("type", event.target.value)} className={inputClassName}><option value="INCOME">{copy.transactions.income}</option><option value="EXPENSE">{copy.transactions.expense}</option></select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.paymentStatus}</span><select value={form.paymentStatus} onChange={(event) => onChange("paymentStatus", event.target.value)} className={inputClassName}><option value="PENDING">{copy.transactions.pending}</option><option value="PAID">{copy.transactions.paid}</option><option value="PARTIALLY_PAID">{copy.transactions.partiallyPaid}</option><option value="CANCELLED">{copy.transactions.cancelled}</option></select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.category}</span><input value={form.category} onChange={(event) => onChange("category", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.amount}</span><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => onChange("amount", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.transactionDate}</span><input type="date" value={form.transactionDate} onChange={(event) => onChange("transactionDate", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.project}</span><select value={form.projectId} onChange={(event) => onChange("projectId", event.target.value)} className={inputClassName}><option value="">{copy.transactions.noProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.budgetCategory}</span><select value={form.budgetCategoryId} onChange={(event) => onChange("budgetCategoryId", event.target.value)} className={inputClassName}><option value="">{copy.transactions.noBudgetCategory}</option>{budgetCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.vendorName}</span><input value={form.vendorName} onChange={(event) => onChange("vendorName", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.referenceNumber}</span><input value={form.referenceNumber} onChange={(event) => onChange("referenceNumber", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.transactions.description}</span><textarea rows={3} value={form.description} onChange={(event) => onChange("description", event.target.value)} className={inputClassName} /></label>
      {allowReceipt ? <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.common.receiptOptional}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onReceiptChange?.(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" /></label> : null}
    </div>
  );
}

function getPaymentStatusLabel(status: PaymentStatus, copy: Props["copy"]) {
  switch (status) {
    case "PENDING":
      return copy.transactions.pending;
    case "PARTIALLY_PAID":
      return copy.transactions.partiallyPaid;
    case "CANCELLED":
      return copy.transactions.cancelled;
    default:
      return copy.transactions.paid;
  }
}

export function TransactionManager({ locale, orgSlug, transactions, projects, budgetCategories, canWrite, canDelete, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<TransactionForm>(emptyForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [editingReceiptFile, setEditingReceiptFile] = useState<File | null>(null);
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState("ALL");

  const moneyFormatter = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const filteredTransactions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesKeyword = keyword ? [transaction.category, transaction.projectName, transaction.description, transaction.vendorName, transaction.referenceNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword) : true;
      const matchesType = typeFilter === "ALL" || transaction.type === typeFilter;
      const matchesPayment = paymentFilter === "ALL" || transaction.paymentStatus === paymentFilter;
      const matchesProject = projectFilter === "ALL" || (projectFilter === "NONE" ? !transaction.projectId : transaction.projectId === projectFilter);
      const matchesBudgetCategory = budgetCategoryFilter === "ALL" || (budgetCategoryFilter === "NONE" ? !transaction.budgetCategoryId : transaction.budgetCategoryId === budgetCategoryFilter);
      return matchesKeyword && matchesType && matchesPayment && matchesProject && matchesBudgetCategory;
    });
  }, [transactions, query, typeFilter, paymentFilter, projectFilter, budgetCategoryFilter]);

  function clearFilters() {
    setQuery("");
    setTypeFilter("ALL");
    setPaymentFilter("ALL");
    setProjectFilter("ALL");
    setBudgetCategoryFilter("ALL");
  }

  const incomeTotal = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + item.amountInCents, 0);
  const expenseTotal = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + item.amountInCents, 0);

  function updateForm(field: keyof TransactionForm, value: string) {
    setForm((current) => ({ ...current, [field]: value as TransactionForm[keyof TransactionForm] }));
  }

  function updateEditingForm(field: keyof TransactionForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value as TransactionForm[keyof TransactionForm] }));
  }

  function validateCommon(formValue: TransactionForm) {
    if (!formValue.category.trim()) {
      return copy.transactions.requiredCategory;
    }

    const amount = Number(formValue.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return copy.transactions.requiredAmount;
    }

    return null;
  }

  function validateReceipt(file: File | null) {
    if (!file) {
      return null;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return copy.common.fileTypeError;
    }
    if (file.size > 5 * 1024 * 1024) {
      return copy.common.fileSizeError;
    }
    return null;
  }

  async function createTransaction() {
    if (!canWrite) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateCommon(form) ?? validateReceipt(receiptFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("type", form.type);
      formData.set("category", form.category.trim());
      formData.set("paymentStatus", form.paymentStatus);
      formData.set("budgetCategoryId", form.budgetCategoryId);
      formData.set("vendorName", form.vendorName);
      formData.set("referenceNumber", form.referenceNumber);
      formData.set("amount", form.amount);
      formData.set("transactionDate", form.transactionDate);
      formData.set("projectId", form.projectId);
      formData.set("description", form.description);
      if (receiptFile) {
        formData.set("receipt", receiptFile);
      }

      const response = await fetch(`/api/org/${orgSlug}/transactions`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setForm(emptyForm);
      setReceiptFile(null);
      setSuccess(copy.transactions.createdSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTransaction(transactionId: string) {
    if (!canWrite) {
      setError(copy.common.unauthorized);
      return;
    }

    const validationError = validateCommon(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const receiptError = validateReceipt(editingReceiptFile);
      if (receiptError) {
        setError(receiptError);
        return;
      }

      const formData = new FormData();
      formData.set("type", editingForm.type);
      formData.set("category", editingForm.category.trim());
      formData.set("paymentStatus", editingForm.paymentStatus);
      formData.set("budgetCategoryId", editingForm.budgetCategoryId);
      formData.set("vendorName", editingForm.vendorName);
      formData.set("referenceNumber", editingForm.referenceNumber);
      formData.set("amount", editingForm.amount);
      formData.set("transactionDate", editingForm.transactionDate);
      formData.set("projectId", editingForm.projectId);
      formData.set("description", editingForm.description);
      formData.set("removeExistingReceipt", String(removeExistingReceipt));
      if (editingReceiptFile) {
        formData.set("receipt", editingReceiptFile);
      }

      const response = await fetch(`/api/org/${orgSlug}/transactions/${transactionId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setEditingId(null);
      setEditingReceiptFile(null);
      setRemoveExistingReceipt(false);
      setSuccess(copy.transactions.updatedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransaction(transactionId: string) {
    if (!canDelete) {
      setError(copy.common.unauthorized);
      return;
    }
    if (!window.confirm(copy.transactions.deleteConfirm)) {
      return;
    }

    setDeletingId(transactionId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/transactions/${transactionId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.transactions.deletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.transactions.title} description={copy.transactions.subtitle} />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label={copy.transactions.income} value={moneyFormatter.format(incomeTotal / 100)} tone="green" />
        <MetricCard label={copy.transactions.expense} value={moneyFormatter.format(expenseTotal / 100)} tone="red" />
        <MetricCard label="Net" value={moneyFormatter.format((incomeTotal - expenseTotal) / 100)} tone={(incomeTotal - expenseTotal) >= 0 ? "blue" : "red"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <DataPanel title={copy.transactions.createTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <TransactionFields form={form} projects={projects} budgetCategories={budgetCategories} copy={copy} onChange={updateForm} allowReceipt onReceiptChange={setReceiptFile} />
            <button type="button" disabled={!canWrite || submitting} onClick={() => void createTransaction()} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? copy.transactions.createLoading : copy.transactions.createAction}
            </button>
          </div>
        </DataPanel>

        <DataPanel title={copy.transactions.listTitle} actions={<span className="text-xs font-medium text-slate-500">{filteredTransactions.length}/{transactions.length}</span>}>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.transactions.searchTransactionsPlaceholder} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionType | "ALL")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.transactions.allTypes}</option>
              <option value="INCOME">{copy.transactions.income}</option>
              <option value="EXPENSE">{copy.transactions.expense}</option>
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as PaymentStatus | "ALL")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.transactions.allPaymentStatuses}</option>
              <option value="PENDING">{copy.transactions.pending}</option>
              <option value="PAID">{copy.transactions.paid}</option>
              <option value="PARTIALLY_PAID">{copy.transactions.partiallyPaid}</option>
              <option value="CANCELLED">{copy.transactions.cancelled}</option>
            </select>
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.transactions.allProjects}</option>
              <option value="NONE">{copy.transactions.noProject}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select value={budgetCategoryFilter} onChange={(event) => setBudgetCategoryFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.transactions.allBudgetCategories}</option>
              <option value="NONE">{copy.transactions.noBudgetCategory}</option>
              {budgetCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <button type="button" onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white">{copy.transactions.clearFilters}</button>
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-lg font-medium text-slate-900">{copy.transactions.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{copy.transactions.emptyDescription}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const isEditing = editingId === transaction.id;
                const badgeTone = transaction.type === "INCOME" ? "green" : "red";

                return (
                  <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                         <TransactionFields form={editingForm} projects={projects} budgetCategories={budgetCategories} copy={copy} onChange={updateEditingForm} allowReceipt={false} />
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input type="checkbox" checked={removeExistingReceipt} onChange={(event) => setRemoveExistingReceipt(event.target.checked)} />
                            {copy.common.removeReceipt}
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">{copy.common.replaceReceipt}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setEditingReceiptFile(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
                          </label>
                          <p className="text-xs text-slate-500">{copy.common.keepReceipts}</p>
                        </div>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => void updateTransaction(transaction.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.transactions.updateAction}</button>
                          <button type="button" onClick={() => { setEditingId(null); setEditingReceiptFile(null); setRemoveExistingReceipt(false); }} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                             <div className="flex flex-wrap items-center gap-3">
                               <StatusBadge label={transaction.type === "INCOME" ? copy.transactions.income : copy.transactions.expense} tone={badgeTone} />
                               <StatusBadge label={getPaymentStatusLabel(transaction.paymentStatus, copy)} tone={transaction.paymentStatus === "CANCELLED" ? "red" : transaction.paymentStatus === "PENDING" ? "amber" : "blue"} />
                               <p className="font-semibold text-slate-950">{transaction.category}</p>
                             </div>
                            <p className="text-sm text-slate-500">{transaction.projectName || copy.transactions.noProject}</p>
                            <p className="text-xs text-slate-500">{transaction.budgetCategoryName || copy.transactions.noBudgetCategory}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${transaction.type === "INCOME" ? "text-emerald-700" : "text-red-700"}`}>
                              {moneyFormatter.format(transaction.amountInCents / 100)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{transaction.transactionDate.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>{transaction.description || copy.common.noData}</p>
                          <div className="space-y-1 text-xs text-slate-500 md:text-right">
                            <p>{copy.transactions.vendorName}: {transaction.vendorName || copy.common.noData}</p>
                            <p>{copy.transactions.referenceNumber}: {transaction.referenceNumber || copy.common.noData}</p>
                          </div>
                        </div>
                        {transaction.attachments.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {transaction.attachments.map((attachment) => (
                              <a key={attachment.id} href={attachment.filePath} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-200">
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                  <Image src={attachment.filePath} alt={attachment.fileName} width={640} height={360} className="h-32 w-full object-cover" />
                                </div>
                                <p className="mt-3 text-sm font-medium text-slate-900">{copy.common.viewReceipt}</p>
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setEditingId(transaction.id); setEditingForm(toForm(transaction)); setEditingReceiptFile(null); setRemoveExistingReceipt(false); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button>
                          <button type="button" disabled={!canDelete || deletingId === transaction.id} onClick={() => void deleteTransaction(transaction.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === transaction.id ? copy.common.deleting : copy.common.delete}</button>
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
