"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  callbackUrl?: string;
  resetSuccess?: boolean;
  copy: {
    common: {
      appName: string;
      thai: string;
      english: string;
    };
    auth: {
      welcomeTitle: string;
      welcomeDescription: string;
      loginTitle: string;
      loginEyebrow: string;
      productEyebrow: string;
      featureMultiCompany: string;
      featureOrganizationFirst: string;
      featureFieldReady: string;
      featureMobileResponsive: string;
      featureSecureAccess: string;
      featurePasswordProtected: string;
      languageHint: string;
      email: string;
      password: string;
      forgotPassword: string;
      loginAction: string;
      loginLoading: string;
      noAccount: string;
      goRegister: string;
      invalidCredentials: string;
      resetPasswordSuccess: string;
      genericError: string;
    };
  };
};

export function LoginForm({ locale, callbackUrl, resetSuccess = false, copy }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(copy.auth.invalidCredentials);
        return;
      }

      router.push(result?.url ?? callbackUrl ?? `/${locale}`);
      router.refresh();
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel w-full overflow-hidden rounded-[32px] sm:rounded-[40px]">
      <div className="grid min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.68fr)]">
        <div className="bg-mesh flex min-h-[560px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-16">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-slate-100 shadow-[0_12px_36px_rgba(15,23,42,0.28)]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.6)]" />
            {copy.common.appName}
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-200/80">{copy.auth.productEyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
                {copy.auth.welcomeTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200/78 sm:text-lg">
                {copy.auth.welcomeDescription}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-sm text-slate-300">{copy.auth.featureMultiCompany}</p>
                <p className="mt-3 text-xl font-semibold text-white">{copy.auth.featureOrganizationFirst}</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-sm text-slate-300">{copy.auth.featureFieldReady}</p>
                <p className="mt-3 text-xl font-semibold text-white">{copy.auth.featureMobileResponsive}</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:col-span-2 xl:col-span-1">
                <p className="text-sm text-slate-300">{copy.auth.featureSecureAccess}</p>
                <p className="mt-3 text-xl font-semibold text-white">{copy.auth.featurePasswordProtected}</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-300 lg:flex">
            <span className="h-px flex-1 bg-white/10" />
            {copy.auth.languageHint}
          </div>
        </div>

        <div className="flex items-center border-t border-white/10 bg-slate-950/72 px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 xl:px-12">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">{copy.auth.loginEyebrow}</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">{copy.auth.loginTitle}</h2>
              <p className="text-sm leading-6 text-slate-300">{copy.auth.welcomeDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {resetSuccess ? (
                <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                  {copy.auth.resetPasswordSuccess}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-400/35 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                  {error}
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

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">{copy.auth.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
                />
              </label>

              <div className="flex justify-end">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm font-medium text-sky-300 hover:text-sky-200"
                >
                  {copy.auth.forgotPassword}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 px-4 py-3 font-semibold text-white shadow-[0_16px_48px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? copy.auth.loginLoading : copy.auth.loginAction}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              {copy.auth.noAccount}{" "}
              <Link
                href={{
                  pathname: `/${locale}/register`,
                  query: callbackUrl ? { callbackUrl } : undefined,
                }}
                className="font-medium text-sky-300 hover:text-sky-200"
              >
                {copy.auth.goRegister}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
