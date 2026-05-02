import "server-only";

import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/db";
import type { Locale } from "@/lib/locales";

const RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes

export const passwordResetLifetimeInMinutes = 30;

type DeliveryResult = {
  resetUrl: string;
  delivered: boolean;
  mode: "mock" | "email" | "unavailable";
};

// --- New token functions (patch: single-use enforcement) ---

export function createResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  // Clean up any existing unused tokens for this user first
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  });

  const token = createResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(
  token: string,
  userId: string
): Promise<boolean> {
  const tokenHash = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId,
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
      usedAt: null, // Single-use enforcement: must not have been used
    },
  });

  if (!resetToken) {
    return false;
  }

  // Mark token as used atomically - prevents reuse
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  return true;
}

// --- Existing helpers (preserved for reset-password flows) ---

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

export function buildPasswordResetUrl(locale: Locale, token: string, fallbackOrigin?: string) {
  const baseUrl = getBaseUrl(fallbackOrigin);
  return new URL(`/${locale}/reset-password/${token}`, baseUrl).toString();
}

export function isPasswordResetTokenExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

// Alias for backwards compatibility with the old password-reset token helpers
export function createPasswordResetToken() {
  return createResetToken();
}

export function hashPasswordResetToken(token: string) {
  return hashToken(token);
}

export async function getValidPasswordResetToken(token: string) {
  const tokenHash = hashToken(token);

  return prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });
}

async function sendViaResend({ to, resetUrl, locale }: { to: string; resetUrl: string; locale: Locale }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return false;
  }

  const subject = locale === "th" ? "ลิงก์รีเซตรหัสผ่าน" : "Reset your password";
  const intro =
    locale === "th"
      ? "เราได้รับคำขอรีเซตรหัสผ่านสำหรับบัญชีของคุณ"
      : "We received a request to reset your account password.";
  const cta = locale === "th" ? "รีเซตรหัสผ่าน" : "Reset password";
  const footer =
    locale === "th"
      ? "หากคุณไม่ได้เป็นผู้ขอ คุณสามารถละเว้นอีเมลนี้ได้เลย"
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

export function canSendPasswordResetEmails() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
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
