"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";
import { DataPanel } from "@/components/dashboard/data-panel";
import { PageHeader } from "@/components/dashboard/page-header";

type CustomerItem = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  createdAt: string;
};

type Props = {
  locale: Locale;
  orgSlug: string;
  customers: CustomerItem[];
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
    customers: {
      title: string;
      subtitle: string;
      createTitle: string;
      listTitle: string;
      emptyTitle: string;
      emptyDescription: string;
      name: string;
      companyName: string;
      phone: string;
      email: string;
      address: string;
      note: string;
      createAction: string;
      createLoading: string;
      updateAction: string;
      deleteConfirm: string;
      requiredName: string;
      createdSuccess: string;
      updatedSuccess: string;
      deletedSuccess: string;
    };
  };
};

type CustomerForm = {
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};

const emptyForm: CustomerForm = {
  name: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  note: "",
};

function toForm(customer: CustomerItem): CustomerForm {
  return {
    name: customer.name,
    companyName: customer.companyName ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    note: customer.note ?? "",
  };
}

function CustomerFields({
  form,
  onChange,
  copy,
}: {
  form: CustomerForm;
  onChange: (field: keyof CustomerForm, value: string) => void;
  copy: Props["copy"];
}) {
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.name}</span>
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.companyName}</span>
        <input value={form.companyName} onChange={(event) => onChange("companyName", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.phone}</span>
        <input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.email}</span>
        <input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.address}</span>
        <input value={form.address} onChange={(event) => onChange("address", event.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-700">{copy.customers.note}</span>
        <textarea rows={3} value={form.note} onChange={(event) => onChange("note", event.target.value)} className={inputClassName} />
      </label>
    </div>
  );
}

export function CustomerManager({ locale, orgSlug, customers, canManage, copy }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.companyName, customer.email, customer.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [customers, query]);

  function updateForm(field: keyof CustomerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditingForm(field: keyof CustomerForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value }));
  }

  async function submitCustomer(method: "POST" | "PATCH", customerId?: string) {
    const payload = method === "POST" ? form : editingForm;

    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!payload.name.trim()) {
      setError(copy.customers.requiredName);
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    const endpoint = method === "POST" ? `/api/org/${orgSlug}/customers` : `/api/org/${orgSlug}/customers/${customerId}`;

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
        setSuccess(copy.customers.createdSuccess);
      } else {
        setEditingId(null);
        setSuccess(copy.customers.updatedSuccess);
      }

      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCustomer(customerId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!window.confirm(copy.customers.deleteConfirm)) {
      return;
    }

    setDeletingId(customerId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/customers/${customerId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.customers.deletedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.customers.title} description={copy.customers.subtitle} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DataPanel title={copy.customers.createTitle}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            <CustomerFields form={form} onChange={updateForm} copy={copy} />
            <button
              type="button"
              disabled={!canManage || submitting}
              onClick={() => void submitCustomer("POST")}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? copy.customers.createLoading : copy.customers.createAction}
            </button>
          </div>
        </DataPanel>

        <DataPanel
          title={copy.customers.listTitle}
          actions={
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          }
        >
          {filteredCustomers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-lg font-medium text-slate-900">{copy.customers.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{copy.customers.emptyDescription}</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-medium">{copy.customers.name}</th>
                      <th className="pb-3 font-medium">{copy.customers.companyName}</th>
                      <th className="pb-3 font-medium">{copy.customers.phone}</th>
                      <th className="pb-3 font-medium">{copy.customers.email}</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const isEditing = editingId === customer.id;

                      if (isEditing) {
                        return (
                          <tr key={customer.id} className="border-b border-slate-100 align-top">
                            <td colSpan={5} className="py-4">
                              <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                                <CustomerFields form={editingForm} onChange={updateEditingForm} copy={copy} />
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => void submitCustomer("PATCH", customer.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                                    {copy.customers.updateAction}
                                  </button>
                                  <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                                    {copy.common.cancel}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={customer.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-4 font-medium text-slate-950">{customer.name}</td>
                          <td className="py-4">{customer.companyName || copy.common.noData}</td>
                          <td className="py-4">{customer.phone || copy.common.noData}</td>
                          <td className="py-4">{customer.email || copy.common.noData}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/${locale}/org/${orgSlug}/customers/${customer.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                                {copy.common.view}
                              </Link>
                              <button
                                type="button"
                                disabled={!canManage}
                                onClick={() => {
                                  setEditingId(customer.id);
                                  setEditingForm(toForm(customer));
                                }}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
                              >
                                {copy.common.edit}
                              </button>
                              <button
                                type="button"
                                disabled={!canManage || deletingId === customer.id}
                                onClick={() => void deleteCustomer(customer.id)}
                                className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                              >
                                {deletingId === customer.id ? copy.common.deleting : copy.common.delete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filteredCustomers.map((customer) => {
                  const isEditing = editingId === customer.id;

                  return (
                    <div key={customer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <CustomerFields form={editingForm} onChange={updateEditingForm} copy={copy} />
                          <div className="flex gap-3">
                            <button type="button" onClick={() => void submitCustomer("PATCH", customer.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                              {copy.customers.updateAction}
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                              {copy.common.cancel}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-base font-semibold text-slate-950">{customer.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{customer.companyName || copy.common.noData}</p>
                          </div>
                          <div className="grid gap-2 text-sm text-slate-600">
                            <p>{copy.customers.phone}: {customer.phone || copy.common.noData}</p>
                            <p>{copy.customers.email}: {customer.email || copy.common.noData}</p>
                            <p>{copy.customers.address}: {customer.address || copy.common.noData}</p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/${locale}/org/${orgSlug}/customers/${customer.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                              {copy.common.view}
                            </Link>
                            <button type="button" onClick={() => {
                              setEditingId(customer.id);
                              setEditingForm(toForm(customer));
                            }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                              {copy.common.edit}
                            </button>
                            <button type="button" onClick={() => void deleteCustomer(customer.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
                              {deletingId === customer.id ? copy.common.deleting : copy.common.delete}
                            </button>
                          </div>
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
