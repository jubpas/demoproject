"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type Props = {
  locale: string;
  token: string;
  callbackUrl: string;
  currentUserEmail: string | null;
  inviteEmail: string;
  organizationName: string;
  roleLabel: string;
  state: "READY" | "LOGIN_REQUIRED" | "EMAIL_MISMATCH" | "EXPIRED" | "UNAVAILABLE";
  copy: {
    common: {
      signOut: string;
    };
    auth: {
      loginTitle: string;
      registerTitle: string;
      goLogin: string;
      goRegister: string;
      genericError: string;
      signedInAs: string;
    };
    members: {
      inviteLink: string;
      acceptInviteTitle: string;
      acceptInviteDescription: string;
      acceptInviteAction: string;
      acceptingInvite: string;
      inviteExpired: string;
      inviteUnavailable: string;
      inviteEmailMismatch: string;
      signInRequired: string;
      invitedEmail: string;
      organization: string;
      role: string;
      backToLogin: string;
      backToRegister: string;
    };
  };
};

export function InviteAcceptance({
  locale,
  token,
  callbackUrl,
  currentUserEmail,
  inviteEmail,
  organizationName,
  roleLabel,
  state,
  copy,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function acceptInvite() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale }),
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

  const loginHref = `/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const registerHref = `/${locale}/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  async function handleSwitchAccount() {
    setLoading(true);
    setError("");

    try {
      await signOut({
        redirect: true,
        callbackUrl: loginHref,
      });
    } catch {
      setError(copy.auth.genericError);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/12 bg-slate-950/75 p-8 text-white shadow-[0_28px_120px_rgba(2,6,23,0.45)] sm:p-10">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">{copy.members.inviteLink}</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{copy.members.acceptInviteTitle}</h1>
        <p className="text-sm leading-7 text-slate-300">{copy.members.acceptInviteDescription}</p>
      </div>

      <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/6 p-5 text-sm text-slate-200 sm:grid-cols-3">
        <div>
          <p className="text-slate-400">{copy.members.organization}</p>
          <p className="mt-2 font-medium text-white">{organizationName}</p>
        </div>
        <div>
          <p className="text-slate-400">{copy.members.invitedEmail}</p>
          <p className="mt-2 font-medium text-white">{inviteEmail}</p>
        </div>
        <div>
          <p className="text-slate-400">{copy.members.role}</p>
          <p className="mt-2 font-medium text-white">{roleLabel}</p>
        </div>
      </div>

      {currentUserEmail ? (
        <p className="mt-5 text-sm text-slate-300">
          {copy.auth.signedInAs} {currentUserEmail}
        </p>
      ) : null}

      {error ? <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {state === "READY" ? (
        <button
          type="button"
          onClick={() => void acceptInvite()}
          disabled={loading}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 px-4 py-3 font-semibold text-white shadow-[0_16px_48px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? copy.members.acceptingInvite : copy.members.acceptInviteAction}
        </button>
      ) : null}

      {state === "LOGIN_REQUIRED" ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={loginHref} className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700">
            {copy.members.backToLogin}
          </Link>
          <Link href={registerHref} className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-medium text-slate-100 transition hover:bg-white/12">
            {copy.members.backToRegister}
          </Link>
        </div>
      ) : null}

      {state === "EMAIL_MISMATCH" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/12 px-4 py-4 text-sm text-amber-100">
            {copy.members.inviteEmailMismatch}
          </div>
          <button
            type="button"
            onClick={() => void handleSwitchAccount()}
            disabled={loading}
            className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? copy.members.acceptingInvite : copy.common.signOut}
          </button>
        </div>
      ) : null}

      {state === "EXPIRED" ? (
        <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/12 px-4 py-4 text-sm text-red-100">
          {copy.members.inviteExpired}
        </div>
      ) : null}

      {state === "UNAVAILABLE" ? (
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-4 text-sm text-slate-200">
          {copy.members.inviteUnavailable}
        </div>
      ) : null}
    </div>
  );
}
