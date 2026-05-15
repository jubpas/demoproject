"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  copy: {
    common: {
      appName: string;
    };
    onboarding: {
      title: string;
      description: string;
      eyebrow: string;
      createOrganization: string;
      createOrganizationDescription: string;
      joinOrganization: string;
      joinOrganizationDescription: string;
      createAction: string;
      joinAction: string;
      createLoading: string;
      joinLoading: string;
    };
    auth: {
      genericError: string;
    };
  };
};

export function OrganizationChoiceForm({ locale, copy }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreateOrganization() {
    setLoading("create");
    setError("");

    try {
      router.push(`/${locale}/onboarding/create-organization`);
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(null);
    }
  }

  async function handleJoinOrganization() {
    setLoading("join");
    setError("");

    try {
      router.push(`/${locale}/invite`);
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="surface-panel-strong w-full overflow-hidden rounded-xl sm:rounded-2xl">
      <div className="grid min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.68fr)]">
        {/* Left Panel - Branding */}
        <div className="flex min-h-[560px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-16" style={{ background: "var(--background)" }}>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 18px rgba(51,209,122,0.6)" }} />
            {copy.common?.appName ?? "SiteFlow"}
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--primary)]">{copy.onboarding.eyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-medium leading-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                {copy.onboarding.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                {copy.onboarding.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Choice Cards */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">เลือกวิธีเริ่มต้น</h2>
              <p className="text-sm text-[var(--muted)]">เลือกวิธีที่คุณต้องการเริ่มต้นใช้งาน</p>
            </div>

            {/* Create Organization Card */}
            <button
              type="button"
              onClick={handleCreateOrganization}
              disabled={loading === "create"}
              className="w-full rounded-xl border p-6 text-left transition-all hover:shadow-lg"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} />
                    สร้างองค์กรใหม่
                  </div>
                  <h3 className="text-lg font-medium text-[var(--foreground)]">{copy.onboarding.createOrganization}</h3>
                  <p className="text-sm text-[var(--muted)]">{copy.onboarding.createOrganizationDescription}</p>
                </div>
                <div className="flex-shrink-0">
                  {loading === "create" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                  ) : (
                    <svg className="h-6 w-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {/* Join Organization Card */}
            <button
              type="button"
              onClick={handleJoinOrganization}
              disabled={loading === "join"}
              className="w-full rounded-xl border p-6 text-left transition-all hover:shadow-lg"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--success)", color: "var(--success)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />
                    เข้าร่วมองค์กร
                  </div>
                  <h3 className="text-lg font-medium text-[var(--foreground)]">{copy.onboarding.joinOrganization}</h3>
                  <p className="text-sm text-[var(--muted)]">{copy.onboarding.joinOrganizationDescription}</p>
                </div>
                <div className="flex-shrink-0">
                  {loading === "join" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--success)] border-t-transparent" />
                  ) : (
                    <svg className="h-6 w-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {error && (
              <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--error)", background: "rgba(255,77,77,0.1)", color: "var(--error)" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
