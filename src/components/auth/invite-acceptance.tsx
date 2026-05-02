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
    <div className="mx-auto w-full max-w-2xl rounded-xl border p-6 text-[var(--foreground)] sm:p-8" style={{ borderColor: "var(--border-strong)", background: "var(--surface-elevated)" }}>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{copy.members.inviteLink}</p>
        <h1 className="text-2xl font-medium sm:text-3xl">{copy.members.acceptInviteTitle}</h1>
        <p className="text-sm leading-6 text-[var(--muted)]">{copy.members.acceptInviteDescription}</p>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border p-4 text-sm sm:grid-cols-3" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
        <div>
          <p className="text-[var(--muted-soft)]">{copy.members.organization}</p>
          <p className="mt-2 font-medium text-[var(--foreground)]">{organizationName}</p>
        </div>
        <div>
          <p className="text-[var(--muted-soft)]">{copy.members.invitedEmail}</p>
          <p className="mt-2 font-medium text-[var(--foreground)]">{inviteEmail}</p>
        </div>
        <div>
          <p className="text-[var(--muted-soft)]">{copy.members.role}</p>
          <p className="mt-2 font-medium text-[var(--foreground)]">{roleLabel}</p>
        </div>
      </div>

      {currentUserEmail ? (
        <p className="mt-5 text-sm text-[var(--muted)]">
          {copy.auth.signedInAs} {currentUserEmail}
        </p>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.12)", color: "var(--error)" }}>
          {error}
        </div>
      ) : null}

      {state === "READY" ? (
        <button
          type="button"
          onClick={() => void acceptInvite()}
          disabled={loading}
          className="mt-6 w-full rounded-md bg-[var(--primary)] px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? copy.members.acceptingInvite : copy.members.acceptInviteAction}
        </button>
      ) : null}

      {state === "LOGIN_REQUIRED" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={loginHref}
            className="rounded-md bg-[var(--primary)] px-4 py-3 text-center text-sm font-medium text-white transition hover:brightness-110"
          >
            {copy.members.backToLogin}
          </Link>
          <Link
            href={registerHref}
            className="rounded-md border px-4 py-3 text-center text-sm font-medium transition hover:brightness-95"
            style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
          >
            {copy.members.backToRegister}
          </Link>
        </div>
      ) : null}

      {state === "EMAIL_MISMATCH" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border px-4 py-4 text-sm" style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
            {copy.members.inviteEmailMismatch}
          </div>
          <button
            type="button"
            onClick={() => void handleSwitchAccount()}
            disabled={loading}
            className="w-full rounded-md border px-4 py-3 text-sm font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
          >
            {loading ? copy.members.acceptingInvite : copy.common.signOut}
          </button>
        </div>
      ) : null}

      {state === "EXPIRED" ? (
        <div className="mt-6 rounded-md border px-4 py-4 text-sm" style={{ borderColor: "rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.12)", color: "var(--error)" }}>
          {copy.members.inviteExpired}
        </div>
      ) : null}

      {state === "UNAVAILABLE" ? (
        <div className="mt-6 rounded-md border px-4 py-4 text-sm" style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--muted)" }}>
          {copy.members.inviteUnavailable}
        </div>
      ) : null}
    </div>
  );
}
