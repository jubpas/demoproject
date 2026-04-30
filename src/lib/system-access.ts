import type { SystemRole } from "@prisma/client";

function getConfiguredSuperAdminEmails() {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isConfiguredSuperAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getConfiguredSuperAdminEmails().has(email.trim().toLowerCase());
}

export function isSuperAdminAccess(input: {
  email?: string | null;
  systemRole?: SystemRole | null;
}) {
  return input.systemRole === "SUPER_ADMIN" || isConfiguredSuperAdminEmail(input.email);
}
