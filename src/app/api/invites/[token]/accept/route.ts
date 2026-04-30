import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getInviteByToken, isInviteExpired } from "@/lib/invites";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import { normalizeEmail } from "@/lib/system-access";

type Props = {
  params: Promise<{ token: string }>;
};

type InviteErrorMessages = {
  unauthorized: string;
  notFound: string;
  unavailable: string;
  expired: string;
  archived: string;
  emailMismatch: string;
  generic: string;
};

const errorMessages: Record<Locale, InviteErrorMessages> = {
  th: {
    unauthorized: "กรุณาเข้าสู่ระบบก่อนตอบรับคำเชิญ",
    notFound: "ไม่พบคำเชิญนี้",
    unavailable: "ลิงก์เชิญนี้ไม่สามารถใช้งานได้แล้ว",
    expired: "ลิงก์เชิญนี้หมดอายุแล้ว",
    archived: "องค์กรนี้ถูกปิดใช้งานอยู่",
    emailMismatch: "กรุณาเข้าสู่ระบบด้วยอีเมลที่ได้รับเชิญก่อนตอบรับคำเชิญนี้",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่",
  },
  en: {
    unauthorized: "Please sign in before accepting this invite",
    notFound: "Invite not found",
    unavailable: "This invite is no longer available",
    expired: "This invite has expired",
    archived: "This organization is archived",
    emailMismatch: "Please sign in with the invited email address before accepting this invite",
    generic: "Something went wrong. Please try again",
  },
};

export async function POST(request: Request, { params }: Props) {
  let locale = defaultLocale;

  try {
    const body = await request.json().catch(() => ({}));
    locale = typeof body?.locale === "string" && isLocale(body.locale) ? body.locale : defaultLocale;
    const messages = errorMessages[locale];
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!actor) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
    }

    const { token } = await params;
    const invite = await getInviteByToken(token);

    if (!invite) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: messages.unavailable }, { status: 400 });
    }

    if (isInviteExpired(invite.expiresAt)) {
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: {
          status: "EXPIRED",
        },
      });

      return NextResponse.json({ error: messages.expired }, { status: 410 });
    }

    if (invite.organization.archivedAt) {
      return NextResponse.json({ error: messages.archived }, { status: 403 });
    }

    if (normalizeEmail(actor.email) !== invite.email) {
      return NextResponse.json({ error: messages.emailMismatch }, { status: 403 });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: invite.organizationId,
        userId: actor.id,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (!existingMembership) {
        await tx.membership.create({
          data: {
            organizationId: invite.organizationId,
            userId: actor.id,
            role: invite.role,
          },
        });
      }

      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedById: actor.id,
        },
      });

      await tx.userPreference.upsert({
        where: { userId: actor.id },
        update: {
          lastOrganizationId: invite.organizationId,
          locale,
        },
        create: {
          userId: actor.id,
          lastOrganizationId: invite.organizationId,
          locale,
        },
      });
    });

    return NextResponse.json({
      success: true,
      redirectTo: `/${locale}/org/${invite.organization.slug}/dashboard`,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: errorMessages[locale].generic }, { status: 500 });
  }
}
