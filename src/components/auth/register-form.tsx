"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  copy: {
    auth: {
      registerTitle: string;
      welcomeDescription: string;
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

export function RegisterForm({ locale, copy }: Props) {
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
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.auth.genericError);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(copy.auth.genericError);
        return;
      }

      router.push(`/${locale}/onboarding/create-organization`);
      router.refresh();
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel mx-auto w-full max-w-2xl rounded-[32px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-white">{copy.auth.registerTitle}</h1>
        <p className="text-sm text-slate-300">{copy.auth.welcomeDescription}</p>
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
              placeholder="At least 6 characters"
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
              placeholder="Confirm your password"
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
        <Link href={`/${locale}/login`} className="font-medium text-sky-300 hover:text-sky-200">
          {copy.auth.goLogin}
        </Link>
      </p>
    </div>
  );
}
