import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createInviteToken, getInviteExpiryDate, hashInviteToken } from "@/lib/invites";
import {
  canAssignMemberRole,
  canManageOrganizationMembers,
  getOrganizationScopedAccess,
} from "@/lib/organization";
import { assertSeatAvailable } from "@/lib/subscription";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import { normalizeEmail } from "@/lib/system-access";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

const allowedRoles = new Set(["ADMIN", "MANAGER", "STAFF"] as const);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateInviteErrorMessages = {
  unauthorized: string;
  forbidden: string;
  archived: string;
  invalidEmail: string;
  invalidRole: string;
  alreadyMember: string;
  duplicateInvite: string;
  seatLimitReached: string;
  generic: string;
};

const errorMessages: Record<Locale, CreateInviteErrorMessages> = {
  th: {
    unauthorized: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
    forbidden: "คุณไม่มีสิทธิ์จัดการสมาชิกขององค์กรนี้",
    archived: "องค์กรนี้ถูกปิดใช้งานอยู่",
    invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",
    invalidRole: "สิทธิ์สมาชิกไม่ถูกต้อง",
    alreadyMember: "ผู้ใช้นี้เป็นสมาชิกขององค์กรอยู่แล้ว",
    duplicateInvite: "มีคำเชิญที่ยังใช้งานอยู่สำหรับอีเมลนี้แล้ว",
    seatLimitReached: "จำนวนที่นั่งขององค์กรนี้เต็มแล้ว",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่",
  },
  en: {
    unauthorized: "Please sign in before continuing",
    forbidden: "You are not allowed to manage members in this organization",
    archived: "This organization is archived",
    invalidEmail: "Please enter a valid email address",
    invalidRole: "Invalid member role",
    alreadyMember: "This user is already a member",
    duplicateInvite: "A pending invite already exists for this email",
    seatLimitReached: "Seat limit reached for this organization",
    generic: "Something went wrong. Please try again",
  },
};

export async function POST(request: Request, { params }: Props) {
  let locale = defaultLocale;

  try {
    const body = await request.json();
    locale = typeof body?.locale === "string" && isLocale(body.locale) ? body.locale : defaultLocale;
    const messages = errorMessages[locale];
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
    }

    const { orgSlug } = await params;
    const access = await getOrganizationScopedAccess(userId, orgSlug);

    if (!access || (!access.isSuperAdmin && !canManageOrganizationMembers(access.role))) {
      return NextResponse.json({ error: messages.forbidden }, { status: 403 });
    }

    if (access.organization.archivedAt && !access.isSuperAdmin) {
      return NextResponse.json({ error: messages.archived }, { status: 403 });
    }

    const email = normalizeEmail(body?.email);
    const role = body?.role;

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: messages.invalidEmail }, { status: 400 });
    }

    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: messages.invalidRole }, { status: 400 });
    }

    if (!access.isSuperAdmin && !canAssignMemberRole(access.role, role)) {
      return NextResponse.json({ error: messages.forbidden }, { status: 403 });
    }

    const [existingMembership, existingInvite] = await Promise.all([
      prisma.membership.findFirst({
        where: {
          organizationId: access.organization.id,
          user: { email },
        },
      }),
      prisma.organizationInvite.findFirst({
        where: {
          organizationId: access.organization.id,
          email,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (existingMembership) {
      return NextResponse.json({ error: messages.alreadyMember }, { status: 409 });
    }

    if (existingInvite) {
      return NextResponse.json({ error: messages.duplicateInvite }, { status: 409 });
    }

    await assertSeatAvailable(access.organization.id);

    const token = createInviteToken();
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: access.organization.id,
        email,
        role,
        tokenHash: hashInviteToken(token),
        invitedById: userId,
        expiresAt: getInviteExpiryDate(),
      },
    });

    return NextResponse.json(
      {
        invite,
        inviteUrl: `/${locale}/invite/${token}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SEAT_LIMIT_REACHED") {
      return NextResponse.json({ error: errorMessages[locale].seatLimitReached }, { status: 409 });
    }

    console.error("Create invite error:", error);
    return NextResponse.json({ error: errorMessages[locale].generic }, { status: 500 });
  }
}
