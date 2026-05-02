import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import {
  deliverPasswordResetLink,
  issuePasswordResetToken,
} from "@/lib/password-reset";
import { normalizeEmail } from "@/lib/system-access";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ForgotPasswordMessages = {
  invalidEmail: string;
  success: string;
  tooManyRequests: string;
  generic: string;
};

const messagesByLocale: Record<Locale, ForgotPasswordMessages> = {
  th: {
    invalidEmail: "กรุณากรอกอีเมลให�ถูกต้อง",
    success: "หากอีเมลน�มีอย�ในระบบ เราจะส่งลิงก์รีเซตรหัสผ่านให้",
    tooManyRequests: "คุณส่งคำขอมากเกิน ไปกรุณารอสักครู่แล้วลองใหม่",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  en: {
    invalidEmail: "Please enter a valid email address",
    success: "If this email exists in our system, we will send a password reset link.",
    tooManyRequests: "Too many requests. Please wait a moment and try again.",
    generic: "Something went wrong. Please try again.",
  },
};

/**
 * Database-backed rate limiter for password reset requests.
 * Uses PasswordResetToken table to track recent submissions per email.
 * Limits to 3 requests per 5-minute window per email address.
 */
async function checkEmailRateLimit(email: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  const recentTokens = await prisma.passwordResetToken.findMany({
    where: {
      createdAt: { gte: cutoff },
    },
    select: { userId: true },
  });

  // Count how many tokens were created for this email in the window
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    // Email not found - still rate limit to prevent enumeration
    return true; // Allow through, will be caught by "no user" check below
  }

  const count = recentTokens.filter((t) => t.userId === user.id).length;
  return count < 3;
}

export async function POST(request: Request) {
  let locale = defaultLocale;

  try {
    const body = await request.json();
    locale = isLocale(body?.locale) ? body.locale : defaultLocale;
    const messages = messagesByLocale[locale];
    const email = normalizeEmail(body?.email);

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: messages.invalidEmail }, { status: 400 });
    }

    // Database-backed rate limit check
    if (!(await checkEmailRateLimit(email))) {
      return NextResponse.json({ error: messages.tooManyRequests }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user?.password) {
      return NextResponse.json({ message: messages.success }, { status: 200 });
    }

    const token = await issuePasswordResetToken(user.id);
    const delivery = await deliverPasswordResetLink({
      email: user.email,
      locale,
      token,
      fallbackOrigin: new URL(request.url).origin,
    });

    if (delivery.mode === "unavailable") {
      console.warn("Password reset email delivery unavailable in production; reset URL was not exposed.");
    }

    return NextResponse.json(
      {
        message: messages.success,
        ...(delivery.mode === "mock" ? { resetUrl: delivery.resetUrl } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: messagesByLocale[locale].generic }, { status: 500 });
  }
}
