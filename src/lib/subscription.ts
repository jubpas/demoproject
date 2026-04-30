import "server-only";

import prisma from "@/lib/db";

const defaultPlans = [
  {
    code: "monthly",
    name: "Monthly",
    description: "Manual monthly subscription",
    billingInterval: "MONTHLY" as const,
    priceInCents: 0,
    seatLimit: 5,
  },
  {
    code: "yearly",
    name: "Yearly",
    description: "Manual yearly subscription",
    billingInterval: "YEARLY" as const,
    priceInCents: 0,
    seatLimit: 5,
  },
  {
    code: "lifetime",
    name: "Lifetime",
    description: "Manual lifetime subscription",
    billingInterval: "LIFETIME" as const,
    priceInCents: 0,
    seatLimit: 5,
  },
];

export async function ensureDefaultSubscriptionPlans() {
  await Promise.all(
    defaultPlans.map((plan) =>
      prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          description: plan.description,
          billingInterval: plan.billingInterval,
          seatLimit: plan.seatLimit,
          isActive: true,
        },
        create: plan,
      }),
    ),
  );

  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ billingInterval: "asc" }, { name: "asc" }],
  });
}

export async function getCurrentOrganizationSubscription(organizationId: string) {
  return prisma.organizationSubscription.findFirst({
    where: {
      organizationId,
      status: {
        in: ["TRIAL", "ACTIVE", "PAST_DUE", "LIFETIME"],
      },
    },
    include: {
      plan: true,
    },
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function getSeatLimit(
  subscription:
    | ({
        seatLimitOverride: number | null;
        plan: { seatLimit: number | null };
      })
    | null,
) {
  if (!subscription) {
    return null;
  }

  return subscription.seatLimitOverride ?? subscription.plan.seatLimit ?? null;
}

export async function getOrganizationSeatSummary(organizationId: string) {
  const now = new Date();
  const [subscription, membershipCount, pendingInviteCount] = await Promise.all([
    getCurrentOrganizationSubscription(organizationId),
    prisma.membership.count({ where: { organizationId } }),
    prisma.organizationInvite.count({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
    }),
  ]);

  const seatLimit = getSeatLimit(subscription);
  const usedSeats = membershipCount + pendingInviteCount;

  return {
    subscription,
    membershipCount,
    pendingInviteCount,
    usedSeats,
    seatLimit,
    remainingSeats: seatLimit === null ? null : Math.max(seatLimit - usedSeats, 0),
    isOverLimit: seatLimit !== null && usedSeats > seatLimit,
  };
}

export async function assertSeatAvailable(organizationId: string, extraSeats = 1) {
  const summary = await getOrganizationSeatSummary(organizationId);

  if (summary.seatLimit !== null && summary.usedSeats + extraSeats > summary.seatLimit) {
    throw new Error("SEAT_LIMIT_REACHED");
  }

  return summary;
}
