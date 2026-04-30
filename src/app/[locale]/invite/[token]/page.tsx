import { InviteAcceptance } from "@/components/auth/invite-acceptance";
import { getCurrentUser, requireLocale } from "@/lib/app-context";
import { getInviteByToken, isInviteExpired } from "@/lib/invites";
import { getMessages } from "@/lib/messages";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { locale, token } = await params;
  const validLocale = await requireLocale(locale);
  const messages = getMessages(validLocale);
  const [invite, currentUser] = await Promise.all([getInviteByToken(token), getCurrentUser()]);

  const callbackUrl = `/${validLocale}/invite/${token}`;

  const roleLabels = {
    OWNER: messages.members.roleOwner,
    ADMIN: messages.members.roleAdmin,
    MANAGER: messages.members.roleManager,
    STAFF: messages.members.roleStaff,
  };

  let state: "READY" | "LOGIN_REQUIRED" | "EMAIL_MISMATCH" | "EXPIRED" | "UNAVAILABLE" = "UNAVAILABLE";

  if (invite && invite.status === "PENDING" && !isInviteExpired(invite.expiresAt) && !invite.organization.archivedAt) {
    if (!currentUser) {
      state = "LOGIN_REQUIRED";
    } else if (currentUser.email.trim().toLowerCase() !== invite.email) {
      state = "EMAIL_MISMATCH";
    } else {
      state = "READY";
    }
  } else if (invite && (invite.status === "EXPIRED" || isInviteExpired(invite.expiresAt))) {
    state = "EXPIRED";
  }

  return (
    <main className="min-h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="bg-mesh flex min-h-[calc(100vh-2rem)] items-center justify-center rounded-[32px] border border-white/10 px-3 py-6 shadow-[0_28px_120px_rgba(2,6,23,0.45)] sm:rounded-[40px] sm:px-5 sm:py-8 lg:min-h-[calc(100vh-3rem)] lg:px-6 lg:py-10">
        <InviteAcceptance
          locale={validLocale}
          token={token}
          callbackUrl={callbackUrl}
          currentUserEmail={currentUser?.email ?? null}
          inviteEmail={invite?.email ?? "-"}
          organizationName={invite?.organization.name ?? messages.common.appName}
          roleLabel={invite ? roleLabels[invite.role] : messages.members.roleStaff}
          state={state}
          copy={{ common: messages.common, auth: messages.auth, members: messages.members }}
        />
      </div>
    </main>
  );
}
