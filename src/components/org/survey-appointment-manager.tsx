"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";
import type { SurveyAppointmentStatus } from "@prisma/client";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type CustomerOption = { id: string; name: string };
type ProjectOption = { id: string; name: string };
type MemberOption = { id: string; name: string };

type SurveyAppointmentItem = {
  id: string;
  customerId: string;
  customerName: string;
  projectId: string | null;
  projectName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  title: string;
  location: string;
  contactName: string | null;
  contactPhone: string | null;
  scheduledStart: string;
  scheduledEnd: string | null;
  status: SurveyAppointmentStatus;
  note: string | null;
};

type AppointmentForm = {
  customerId: string;
  projectId: string;
  assignedToId: string;
  title: string;
  location: string;
  contactName: string;
  contactPhone: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: SurveyAppointmentStatus;
  note: string;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  appointments: SurveyAppointmentItem[];
  customers: CustomerOption[];
  projects: ProjectOption[];
  members: MemberOption[];
  canManage: boolean;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      unauthorized: string;
      noData: string;
    };
    surveyAppointments: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      customer: string;
      project: string;
      noProject: string;
      titleField: string;
      location: string;
      contactName: string;
      contactPhone: string;
      scheduledStart: string;
      scheduledEnd: string;
      status: string;
      note: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      requiredTitle: string;
      requiredCustomer: string;
      requiredLocation: string;
      requiredStart: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
      convertToQuotation: string;
      convertingToQuotation: string;
      convertedToQuotationSuccess: string;
      pending: string;
      confirmed: string;
      completed: string;
      cancelled: string;
      rescheduled: string;
    };
  };
};

const emptyForm: AppointmentForm = {
  customerId: "",
  projectId: "",
  assignedToId: "",
  title: "",
  location: "",
  contactName: "",
  contactPhone: "",
  scheduledStart: "",
  scheduledEnd: "",
  status: "PENDING",
  note: "",
};

function toForm(item: SurveyAppointmentItem): AppointmentForm {
  return {
    customerId: item.customerId,
    projectId: item.projectId ?? "",
    assignedToId: item.assignedToId ?? "",
    title: item.title,
    location: item.location,
    contactName: item.contactName ?? "",
    contactPhone: item.contactPhone ?? "",
    scheduledStart: item.scheduledStart.slice(0, 16),
    scheduledEnd: item.scheduledEnd?.slice(0, 16) ?? "",
    status: item.status,
    note: item.note ?? "",
  };
}

function getStatusOptions(copy: Props["copy"]) {
  return [
    { value: "PENDING" as SurveyAppointmentStatus, label: copy.surveyAppointments.pending, tone: "slate" as const },
    { value: "CONFIRMED" as SurveyAppointmentStatus, label: copy.surveyAppointments.confirmed, tone: "blue" as const },
    { value: "COMPLETED" as SurveyAppointmentStatus, label: copy.surveyAppointments.completed, tone: "green" as const },
    { value: "CANCELLED" as SurveyAppointmentStatus, label: copy.surveyAppointments.cancelled, tone: "red" as const },
    { value: "RESCHEDULED" as SurveyAppointmentStatus, label: copy.surveyAppointments.rescheduled, tone: "amber" as const },
  ];
}

