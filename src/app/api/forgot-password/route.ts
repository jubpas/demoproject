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
    invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",
    success: "หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้",
    tooManyRequests: "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  en: {
    invalidEmail: "Please enter a valid email address",
    success: "If this email exists in our system, we will send a password reset link.",
    tooManyRequests: "Too many requests. Please wait a moment and try again.",
    generic: "Something went wrong. Please try again.",
  },
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitWindowMs = 5 * 60 * 1000;
const rateLimitMaxRequests = 3;

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return true;
  }

  if (now > entry.resetAt) {
    rateLimitStore.delete(key);
    return true;
  }

  if (entry.count >= rateLimitMaxRequests) {
    return false;
  }

  return true;
}

function recordRateLimit(key: string): void {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

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

    if (!checkRateLimit(email)) {
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
      recordRateLimit(email);
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

    recordRateLimit(email);

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
