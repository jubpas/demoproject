"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";

type Role = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

type MemberItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  isCurrentUser: boolean;
};

type InviteItem = {
  id: string;
  email: string;
  role: Role;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  invitedByName: string;
};

type Props = {
  locale: string;
  orgSlug: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  assignableRoles: Role[];
  members: MemberItem[];
  invites: InviteItem[];
  seatSummary: {
    usedSeats: number;
    seatLimit: number | null;
    membershipCount: number;
    pendingInviteCount: number;
    subscriptionName: string | null;
    subscriptionStatus: string | null;
  };
  recentActivity: Array<{
    id: string;
    summary: string;
    action: string;
    actorName: string;
    createdAt: string;
  }>;
  copy: {
    common: {
      save: string;
      cancel: string;
      delete: string;
      unauthorized: string;
      noData: string;
    };
    members: {
      title: string;
      subtitle: string;
      inviteTitle: string;
      inviteDescription: string;
      activeMembersTitle: string;
      pendingInvitesTitle: string;
      email: string;
      role: string;
      createInvite: string;
      creatingInvite: string;
      inviteLink: string;
      copyLink: string;
      copied: string;
      noMembers: string;
      noInvites: string;
      currentPlan: string;
      noSubscription: string;
      seatsUsed: string;
      pendingSeats: string;
      memberUpdatedSuccess: string;
      memberRemovedSuccess: string;
      inviteRevokedSuccess: string;
      inviteSentSuccess: string;
      removeMember: string;
      revokeInvite: string;
      cannotManageSelf: string;
      alreadyMember: string;
      duplicateInvite: string;
      seatLimitReached: string;
      invalidEmail: string;
      roleAdmin: string;
      roleManager: string;
      roleStaff: string;
      roleOwner: string;
      statusPending: string;
      statusAccepted: string;
      statusRevoked: string;
      statusExpired: string;
      activityTitle: string;
      noActivity: string;
    };
  };
};

export function MemberManager({
  locale,
  orgSlug,
  canManage,
  isSuperAdmin,
  assignableRoles,
  members,
  invites,
  seatSummary,
  recentActivity,
  copy,
}: Props) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("STAFF");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const roleLabels: Record<Role, string> = {
    OWNER: copy.members.roleOwner,
    ADMIN: copy.members.roleAdmin,
    MANAGER: copy.members.roleManager,
    STAFF: copy.members.roleStaff,
  };

  const statusLabels = {
    PENDING: copy.members.statusPending,
    ACCEPTED: copy.members.statusAccepted,
    REVOKED: copy.members.statusRevoked,
    EXPIRED: copy.members.statusExpired,
  };
  const inviteRoles = assignableRoles.filter((role) => role !== "OWNER");

  async function createInvite() {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setError(copy.members.invalidEmail);
      return;
    }

    setInviteLoading(true);
    setError("");
    setSuccess("");
    setInviteLink("");
    setCopied(false);

    try {
      const response = await fetch(`/api/org/${orgSlug}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          locale,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setInviteEmail("");
      setInviteRole("STAFF");
      setInviteLink(new URL(data.inviteUrl, window.location.origin).toString());
      setSuccess(copy.members.inviteSentSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  }

  async function updateMemberRole(memberId: string, role: Role) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    setSavingMemberId(memberId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/memberships/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error === "You cannot update your own role" ? copy.members.cannotManageSelf : data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.members.memberUpdatedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setSavingMemberId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    setRemovingMemberId(memberId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/memberships/${memberId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error === "You cannot remove yourself" ? copy.members.cannotManageSelf : data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.members.memberRemovedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function revokeInvite(inviteId: string) {
    if (!canManage) {
      setError(copy.common.unauthorized);
      return;
    }

    setRevokingInviteId(inviteId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/org/${orgSlug}/invites/${inviteId}/revoke`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? copy.common.unauthorized);
        return;
      }

      setSuccess(copy.members.inviteRevokedSuccess);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.common.unauthorized);
    } finally {
      setRevokingInviteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={copy.members.title} description={copy.members.subtitle} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={copy.members.seatsUsed} value={seatSummary.seatLimit === null ? `${seatSummary.usedSeats}` : `${seatSummary.usedSeats} / ${seatSummary.seatLimit}`} tone="blue" />
        <MetricCard label={copy.members.currentPlan} value={seatSummary.subscriptionName ?? copy.members.noSubscription} tone="slate" />
        <MetricCard label={copy.members.activeMembersTitle} value={seatSummary.membershipCount.toString()} tone="green" />
        <MetricCard label={copy.members.pendingSeats} value={seatSummary.pendingInviteCount.toString()} tone="red" hint={seatSummary.subscriptionStatus ?? undefined} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataPanel title={copy.members.inviteTitle} description={copy.members.inviteDescription}>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{copy.members.email}</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="name@company.com"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{copy.members.role}</span>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as Role)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {inviteRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void createInvite()}
              disabled={!canManage || inviteLoading}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviteLoading ? copy.members.creatingInvite : copy.members.createInvite}
            </button>

            {inviteLink ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{copy.members.inviteLink}</p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <input
                    readOnly
                    value={inviteLink}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => void copyInviteLink()}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {copied ? copy.members.copied : copy.members.copyLink}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </DataPanel>

        <DataPanel title={copy.members.activeMembersTitle}>
          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              {copy.members.noMembers}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const canEdit = canManage && (isSuperAdmin || (!member.isCurrentUser && member.role !== "OWNER"));
                const availableRoles = Array.from(new Set([member.role, ...assignableRoles]));

                return (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{roleLabels[member.role]}</p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          value={member.role}
                          disabled={!canEdit || savingMemberId === member.id}
                          onChange={(event) => void updateMemberRole(member.id, event.target.value as Role)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void removeMember(member.id)}
                          disabled={!canEdit || removingMemberId === member.id}
                          className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {copy.members.removeMember}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DataPanel title={copy.members.pendingInvitesTitle}>
        {invites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            {copy.members.noInvites}
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{invite.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{roleLabels[invite.role]} • {statusLabels[invite.status]}</p>
                    <p className="mt-1 text-xs text-slate-400">{invite.invitedByName} • {new Date(invite.expiresAt).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeInvite(invite.id)}
                    disabled={!canManage || invite.status !== "PENDING" || revokingInviteId === invite.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.members.revokeInvite}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </DataPanel>

        <DataPanel title={copy.members.activityTitle}>
          {recentActivity.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              {copy.members.noActivity}
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{item.summary}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.actorName}</p>
                    </div>
                    <p className="text-xs text-slate-400">{item.createdAt.slice(0, 16).replace("T", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>
    </div>
  );
}
