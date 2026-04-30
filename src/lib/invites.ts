import "server-only";

import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/db";

export const inviteLifetimeInDays = 7;

export function createInviteToken() {
  return randomBytes(24).toString("hex");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getInviteExpiryDate() {
  return new Date(Date.now() + inviteLifetimeInDays * 24 * 60 * 60 * 1000);
}

export async function getInviteByToken(token: string) {
  return prisma.organizationInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: {
      organization: true,
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      acceptedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export function isInviteExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}
