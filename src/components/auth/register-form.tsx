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
    <div className="glass-panel grid w-full overflow-hidden rounded-[28px] sm:rounded-[36px] lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,0.72fr)]">
      <div className="flex min-h-[360px] flex-col justify-between border-b border-white/10 bg-slate-950/42 px-6 py-8 sm:px-10 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-12 lg:py-12 xl:px-14">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-200/80">{copy.auth.registerEyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {copy.auth.registerTitle}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            {copy.auth.welcomeDescription}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/12 bg-white/8 p-5">
            <p className="text-sm text-slate-300">{copy.auth.registerStepOne}</p>
            <p className="mt-2 font-semibold text-white">{copy.auth.registerStepOneTitle}</p>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/8 p-5">
            <p className="text-sm text-slate-300">{copy.auth.registerStepTwo}</p>
            <p className="mt-2 font-semibold text-white">{copy.auth.registerStepTwoTitle}</p>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/8 p-5">
            <p className="text-sm text-slate-300">{copy.auth.registerStepThree}</p>
            <p className="mt-2 font-semibold text-white">{copy.auth.registerStepThreeTitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center bg-slate-950/72 px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">{copy.auth.registerDetailsEyebrow}</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{copy.auth.registerTitle}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-red-400/35 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-200">{copy.auth.name}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
                  placeholder="Somchai Site Manager"
                />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-200">{copy.auth.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
                  placeholder="name@company.com"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">{copy.auth.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
                  placeholder={copy.auth.passwordPlaceholder}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">{copy.auth.confirmPassword}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
                  placeholder={copy.auth.confirmPasswordPlaceholder}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 px-4 py-3 font-semibold text-white shadow-[0_16px_48px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? copy.auth.registerLoading : copy.auth.registerAction}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            {copy.auth.hasAccount}{" "}
            <Link
              href={{
                pathname: `/${locale}/login`,
                query: callbackUrl ? { callbackUrl } : undefined,
              }}
              className="font-medium text-sky-300 hover:text-sky-200"
            >
              {copy.auth.goLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
