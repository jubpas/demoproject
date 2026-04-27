"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectStatus } from "@prisma/client";
import type { Locale } from "@/lib/locales";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";

type CustomerOption = { id: string; name: string };

type ProjectItem = {
  id: string;
  name: string;
  code: string | null;
  customerId: string | null;
  customerName: string | null;
  location: string | null;
  budgetInCents: number | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  description: string | null;
};

type ProjectForm = {
  name: string;
  code: string;
  customerId: string;
  location: string;
  budget: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  description: string;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  projects: ProjectItem[];
  customers: CustomerOption[];
  canManage: boolean;
  copy: {
    common: {
      edit: string;
      cancel: string;
      delete: string;
      deleting: string;
      unauthorized: string;
      noData: string;
      view: string;
    };
    projects: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      name: string;
      code: string;
      customer: string;
      noCustomer: string;
      location: string;
      budget: string;
      startDate: string;
      endDate: string;
      status: string;
      description: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      requiredName: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
      detailTitle: string;
      detailSubtitle: string;
      overview: string;
      financialOverview: string;
      relatedQuotations: string;
      relatedAppointments: string;
      recentTransactions: string;
      viewDetail: string;
      noRelatedQuotations: string;
      noRelatedAppointments: string;
      noRecentTransactions: string;
      planning: string;
      active: string;
      onHold: string;
      completed: string;
      cancelled: string;
    };
  };
};

const emptyForm: ProjectForm = {
  name: "",
  code: "",
  customerId: "",
  location: "",
  budget: "",
  startDate: "",
  endDate: "",
  status: "PLANNING",
  description: "",
};

function toForm(project: ProjectItem): ProjectForm {
  return {
    name: project.name,
    code: project.code ?? "",
    customerId: project.customerId ?? "",
    location: project.location ?? "",
    budget: project.budgetInCents ? String(project.budgetInCents / 100) : "",
    startDate: project.startDate?.slice(0, 10) ?? "",
    endDate: project.endDate?.slice(0, 10) ?? "",
    status: project.status,
    description: project.description ?? "",
  };
}

function getStatusOptions(copy: Props["copy"]) {
  return [
    { value: "PLANNING" as ProjectStatus, label: copy.projects.planning, tone: "slate" as const },
    { value: "ACTIVE" as ProjectStatus, label: copy.projects.active, tone: "blue" as const },
    { value: "ON_HOLD" as ProjectStatus, label: copy.projects.onHold, tone: "amber" as const },
    { value: "COMPLETED" as ProjectStatus, label: copy.projects.completed, tone: "green" as const },
    { value: "CANCELLED" as ProjectStatus, label: copy.projects.cancelled, tone: "red" as const },
  ];
}

