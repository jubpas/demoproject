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
    <div className="surface-panel-strong w-full overflow-hidden rounded-xl sm:rounded-2xl">
      <div className="grid min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.68fr)]">
        <div className="flex min-h-[560px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-16" style={{ background: "var(--background)" }}>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 18px rgba(51,209,122,0.6)" }} />
            {copy.common.appName}
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--primary)]">{copy.auth.productEyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-medium leading-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                {copy.auth.welcomeTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                {copy.auth.welcomeDescription}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.featureMultiCompany}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.featureOrganizationFirst}</p>
              </div>
              <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.featureFieldReady}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.featureMobileResponsive}</p>
              </div>
              <div className="rounded-xl border p-5 sm:col-span-2 xl:col-span-1" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.featureSecureAccess}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.featurePasswordProtected}</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm lg:flex" style={{ color: "var(--muted)" }}>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            {copy.auth.languageHint}
          </div>
        </div>

        <div className="flex items-center border-t px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 xl:px-12" style={{ borderTopColor: "var(--border)", background: "var(--surface)" }}>
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{copy.auth.loginEyebrow}</p>
              <h2 className="text-3xl font-medium text-[var(--foreground)] sm:text-4xl">{copy.auth.loginTitle}</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">{copy.auth.welcomeDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {resetSuccess ? (
                <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(51,209,122,0.35)", background: "rgba(51,209,122,0.12)", color: "#33d17a" }}>
                  {copy.auth.resetPasswordSuccess}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.12)", color: "#ff4d4d" }}>
                  {error}
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

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                />
              </label>

              <div className="flex justify-end">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-glow)]"
                >
                  {copy.auth.forgotPassword}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--primary)" }}
              >
                {loading ? copy.auth.loginLoading : copy.auth.loginAction}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              {copy.auth.noAccount}{" "}
              <Link
                href={{
                  pathname: `/${locale}/register`,
                  query: callbackUrl ? { callbackUrl } : undefined,
                }}
                className="font-medium text-[var(--primary)] hover:text-[var(--primary-glow)]"
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
