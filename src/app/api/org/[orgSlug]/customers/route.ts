import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = typeof searchParams.get("search") === "string" ? searchParams.get("search")! : null;
    const sortBy = (typeof searchParams.get("sortBy") === "string" ? searchParams.get("sortBy")! : "name") as
      | "name"
      | "createdAt"
      | "updatedAt";
    const order = (typeof searchParams.get("order") === "string" ? searchParams.get("order")! : "asc") as "asc" | "desc";

    const where: { organizationId: string; name?: { contains: string }; companyName?: { contains: string }; email?: { contains: string }; phone?: { contains: string } } = {
      organizationId: membership.organizationId,
    };

    if (search) {
      where.name = { contains: search };
      where.companyName = { contains: search };
      where.email = { contains: search };
      where.phone = { contains: search };
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        projects: { select: { id: true, name: true } },
        quotations: { select: { id: true, quotationNumber: true, status: true } },
        _count: { select: { projects: true, quotations: true, surveyAppointments: true } },
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("List customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: membership.organizationId,
        name,
        companyName: body?.companyName?.trim() || null,
        phone: body?.phone?.trim() || null,
        email: body?.email?.trim().toLowerCase() || null,
        address: body?.address?.trim() || null,
        note: body?.note?.trim() || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
