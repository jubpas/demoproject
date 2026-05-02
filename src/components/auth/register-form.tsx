"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  callbackUrl?: string;
  copy: {
    auth: {
      registerTitle: string;
      welcomeDescription: string;
      registerEyebrow: string;
      registerDetailsEyebrow: string;
      registerStepOne: string;
      registerStepOneTitle: string;
      registerStepTwo: string;
      registerStepTwoTitle: string;
      registerStepThree: string;
      registerStepThreeTitle: string;
      passwordPlaceholder: string;
      confirmPasswordPlaceholder: string;
      email: string;
      password: string;
      name: string;
      confirmPassword: string;
      registerAction: string;
      registerLoading: string;
      hasAccount: string;
      goLogin: string;
      genericError: string;
      passwordMismatch: string;
      passwordTooShort: string;
      nameRequired: string;
    };
    common?: {
      appName: string;
    };
  };
};

export function RegisterForm({ locale, callbackUrl, copy }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(copy.auth.nameRequired);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.auth.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(copy.auth.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.auth.genericError);
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(copy.auth.genericError);
        return;
      }

      router.push(result?.url ?? callbackUrl ?? `/${locale}/onboarding/create-organization`);
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
            {copy.common?.appName ?? "SiteFlow"}
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--primary)]">{copy.auth.registerDetailsEyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-medium leading-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                {copy.auth.registerTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                {copy.auth.welcomeDescription}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.registerStepOne}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.registerStepOneTitle}</p>
              </div>
              <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.registerStepTwo}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.registerStepTwoTitle}</p>
              </div>
              <div className="rounded-xl border p-5 sm:col-span-2 xl:col-span-1" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-sm text-[var(--muted)]">{copy.auth.registerStepThree}</p>
                <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{copy.auth.registerStepThreeTitle}</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm lg:flex" style={{ color: "var(--muted)" }}>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            {copy.common?.appName ?? "SiteFlow"}
          </div>
        </div>

        <div className="flex items-center border-t px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 xl:px-12" style={{ borderTopColor: "var(--border)", background: "var(--surface)" }}>
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{copy.auth.registerDetailsEyebrow}</p>
              <h2 className="text-3xl font-medium text-[var(--foreground)] sm:text-4xl">{copy.auth.registerTitle}</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">{copy.auth.welcomeDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.12)", color: "#ff4d4d" }}>
                  {error}
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.name}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    placeholder="Somchai Site Manager"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    placeholder="name@company.com"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.password}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    placeholder={copy.auth.passwordPlaceholder}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{copy.auth.confirmPassword}</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="w-full rounded-md border px-4 py-3 outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    placeholder={copy.auth.confirmPasswordPlaceholder}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--primary)" }}
              >
                {loading ? copy.auth.registerLoading : copy.auth.registerAction}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              {copy.auth.hasAccount}{" "}
              <Link
                href={{
                  pathname: `/${locale}/login`,
                  query: callbackUrl ? { callbackUrl } : undefined,
                }}
                className="font-medium text-[var(--primary)] hover:text-[var(--primary-glow)]"
              >
                {copy.auth.goLogin}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
