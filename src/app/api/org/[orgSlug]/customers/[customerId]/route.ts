import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; customerId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, customerId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name,
        companyName: body?.companyName?.trim() || null,
        phone: body?.phone?.trim() || null,
        email: body?.email?.trim().toLowerCase() || null,
        address: body?.address?.trim() || null,
        note: body?.note?.trim() || null,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, customerId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: existingCustomer.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