function Fields({ form, customers, projects, members, copy, onChange }: { form: AppointmentForm; customers: CustomerOption[]; projects: ProjectOption[]; members: MemberOption[]; copy: Props["copy"]; onChange: (field: keyof AppointmentForm, value: string) => void; }) {
  const inputClassName = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  const statusOptions = getStatusOptions(copy);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.customer}</span><select value={form.customerId} onChange={(event) => onChange("customerId", event.target.value)} className={inputClassName}><option value="">-</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.project}</span><select value={form.projectId} onChange={(event) => onChange("projectId", event.target.value)} className={inputClassName}><option value="">{copy.surveyAppointments.noProject}</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.titleField}</span><input value={form.title} onChange={(event) => onChange("title", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.location}</span><input value={form.location} onChange={(event) => onChange("location", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.contactName}</span><input value={form.contactName} onChange={(event) => onChange("contactName", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.contactPhone}</span><input value={form.contactPhone} onChange={(event) => onChange("contactPhone", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.scheduledStart}</span><input type="datetime-local" value={form.scheduledStart} onChange={(event) => onChange("scheduledStart", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.scheduledEnd}</span><input type="datetime-local" value={form.scheduledEnd} onChange={(event) => onChange("scheduledEnd", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Assignee</span><select value={form.assignedToId} onChange={(event) => onChange("assignedToId", event.target.value)} className={inputClassName}><option value="">-</option>{members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.status}</span><select value={form.status} onChange={(event) => onChange("status", event.target.value)} className={inputClassName}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.surveyAppointments.note}</span><textarea rows={3} value={form.note} onChange={(event) => onChange("note", event.target.value)} className={inputClassName} /></label>
    </div>
  );
}

export function SurveyAppointmentManager({ locale, orgSlug, appointments, customers, projects, members, canManage, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<AppointmentForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const statusOptions = getStatusOptions(copy);
  const statusMap = Object.fromEntries(statusOptions.map((item) => [item.value, item])) as Record<SurveyAppointmentStatus, (typeof statusOptions)[number]>;

  const filteredAppointments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return appointments;
    return appointments.filter((item) => [item.title, item.customerName, item.projectName, item.location, item.contactName].filter(Boolean).join(" ").toLowerCase().includes(keyword));
  }, [appointments, query]);

  function updateForm(field: keyof AppointmentForm, value: string) { setForm((current) => ({ ...current, [field]: value as AppointmentForm[keyof AppointmentForm] })); }
  function updateEditingForm(field: keyof AppointmentForm, value: string) { setEditingForm((current) => ({ ...current, [field]: value as AppointmentForm[keyof AppointmentForm] })); }

  function validate(payload: AppointmentForm) {
    if (!payload.customerId) return copy.surveyAppointments.requiredCustomer;
    if (!payload.title.trim()) return copy.surveyAppointments.requiredTitle;
    if (!payload.location.trim()) return copy.surveyAppointments.requiredLocation;
    if (!payload.scheduledStart) return copy.surveyAppointments.requiredStart;
    return null;
  }

  async function submit(method: "POST" | "PATCH", appointmentId?: string) {
    const payload = method === "POST" ? form : editingForm;
    if (!canManage) return setError(copy.common.unauthorized);
    const validationError = validate(payload);
    if (validationError) return setError(validationError);
    setError(""); setSuccess(""); setSubmitting(true);
    const endpoint = method === "POST" ? `/api/org/${orgSlug}/survey-appointments` : `/api/org/${orgSlug}/survey-appointments/${appointmentId}`;

    try {
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? copy.common.unauthorized);
      if (method === "POST") { setForm(emptyForm); setSuccess(copy.surveyAppointments.createdSuccess); }
      else { setEditingId(null); setSuccess(copy.surveyAppointments.updatedSuccess); }
      startTransition(() => router.refresh());
    } catch { setError(copy.common.unauthorized); }
    finally { setSubmitting(false); }
  }

  async function remove(appointmentId: string) {
    if (!canManage) return setError(copy.common.unauthorized);
    if (!window.confirm(copy.surveyAppointments.deleteConfirm)) return;
    setDeletingId(appointmentId); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/org/${orgSlug}/survey-appointments/${appointmentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? copy.common.unauthorized);
      setSuccess(copy.surveyAppointments.deletedSuccess);
      startTransition(() => router.refresh());
    } catch { setError(copy.common.unauthorized); }
    finally { setDeletingId(null); }
  }

  async function convertToQuotation(appointmentId: string) {
    if (!canManage) return setError(copy.common.unauthorized);
    setConvertingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/survey-appointments/${appointmentId}/convert-to-quotation`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? copy.common.unauthorized);
      setSuccess(copy.surveyAppointments.convertedToQuotationSuccess);
      router.push(`/${locale}/org/${orgSlug}/quotations/${data.quotationId}`);
      router.refresh();
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.surveyAppointments.title} description={copy.surveyAppointments.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DataPanel title={copy.surveyAppointments.createTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <Fields form={form} customers={customers} projects={projects} members={members} copy={copy} onChange={updateForm} />
            <button type="button" disabled={!canManage || submitting} onClick={() => void submit("POST")} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? copy.surveyAppointments.createLoading : copy.surveyAppointments.createAction}</button>
          </div>
        </DataPanel>

        <DataPanel title={copy.surveyAppointments.listTitle} actions={<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search appointment" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />}>
          {filteredAppointments.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><p className="text-lg font-medium text-slate-900">{copy.surveyAppointments.emptyTitle}</p><p className="mt-2 text-sm text-slate-500">{copy.surveyAppointments.emptyDescription}</p></div> : <div className="space-y-4">{filteredAppointments.map((item) => {
            const isEditing = editingId === item.id;
            return <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">{isEditing ? <div className="space-y-4"><Fields form={editingForm} customers={customers} projects={projects} members={members} copy={copy} onChange={updateEditingForm} /><div className="flex gap-3"><button type="button" onClick={() => void submit("PATCH", item.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.surveyAppointments.updateAction}</button><button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button></div></div> : <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-base font-semibold text-slate-950">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.customerName} · {item.location}</p></div><StatusBadge label={statusMap[item.status].label} tone={statusMap[item.status].tone} /></div><div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p>{copy.surveyAppointments.project}: {item.projectName || copy.surveyAppointments.noProject}</p><p>Assignee: {item.assignedToName || copy.common.noData}</p><p>{copy.surveyAppointments.scheduledStart}: {item.scheduledStart.slice(0, 16).replace("T", " ")}</p><p>{copy.surveyAppointments.scheduledEnd}: {item.scheduledEnd ? item.scheduledEnd.slice(0, 16).replace("T", " ") : copy.common.noData}</p><p>{copy.surveyAppointments.contactName}: {item.contactName || copy.common.noData}</p><p>{copy.surveyAppointments.contactPhone}: {item.contactPhone || copy.common.noData}</p></div><p className="text-sm text-slate-600">{item.note || copy.common.noData}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingId(item.id); setEditingForm(toForm(item)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button><button type="button" disabled={convertingId === item.id} onClick={() => void convertToQuotation(item.id)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">{convertingId === item.id ? copy.surveyAppointments.convertingToQuotation : copy.surveyAppointments.convertToQuotation}</button><button type="button" disabled={deletingId === item.id} onClick={() => void remove(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === item.id ? copy.common.deleting : copy.common.delete}</button></div></div>}</div>;
          })}</div>}
        </DataPanel>
      </div>
    </div>
  );
}
