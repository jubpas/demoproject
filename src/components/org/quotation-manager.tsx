"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuotationStatus } from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type CustomerOption = { id: string; name: string };
type ProjectOption = { id: string; name: string };

type QuotationItemData = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type QuotationData = {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  projectId: string | null;
  projectName: string | null;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string | null;
  discountInCents: number;
  taxEnabled: boolean;
  taxRate: number;
  subtotalInCents: number;
  taxInCents: number;
  totalInCents: number;
  note: string | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string | null;
    unitPriceInCents: number;
    totalInCents: number;
  }>;
};

type FormDataShape = {
  quotationNumber: string;
  customerId: string;
  projectId: string;
  issueDate: string;
  validUntil: string;
  status: QuotationStatus;
  discount: string;
  taxEnabled: boolean;
  taxRate: string;
  note: string;
  items: QuotationItemData[];
};

type Props = {
  locale: Locale;
  quotations: QuotationData[];
  customers: CustomerOption[];
  projects: ProjectOption[];
  orgSlug: string;
  initialCustomerId?: string;
  canManage: boolean;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      unauthorized: string;
      noData: string;
      add: string;
      print: string;
      view: string;
    };
    quotations: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      quotationNumber: string;
      customer: string;
      project: string;
      surveyAppointments: string;
      noProject: string;
      issueDate: string;
      validUntil: string;
      status: string;
      note: string;
      addItem: string;
      itemDescription: string;
      quantity: string;
      unit: string;
      unitPrice: string;
      lineTotal: string;
      subtotal: string;
      discount: string;
      taxEnabled: string;
      taxRate: string;
      taxAmount: string;
      total: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      requiredCustomer: string;
      requiredNumber: string;
      requiredItem: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
      draft: string;
      sent: string;
      accepted: string;
      rejected: string;
      expired: string;
      allStatuses: string;
      allCustomers: string;
      allProjects: string;
      clearFilters: string;
      searchQuotationsPlaceholder: string;
      flowHint: string;
    };
  };
};

const emptyItem: QuotationItemData = {
  description: "",
  quantity: "1",
  unit: "",
  unitPrice: "0",
};

const emptyForm: FormDataShape = {
  quotationNumber: "",
  customerId: "",
  projectId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: "",
  status: "DRAFT",
  discount: "0",
  taxEnabled: false,
  taxRate: "7",
  note: "",
  items: [{ ...emptyItem }],
};

function toForm(data: QuotationData): FormDataShape {
  return {
    quotationNumber: data.quotationNumber,
    customerId: data.customerId,
    projectId: data.projectId ?? "",
    issueDate: data.issueDate.slice(0, 10),
    validUntil: data.validUntil?.slice(0, 10) ?? "",
    status: data.status,
    discount: String(data.discountInCents / 100),
    taxEnabled: data.taxEnabled,
    taxRate: String(data.taxRate),
    note: data.note ?? "",
    items: data.items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit ?? "",
      unitPrice: String(item.unitPriceInCents / 100),
    })),
  };
}

function getStatusOptions(copy: Props["copy"]) {
  return [
    { value: "DRAFT" as QuotationStatus, label: copy.quotations.draft, tone: "slate" as const },
    { value: "SENT" as QuotationStatus, label: copy.quotations.sent, tone: "blue" as const },
    { value: "ACCEPTED" as QuotationStatus, label: copy.quotations.accepted, tone: "green" as const },
    { value: "REJECTED" as QuotationStatus, label: copy.quotations.rejected, tone: "red" as const },
    { value: "EXPIRED" as QuotationStatus, label: copy.quotations.expired, tone: "amber" as const },
  ];
}

