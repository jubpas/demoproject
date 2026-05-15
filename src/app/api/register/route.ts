import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { isLocale, type Locale } from "@/lib/locales";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Registration rate limiter (in-memory, replace with Redis in production) ---
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();
const REGISTRATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REGISTRATION_RATE_LIMIT_MAX = 5; // 5 registrations per window

function checkRegistrationRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registrationAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    registrationAttempts.set(ip, { count: 1, resetAt: now + REGISTRATION_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= REGISTRATION_RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  registrationAttempts.set(ip, entry);
  return true;
}

type RegisterErrorMessages = {
  required: string;
  invalidEmail: string;
  passwordTooShort: string;
  duplicateEmail: string;
  tooManyRequests: string;
  generic: string;
};

const errorMessages: Record<Locale, RegisterErrorMessages> = {
  th: {
    required: "กรุณากรอกข้อมูลให้ครบ",
    invalidEmail: "รูปแบบอีเมลไมถูกตอง",
    passwordTooShort: "รหัสผานตองมีอยางนอย 8 ตัวอักษร",
    duplicateEmail: "อีเมลนี้ถูกใชงานแลว",
    tooManyRequests: "มีการพยายามสมัครมากเกินไป พยายามใหมอีกครัง",
    generic: "เกดขอผิดพลาด กรุณาลองใหม",
  },
  en: {
    required: "Please fill in all required fields",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters",
    duplicateEmail: "This email is already in use",
    tooManyRequests: "Too many registration attempts. Please try again later.",
    generic: "Something went wrong. Please try again",
  },
};

function getErrorMessages(locale: unknown) {
  return errorMessages[typeof locale === "string" && isLocale(locale) ? locale : ("th" as Locale)];
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let messages = errorMessages.th;

  try {
    const { name, email, password, locale } = await req.json();
    messages = getErrorMessages(locale);

    // Extract IP for rate limiting (next-auth passes this via headers)
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRegistrationRateLimit(typeof ip === "string" ? ip : "unknown")) {
      return errorResponse(messages.tooManyRequests ?? "Too many registration attempts. Please try again later.", 429);
    }

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawPassword = typeof password === "string" ? password : "";

    if (!normalizedName || !normalizedEmail || !rawPassword) {
      return errorResponse(messages.required, 400);
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return errorResponse(messages.invalidEmail, 400);
    }

    // Password policy: minimum 8 characters
    if (rawPassword.length < 8) {
      return errorResponse(messages.passwordTooShort, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse(messages.duplicateEmail, 409);
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12); // Increased salt rounds

    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, redirectTo: `/${locale}/onboarding/organization-choice` }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(messages.duplicateEmail, 409);
    }

    console.error("Registration error:", error);
    return errorResponse(messages.generic, 500);
  }
}
