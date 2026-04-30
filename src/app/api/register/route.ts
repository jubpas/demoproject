import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { isLocale, type Locale } from "@/lib/locales";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type RegisterErrorMessages = {
  required: string;
  invalidEmail: string;
  passwordTooShort: string;
  duplicateEmail: string;
  generic: string;
};

const errorMessages: Record<Locale, RegisterErrorMessages> = {
  th: {
    required: "กรุณากรอกข้อมูลให้ครบ",
    invalidEmail: "รูปแบบอีเมลไม่ถูกต้อง",
    passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    duplicateEmail: "อีเมลนี้ถูกใช้งานแล้ว",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่",
  },
  en: {
    required: "Please fill in all required fields",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 6 characters",
    duplicateEmail: "This email is already in use",
    generic: "Something went wrong. Please try again",
  },
};

function getErrorMessages(locale: unknown) {
  return errorMessages[typeof locale === "string" && isLocale(locale) ? locale : ("th" satisfies Locale)];
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let messages = errorMessages.th;

  try {
    const { name, email, password, locale } = await req.json();
    messages = getErrorMessages(locale);
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawPassword = typeof password === "string" ? password : "";

    if (!normalizedName || !normalizedEmail || !rawPassword) {
      return errorResponse(messages.required, 400);
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return errorResponse(messages.invalidEmail, 400);
    }

    if (rawPassword.length < 6) {
      return errorResponse(messages.passwordTooShort, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse(messages.duplicateEmail, 409);
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(messages.duplicateEmail, 409);
    }

    console.error("Registration error:", error);
    return errorResponse(messages.generic, 500);
  }
}
