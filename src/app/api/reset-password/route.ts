import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import {
  getValidPasswordResetToken,
  isPasswordResetTokenExpired,
} from "@/lib/password-reset";

type ResetPasswordMessages = {
  required: string;
  passwordTooShort: string;
  invalid: string;
  expired: string;
  success: string;
  generic: string;
};

const messagesByLocale: Record<Locale, ResetPasswordMessages> = {
  th: {
    required: "กรุณากรอกข้อมูลให้ครบ",
    passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    invalid: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือไม่สามารถใช้งานได้แล้ว",
    expired: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอใหม่อีกครั้ง",
    success: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    generic: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  en: {
    required: "Please fill in all required fields",
    passwordTooShort: "Password must be at least 6 characters",
    invalid: "This reset password link is invalid or no longer available.",
    expired: "This reset password link has expired. Please request a new one.",
    success: "Your password has been updated. Please sign in again.",
    generic: "Something went wrong. Please try again.",
  },
};

export async function POST(request: Request) {
  let locale = defaultLocale;

  try {
    const body = await request.json();
    locale = isLocale(body?.locale) ? body.locale : defaultLocale;
    const messages = messagesByLocale[locale];
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ error: messages.required }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: messages.passwordTooShort }, { status: 400 });
    }

    const resetToken = await getValidPasswordResetToken(token);

    if (!resetToken || resetToken.usedAt) {
      return NextResponse.json({ error: messages.invalid }, { status: 400 });
    }

    if (isPasswordResetTokenExpired(resetToken.expiresAt)) {
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      return NextResponse.json({ error: messages.expired }, { status: 410 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, message: messages.success }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: messagesByLocale[locale].generic }, { status: 500 });
  }
}
