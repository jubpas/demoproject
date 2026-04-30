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
    <div className="glass-panel grid w-full overflow-hidden rounded-[28px] sm:rounded-[36px] lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,0.7fr)]">
      <div className="flex min-h-[360px] flex-col justify-between border-b border-white/10 bg-slate-950/42 px-6 py-8 sm:px-10 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-12 lg:py-12 xl:px-14">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200/80">{copy.auth.forgotPasswordTitle}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {copy.auth.forgotPasswordTitle}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            {copy.auth.forgotPasswordDescription}
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/12 bg-white/8 p-5 text-sm leading-7 text-slate-300 sm:p-6">
          <p className="font-medium text-white">{copy.auth.backToLogin}</p>
          <p className="mt-2">{copy.auth.forgotPasswordSuccess}</p>
        </div>
      </div>

      <div className="flex items-center bg-slate-950/72 px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-red-400/35 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">{copy.auth.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="name@company.com"
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
              />
            </label>

            {resetUrl ? (
              <div className="rounded-2xl border border-sky-400/30 bg-sky-500/12 px-4 py-4 text-sm text-sky-100">
                <p className="font-medium">{copy.auth.forgotPasswordDevHint}</p>
                <a href={resetUrl} className="mt-2 block break-all underline underline-offset-4">
                  {resetUrl}
                </a>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 px-4 py-3 font-semibold text-white shadow-[0_16px_48px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? copy.auth.forgotPasswordLoading : copy.auth.forgotPasswordAction}
            </button>

            <p className="text-center text-sm text-slate-300">
              <Link href={`/${locale}/login`} className="font-medium text-sky-300 hover:text-sky-200">
                {copy.auth.backToLogin}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
