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
    invite: {
      title: string;
      description: string;
      eyebrow: string;
      inviteCode: string;
      inviteCodePlaceholder: string;
      joinAction: string;
      joinLoading: string;
      required: string;
    };
    auth: {
      genericError: string;
    };
  };
};

export function InviteJoinForm({ locale, copy }: Props) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!inviteCode.trim()) {
      setError(copy.invite.required);
      return;
    }

    setLoading(true);
    setError("");

    try {
      router.push(`/${locale}/invite/${inviteCode.trim()}`);
    } catch {
      setError(copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-panel-strong w-full overflow-hidden rounded-xl sm:rounded-2xl">
      <div className="grid min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.68fr)]">
        {/* Left Panel - Branding */}
        <div className="flex min-h-[560px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-16" style={{ background: "var(--background)" }}>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 18px rgba(51,209,122,0.6)" }} />
            {copy.common?.appName ?? "SiteFlow"}
          </div>

          <div className="max-w-4xl space-y-8 py-12 lg:py-16 xl:py-20">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--primary)]">{copy.invite.eyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-medium leading-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                {copy.invite.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                {copy.invite.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Invite Code Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">รหัสเชิญ</h2>
              <p className="text-sm text-[var(--muted)]">กรอกรหัสเชิญเพื่อเข้าร่วมองค์กร</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[var(--foreground)]">{copy.invite.inviteCode}</span>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={copy.invite.inviteCodePlaceholder}
                  className="mt-2 w-full rounded-lg border px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--border)", "--ring-color": "var(--primary)" } as React.CSSProperties}
                />
              </label>

              <button
                type="button"
                onClick={handleJoin}
                disabled={loading || !inviteCode.trim()}
                className="w-full rounded-lg px-6 py-3 text-center font-medium text-white transition-all disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {loading ? copy.invite.joinLoading : copy.invite.joinAction}
              </button>

              {error && (
                <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--error)", background: "rgba(255,77,77,0.1)", color: "var(--error)" }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
