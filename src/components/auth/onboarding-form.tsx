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
      setupEyebrow: string;
      helperTitle: string;
      helperDescription: string;
      organizationName: string;
      organizationDescription: string;
      organizationPlaceholder: string;
      descriptionPlaceholder: string;
      submit: string;
      submitLoading: string;
      required: string;
    };
    auth: {
      genericError: string;
    };
  };
};

export function OnboardingForm({ locale, copy }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(copy.onboarding.required);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.auth.genericError);
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
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
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200/80">{copy.onboarding.eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {copy.onboarding.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            {copy.onboarding.description}
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/12 bg-white/8 p-5 text-sm leading-7 text-slate-300 sm:p-6">
          <p className="font-medium text-white">{copy.onboarding.helperTitle}</p>
          <p className="mt-2">{copy.onboarding.helperDescription}</p>
        </div>
      </div>

      <div className="flex items-center bg-slate-950/72 px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">{copy.onboarding.setupEyebrow}</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{copy.onboarding.title}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-red-400/35 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">{copy.onboarding.organizationName}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder={copy.onboarding.organizationPlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">{copy.onboarding.organizationDescription}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder={copy.onboarding.descriptionPlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/10"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 px-4 py-3 font-semibold text-white shadow-[0_16px_48px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? copy.onboarding.submitLoading : copy.onboarding.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
