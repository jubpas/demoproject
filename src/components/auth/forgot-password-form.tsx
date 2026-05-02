"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  copy: {
    auth: {
      forgotPasswordTitle: string;
      forgotPasswordDescription: string;
      forgotPasswordAction: string;
      forgotPasswordLoading: string;
      forgotPasswordSuccess: string;
      forgotPasswordDevHint: string;
      email: string;
      backToLogin: string;
      genericError: string;
    };
  };
};

export function ForgotPasswordForm({ locale, copy }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResetUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.auth.genericError);
        return;
      }

      setSuccess(data.message ?? copy.auth.forgotPasswordSuccess);
      setResetUrl(typeof data.resetUrl === "string" ? data.resetUrl : "");
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-panel-strong w-full overflow-hidden rounded-xl sm:rounded-2xl">
      <div className="grid min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.68fr)]">
        <div className="flex min-h-[560px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-16" style={{ background: "var(--background)" }}>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 18px rgba(51,209,122,0.6)" }} />
            SiteFlow
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--primary)]">{copy.auth.forgotPasswordTitle}</p>
              <h1 className="max-w-4xl text-4xl font-medium leading-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                {copy.auth.forgotPasswordTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                {copy.auth.forgotPasswordDescription}
              </p>
            </div>

            <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-sm text-[var(--muted)]">
                <span className="text-base font-medium text-[var(--foreground)]">{copy.auth.backToLogin}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{copy.auth.forgotPasswordSuccess}</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm lg:flex" style={{ color: "var(--muted)" }}>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            SiteFlow
          </div>
        </div>

        <div className="flex items-center border-t px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 xl:px-12" style={{ borderTopColor: "var(--border)", background: "var(--surface)" }}>
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{copy.auth.forgotPasswordTitle}</p>
              <h2 className="text-3xl font-medium text-[var(--foreground)] sm:text-4xl">{copy.auth.forgotPasswordTitle}</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">{copy.auth.forgotPasswordDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.12)", color: "#ff4d4d" }}>
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(51,209,122,0.35)", background: "rgba(51,209,122,0.12)", color: "#33d17a" }}>
                  {success}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                />
              </label>

              {resetUrl ? (
                <div className="rounded-md border px-4 py-4 text-sm" style={{ borderColor: "rgba(0,167,255,0.35)", background: "rgba(0,167,255,0.12)", color: "#00a7ff" }}>
                  <p className="font-medium">{copy.auth.forgotPasswordDevHint}</p>
                  <a href={resetUrl} className="mt-2 block break-all underline underline-offset-4">
                    {resetUrl}
                  </a>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--primary)" }}
              >
                {loading ? copy.auth.forgotPasswordLoading : copy.auth.forgotPasswordAction}
              </button>

              <p className="text-center text-sm text-[var(--muted)]">
                <Link href={`/${locale}/login`} className="font-medium text-[var(--primary)] hover:text-[var(--primary-glow)]">
                  {copy.auth.backToLogin}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
