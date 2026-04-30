import prisma from "@/lib/db";
import { MemberManager } from "@/components/org/member-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationMembers, getAssignableMemberRoles } from "@/lib/organization";
import { getOrganizationSeatSummary } from "@/lib/subscription";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership, user } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [members, invites, seatSummary] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.organizationInvite.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getOrganizationSeatSummary(organization.id),
  ]);

  return (
    <MemberManager
      locale={validLocale}
      orgSlug={orgSlug}
      canManage={user.isSuperAdmin || canManageOrganizationMembers(membership.role)}
      isSuperAdmin={user.isSuperAdmin}
      assignableRoles={
        user.isSuperAdmin
          ? (["OWNER", "ADMIN", "MANAGER", "STAFF"] as ("OWNER" | "ADMIN" | "MANAGER" | "STAFF")[])
          : (getAssignableMemberRoles(membership.role) as ("OWNER" | "ADMIN" | "MANAGER" | "STAFF")[])
      }
      members={members.map((item) => ({
        id: item.id,
        name: item.user.name || item.user.email || "User",
        email: item.user.email,
        role: item.role,
        joinedAt: item.createdAt.toISOString(),
        isCurrentUser: item.userId === user.id,
      }))}
      invites={invites.map((item) => ({
        id: item.id,
        email: item.email,
        role: item.role,
        status: item.status,
        expiresAt: item.expiresAt.toISOString(),
        invitedByName: item.invitedBy.name || item.invitedBy.email || "User",
      }))}
      seatSummary={{
        usedSeats: seatSummary.usedSeats,
        seatLimit: seatSummary.seatLimit,
        membershipCount: seatSummary.membershipCount,
        pendingInviteCount: seatSummary.pendingInviteCount,
        subscriptionName: seatSummary.subscription?.plan.name ?? null,
        subscriptionStatus: seatSummary.subscription?.status ?? null,
      }}
      copy={{ common: messages.common, members: messages.members }}
    />
  );
}
