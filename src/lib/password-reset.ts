import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/db";
import type { Locale } from "@/lib/locales";

export const passwordResetLifetimeInMinutes = 30;

type DeliveryResult = {
  resetUrl: string;
  delivered: boolean;
  mode: "mock" | "email" | "unavailable";
};

export function canSendPasswordResetEmails() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function canExposeMockResetUrl() {
  return process.env.NODE_ENV !== "production";
}

function getBaseUrl(fallbackOrigin?: string) {
  return (
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    fallbackOrigin ??
    "http://localhost:3000"
  );
}

export function createPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + passwordResetLifetimeInMinutes * 60 * 1000);
}

export function buildPasswordResetUrl(locale: Locale, token: string, fallbackOrigin?: string) {
  const baseUrl = getBaseUrl(fallbackOrigin);
  return new URL(`/${locale}/reset-password/${token}`, baseUrl).toString();
}

export async function issuePasswordResetToken(userId: string) {
  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);

  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: getPasswordResetExpiryDate(),
    },
  });

  return rawToken;
}

export async function getValidPasswordResetToken(token: string) {
  const tokenHash = hashPasswordResetToken(token);

  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

export function isPasswordResetTokenExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

async function sendViaResend({ to, resetUrl, locale }: { to: string; resetUrl: string; locale: Locale }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return false;
  }

  const subject = locale === "th" ? "ลิงก์รีเซ็ตรหัสผ่าน" : "Reset your password";
  const intro =
    locale === "th"
      ? "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ"
      : "We received a request to reset your account password.";
  const cta = locale === "th" ? "รีเซ็ตรหัสผ่าน" : "Reset password";
  const footer =
    locale === "th"
      ? "หากคุณไม่ได้เป็นผู้ขอ คุณสามารถละเว้นอีเมลนี้ได้"
      : "If you did not request this, you can safely ignore this email.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>${intro}</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;">
              ${cta}
            </a>
          </p>
          <p style="word-break:break-all">${resetUrl}</p>
          <p>${footer}</p>
        </div>
      `,
    }),
  });

  return response.ok;
}

export async function deliverPasswordResetLink({
  email,
  locale,
  token,
  fallbackOrigin,
}: {
  email: string;
  locale: Locale;
  token: string;
  fallbackOrigin?: string;
}): Promise<DeliveryResult> {
  const resetUrl = buildPasswordResetUrl(locale, token, fallbackOrigin);

  if (!canSendPasswordResetEmails()) {
    return {
      resetUrl,
      delivered: false,
      mode: canExposeMockResetUrl() ? "mock" : "unavailable",
    };
  }

  const delivered = await sendViaResend({ to: email, resetUrl, locale });

  return {
    resetUrl,
    delivered,
    mode: delivered ? "email" : canExposeMockResetUrl() ? "mock" : "unavailable",
  };
}