function ProjectFields({
  form,
  customers,
  copy,
  onChange,
}: {
  form: ProjectForm;
  customers: CustomerOption[];
  copy: Props["copy"];
  onChange: (field: keyof ProjectForm, value: string) => void;
}) {
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  const statusOptions = getStatusOptions(copy);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.projects.name}</span><input value={form.name} onChange={(event) => onChange("name", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.code}</span><input value={form.code} onChange={(event) => onChange("code", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.customer}</span><select value={form.customerId} onChange={(event) => onChange("customerId", event.target.value)} className={inputClassName}><option value="">{copy.projects.noCustomer}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.location}</span><input value={form.location} onChange={(event) => onChange("location", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.budget}</span><input type="number" min="0" step="0.01" value={form.budget} onChange={(event) => onChange("budget", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.startDate}</span><input type="date" value={form.startDate} onChange={(event) => onChange("startDate", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.endDate}</span><input type="date" value={form.endDate} onChange={(event) => onChange("endDate", event.target.value)} className={inputClassName} /></label>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{copy.projects.status}</span><select value={form.status} onChange={(event) => onChange("status", event.target.value)} className={inputClassName}>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
      <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{copy.projects.description}</span><textarea rows={4} value={form.description} onChange={(event) => onChange("description", event.target.value)} className={inputClassName} /></label>
    </div>
  );
}

export function ProjectManager({ locale, orgSlug, projects, customers, canManage, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ProjectForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");

  const moneyFormatter = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const statusOptions = getStatusOptions(copy);
  const statusMap = Object.fromEntries(statusOptions.map((item) => [item.value, item])) as Record<ProjectStatus, (typeof statusOptions)[number]>;

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return projects;
    }

    return projects.filter((project) =>
      [project.name, project.code, project.customerName, project.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [projects, query]);

  function updateForm(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value as ProjectForm[keyof ProjectForm] }));
  }

  function updateEditingForm(field: keyof ProjectForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value as ProjectForm[keyof ProjectForm] }));
  }

  async function submitProject(method: "POST" | "PATCH", projectId?: string) {
    const payload = method === "POST" ? form : editingForm;

    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!payload.name.trim()) {
      setError(copy.projects.requiredName);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    const endpoint = method === "POST" ? `/api/org/${orgSlug}/projects` : `/api/org/${orgSlug}/projects/${projectId}`;

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
        setSuccess(copy.projects.createdSuccess);
      } else {
        setEditingId(null);
        setSuccess(copy.projects.updatedSuccess);
      }

      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProject(projectId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!window.confirm(copy.projects.deleteConfirm)) {
      return;
    }

    setDeletingId(projectId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/projects/${projectId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.projects.deletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.projects.title} description={copy.projects.subtitle} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <DataPanel title={copy.projects.createTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <ProjectFields form={form} customers={customers} copy={copy} onChange={updateForm} />
            <button type="button" disabled={!canManage || submitting} onClick={() => void submitProject("POST")} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? copy.projects.createLoading : copy.projects.createAction}
            </button>
          </div>
        </DataPanel>

        <DataPanel title={copy.projects.listTitle} actions={<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />}>
          {filteredProjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-lg font-medium text-slate-900">{copy.projects.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{copy.projects.emptyDescription}</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-medium">{copy.projects.name}</th>
                      <th className="pb-3 font-medium">{copy.projects.customer}</th>
                      <th className="pb-3 font-medium">{copy.projects.status}</th>
                      <th className="pb-3 font-medium">{copy.projects.budget}</th>
                      <th className="pb-3 font-medium">{copy.projects.endDate}</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const isEditing = editingId === project.id;

                      if (isEditing) {
                        return (
                          <tr key={project.id} className="border-b border-slate-100 align-top">
                            <td colSpan={6} className="py-4">
                              <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                                <ProjectFields form={editingForm} customers={customers} copy={copy} onChange={updateEditingForm} />
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => void submitProject("PATCH", project.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.projects.updateAction}</button>
                                  <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={project.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-4"><p className="font-medium text-slate-950">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.code || copy.common.noData}</p></td>
                          <td className="py-4">{project.customerName || copy.projects.noCustomer}</td>
                          <td className="py-4"><StatusBadge label={statusMap[project.status].label} tone={statusMap[project.status].tone} /></td>
                          <td className="py-4">{project.budgetInCents ? moneyFormatter.format(project.budgetInCents / 100) : copy.common.noData}</td>
                          <td className="py-4">{project.endDate?.slice(0, 10) || copy.common.noData}</td>
                          <td className="py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/${locale}/org/${orgSlug}/projects/${project.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.projects.viewDetail}</Link><button type="button" onClick={() => { setEditingId(project.id); setEditingForm(toForm(project)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button><button type="button" disabled={deletingId === project.id} onClick={() => void deleteProject(project.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === project.id ? copy.common.deleting : copy.common.delete}</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filteredProjects.map((project) => {
                  const isEditing = editingId === project.id;

                  return (
                    <div key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <ProjectFields form={editingForm} customers={customers} copy={copy} onChange={updateEditingForm} />
                          <div className="flex gap-3">
                            <button type="button" onClick={() => void submitProject("PATCH", project.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">{copy.projects.updateAction}</button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{copy.common.cancel}</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-slate-950">{project.name}</p><p className="mt-1 text-sm text-slate-500">{project.customerName || copy.projects.noCustomer}</p></div><StatusBadge label={statusMap[project.status].label} tone={statusMap[project.status].tone} /></div>
                          <div className="grid gap-2 text-sm text-slate-600"><p>{copy.projects.location}: {project.location || copy.common.noData}</p><p>{copy.projects.budget}: {project.budgetInCents ? moneyFormatter.format(project.budgetInCents / 100) : copy.common.noData}</p></div>
                          <div className="flex gap-2 flex-wrap"><Link href={`/${locale}/org/${orgSlug}/projects/${project.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.projects.viewDetail}</Link><button type="button" onClick={() => { setEditingId(project.id); setEditingForm(toForm(project)); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{copy.common.edit}</button><button type="button" onClick={() => void deleteProject(project.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{deletingId === project.id ? copy.common.deleting : copy.common.delete}</button></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DataPanel>
      </div>
    </div>
  );
}
