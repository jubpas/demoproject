"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
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
      email: string;
      password: string;
      loginAction: string;
      loginLoading: string;
      noAccount: string;
      goRegister: string;
      invalidCredentials: string;
      genericError: string;
    };
  };
};

export function LoginForm({ locale, copy }: Props) {
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(copy.auth.invalidCredentials);
        return;
      }

      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel mx-auto w-full max-w-6xl overflow-hidden rounded-[32px]">
      <div className="grid min-h-[720px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-mesh flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-slate-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.6)]" />
            {copy.common.appName}
          </div>

          <div className="space-y-6 py-10 lg:max-w-lg">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-200/80">Construction SaaS</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {copy.auth.welcomeTitle}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-200/78 sm:text-lg">
                {copy.auth.welcomeDescription}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5">
                <p className="text-sm text-slate-300">Multi-company</p>
                <p className="mt-3 text-xl font-semibold text-white">Organization-first</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5">
                <p className="text-sm text-slate-300">Field-ready</p>
                <p className="mt-3 text-xl font-semibold text-white">Mobile responsive</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-300 lg:flex">
            <span className="h-px flex-1 bg-white/10" />
            Thai / English interface
          </div>
        </div>

        <div className="flex items-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-semibold text-white">{copy.auth.loginTitle}</h2>
              <p className="text-sm text-slate-300">{copy.auth.welcomeDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
              <Link href={`/${locale}/register`} className="font-medium text-sky-300 hover:text-sky-200">
                {copy.auth.goRegister}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
