import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { defaultLocale, isLocale } from "@/lib/locales";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription";
import { isSuperAdminAccess } from "@/lib/system-access";

type Props = {
  params: Promise<{ organizationId: string }>;
};

function parseDateValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDefaultRenewalDate(startedAt: Date, interval: "MONTHLY" | "YEARLY" | "LIFETIME") {
  if (interval === "LIFETIME") {
    return null;
  }

  const date = new Date(startedAt);

  if (interval === "MONTHLY") {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        systemRole: true,
      },
    });

    if (!actor || !isSuperAdminAccess(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ensureDefaultSubscriptionPlans();

    const { organizationId } = await params;
    const formData = await request.formData();
    const locale = isLocale(String(formData.get("locale") ?? ""))
      ? String(formData.get("locale"))
      : defaultLocale;
    const planId = String(formData.get("planId") ?? "").trim();
    const statusInput = String(formData.get("status") ?? "").trim();
    const seatLimitOverrideRaw = String(formData.get("seatLimitOverride") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim() || null;

    if (!planId) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!organization || !plan) {
      return NextResponse.json({ error: "Organization or plan not found" }, { status: 404 });
    }

    const startedAt = parseDateValue(formData.get("startedAt")) ?? new Date();
    const defaultStatus = plan.billingInterval === "LIFETIME" ? "LIFETIME" : "ACTIVE";
    const status = (statusInput || defaultStatus) as
      | "TRIAL"
      | "ACTIVE"
      | "PAST_DUE"
      | "EXPIRED"
      | "CANCELED"
      | "LIFETIME";
    const defaultRenewAt = getDefaultRenewalDate(startedAt, plan.billingInterval);
    const renewAt = parseDateValue(formData.get("renewAt")) ?? defaultRenewAt;
    const expiresAt = parseDateValue(formData.get("expiresAt")) ?? defaultRenewAt;
    const seatLimitOverride = seatLimitOverrideRaw ? Number(seatLimitOverrideRaw) : null;

    if (seatLimitOverride !== null && (!Number.isFinite(seatLimitOverride) || seatLimitOverride < 0)) {
      return NextResponse.json({ error: "Seat limit override must be a positive number" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationSubscription.updateMany({
        where: {
          organizationId,
          status: {
            in: ["TRIAL", "ACTIVE", "PAST_DUE", "LIFETIME"],
          },
        },
        data: {
          status: "CANCELED",
          expiresAt: new Date(),
        },
      });

      const subscription = await tx.organizationSubscription.create({
        data: {
          organizationId,
          planId: plan.id,
          assignedById: actor.id,
          status,
          startedAt,
          renewAt,
          expiresAt,
          seatLimitOverride,
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          organizationSubscriptionId: subscription.id,
          actorId: actor.id,
          type: "ASSIGNED",
          note,
        },
      });
    });

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/organizations`);
    revalidatePath(`/${locale}/admin/organizations/${organizationId}`);

    return NextResponse.redirect(new URL(`/${locale}/admin/organizations/${organizationId}`, request.url), 303);
  } catch (error) {
    console.error("Assign subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