function calculatePreview(form: FormDataShape) {
  const subtotal = form.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + qty * unitPrice;
  }, 0);
  const discount = Number(form.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxRate = form.taxEnabled ? Number(form.taxRate) || 0 : 0;
  const tax = taxable * (taxRate / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

function Fields({
  form,
  customers,
  projects,
  copy,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: {
  form: FormDataShape;
  customers: CustomerOption[];
  projects: ProjectOption[];
  copy: Props["copy"];
  onChange: (field: keyof FormDataShape, value: string | boolean) => void;
  onItemChange: (index: number, field: keyof QuotationItemData, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}) {
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  const statusOptions = getStatusOptions(copy);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.quotationNumber}</span><input value={form.quotationNumber} onChange={(event) => onChange("quotationNumber", event.target.value)} className={inputClassName} /></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.customer}</span><select value={form.customerId} onChange={(event) => onChange("customerId", event.target.value)} className={inputClassName}><option value="">-</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.project}</span><select value={form.projectId} onChange={(event) => onChange("projectId", event.target.value)} className={inputClassName}><option value="">{copy.quotations.noProject}</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.status}</span><select value={form.status} onChange={(event) => onChange("status", event.target.value)} className={inputClassName}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.issueDate}</span><input type="date" value={form.issueDate} onChange={(event) => onChange("issueDate", event.target.value)} className={inputClassName} /></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.validUntil}</span><input type="date" value={form.validUntil} onChange={(event) => onChange("validUntil", event.target.value)} className={inputClassName} /></label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Items</h3><button type="button" onClick={onAddItem} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white">{copy.quotations.addItem}</button></div>
        <div className="space-y-3">
          {form.items.map((item, index) => {
            const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div key={`item-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[2fr_0.8fr_0.8fr_1fr_auto]">
                <input value={item.description} onChange={(event) => onItemChange(index, "description", event.target.value)} placeholder={copy.quotations.itemDescription} className={inputClassName} />
                <input value={item.quantity} onChange={(event) => onItemChange(index, "quantity", event.target.value)} placeholder={copy.quotations.quantity} className={inputClassName} />
                <input value={item.unit} onChange={(event) => onItemChange(index, "unit", event.target.value)} placeholder={copy.quotations.unit} className={inputClassName} />
                <input value={item.unitPrice} onChange={(event) => onItemChange(index, "unitPrice", event.target.value)} placeholder={copy.quotations.unitPrice} className={inputClassName} />
                <div className="flex items-center justify-between gap-3 md:flex-col md:items-end"><span className="text-sm font-medium text-slate-700">{total.toFixed(2)}</span><button type="button" onClick={() => onRemoveItem(index)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{copy.common.delete}</button></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.discount}</span><input value={form.discount} onChange={(event) => onChange("discount", event.target.value)} className={inputClassName} /></label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.taxEnabled} onChange={(event) => onChange("taxEnabled", event.target.checked)} />{copy.quotations.taxEnabled}</label>
        {form.taxEnabled ? <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.taxRate}</span><input value={form.taxRate} onChange={(event) => onChange("taxRate", event.target.value)} className={inputClassName} /></label> : null}
        <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.quotations.note}</span><textarea rows={3} value={form.note} onChange={(event) => onChange("note", event.target.value)} className={inputClassName} /></label>
      </div>
    </div>
  );
}

export function QuotationManager({ locale, quotations, customers, projects, orgSlug, initialCustomerId = "", canManage, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormDataShape>({ ...emptyForm, customerId: initialCustomerId });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FormDataShape>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "ALL">("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const moneyFormatter = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const statusOptions = getStatusOptions(copy);
  const statusMap = Object.fromEntries(statusOptions.map((item) => [item.value, item])) as Record<QuotationStatus, (typeof statusOptions)[number]>;

  const filteredQuotations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return quotations.filter((item) => {
      const matchesKeyword = keyword ? [item.quotationNumber, item.customerName, item.projectName, item.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword) : true;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesCustomer = customerFilter === "ALL" || item.customerId === customerFilter;
      const matchesProject = projectFilter === "ALL" || (projectFilter === "NONE" ? !item.projectId : item.projectId === projectFilter);
      return matchesKeyword && matchesStatus && matchesCustomer && matchesProject;
    });
  }, [quotations, query, statusFilter, customerFilter, projectFilter]);

  const preview = calculatePreview(form);

  function updateForm(field: keyof FormDataShape, value: string | boolean) { setForm((current) => ({ ...current, [field]: value as never })); }
  function updateEditingForm(field: keyof FormDataShape, value: string | boolean) { setEditingForm((current) => ({ ...current, [field]: value as never })); }
  function clearFilters() { setQuery(""); setStatusFilter("ALL"); setCustomerFilter("ALL"); setProjectFilter("ALL"); }
  function updateItems(target: "create" | "edit", index: number, field: keyof QuotationItemData, value: string) {
    const updater = target === "create" ? setForm : setEditingForm;
    updater((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }
  function addItem(target: "create" | "edit") { const updater = target === "create" ? setForm : setEditingForm; updater((current) => ({ ...current, items: [...current.items, { ...emptyItem }] })); }
  function removeItem(target: "create" | "edit", index: number) {
    const updater = target === "create" ? setForm : setEditingForm;
    updater((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index).length ? current.items.filter((_, itemIndex) => itemIndex !== index) : [{ ...emptyItem }] }));
  }

  function validate(payload: FormDataShape) {
    if (!payload.quotationNumber.trim()) return copy.quotations.requiredNumber;
    if (!payload.customerId) return copy.quotations.requiredCustomer;
    if (payload.items.length === 0 || payload.items.every((item) => !item.description.trim())) return copy.quotations.requiredItem;
    return null;
  }

  async function submit(method: "POST" | "PATCH", quotationId?: string) {
    const payload = method === "POST" ? form : editingForm;
    if (!canManage) return setError(copy.common.unauthorized);
    const validationError = validate(payload);
    if (validationError) return setError(validationError);
    setError("");
    setSuccess("");
    setSubmitting(true);
    const endpoint = method === "POST" ? `/api/org/${orgSlug}/quotations` : `/api/org/${orgSlug}/quotations/${quotationId}`;

    try {
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? copy.common.unauthorized);
      if (method === "POST") {
        setForm({ ...emptyForm, customerId: initialCustomerId });
        setSuccess(copy.quotations.createdSuccess);
      } else {
        setEditingId(null);
        setSuccess(copy.quotations.updatedSuccess);
      }
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(quotationId: string) {
    if (!canManage) return setError(copy.common.unauthorized);
    if (!window.confirm(copy.quotations.deleteConfirm)) return;
    setDeletingId(quotationId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/quotations/${quotationId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? copy.common.unauthorized);
      setSuccess(copy.quotations.deletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.quotations.title} description={copy.quotations.subtitle} />
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-600">{copy.quotations.flowHint}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/org/${orgSlug}/customers`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">{copy.quotations.customer}</Link>
            <Link href={`/${locale}/org/${orgSlug}/survey-appointments`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">{copy.quotations.surveyAppointments}</Link>
            <Link href={`/${locale}/org/${orgSlug}/projects`} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800">{copy.quotations.project}</Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label={copy.quotations.subtotal} value={moneyFormatter.format(preview.subtotal)} tone="slate" />
        <MetricCard label={copy.quotations.discount} value={moneyFormatter.format(preview.discount)} tone="red" />
        <MetricCard label={copy.quotations.taxAmount} value={moneyFormatter.format(preview.tax)} tone="blue" />
        <MetricCard label={copy.quotations.total} value={moneyFormatter.format(preview.total)} tone="green" />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DataPanel title={copy.quotations.createTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <Fields form={form} customers={customers} projects={projects} copy={copy} onChange={updateForm} onItemChange={(index, field, value) => updateItems("create", index, field, value)} onAddItem={() => addItem("create")} onRemoveItem={(index) => removeItem("create", index)} />
            <button type="button" disabled={!canManage || submitting} onClick={() => void submit("POST")} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? copy.quotations.createLoading : copy.quotations.createAction}</button>
          </div>
        </DataPanel>

        <DataPanel title={copy.quotations.listTitle} actions={<span className="text-xs font-medium text-slate-500">{filteredQuotations.length}/{quotations.length}</span>}>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.quotations.searchQuotationsPlaceholder} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as QuotationStatus | "ALL")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.quotations.allStatuses}</option>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.quotations.allCustomers}</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">{copy.quotations.allProjects}</option>
              <option value="NONE">{copy.quotations.noProject}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <button type="button" onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white">{copy.quotations.clearFilters}</button>
          </div>
          {filteredQuotations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-lg font-medium text-slate-900">{copy.quotations.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{copy.quotations.emptyDescription}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotations.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Fields form={editingForm} customers={customers} projects={projects} copy={copy} onChange={updateEditingForm} onItemChange={(index, field, value) => updateItems("edit", index, field, value)} onAddItem={() => addItem("edit")} onRemoveItem={(index) => removeItem("edit", index)} />
                        <div className="flex gap-3">
                          <button type="button" onClick={() => void submit("PATCH", item.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.quotations.updateAction}</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-950">{item.quotationNumber}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.customerName} · {item.projectName || copy.quotations.noProject}</p>
                          </div>
                          <StatusBadge label={statusMap[item.status].label} tone={statusMap[item.status].tone} />
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p>{copy.quotations.issueDate}: {item.issueDate.slice(0, 10)}</p>
                          <p>{copy.quotations.validUntil}: {item.validUntil ? item.validUntil.slice(0, 10) : copy.common.noData}</p>
                          <p>{copy.quotations.subtotal}: {moneyFormatter.format(item.subtotalInCents / 100)}</p>
                          <p>{copy.quotations.total}: {moneyFormatter.format(item.totalInCents / 100)}</p>
                        </div>
                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                          {item.items.map((line) => (
                            <div key={line.id} className="flex items-center justify-between gap-3 text-sm">
                              <div>
                                <p className="font-medium text-slate-900">{line.description}</p>
                                <p className="text-slate-500">{line.quantity} {line.unit || ""}</p>
                              </div>
                              <p className="text-slate-700">{moneyFormatter.format(line.totalInCents / 100)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setEditingId(item.id); setEditingForm(toForm(item)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button>
                          <Link href={`/${locale}/org/${orgSlug}/quotations/${item.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.view}</Link>
                          <button type="button" disabled={deletingId === item.id} onClick={() => void remove(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === item.id ? copy.common.deleting : copy.common.delete}</button>
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
