import { NextResponse } from "next/server";
import { QuotationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = { params: Promise<{ orgSlug: string }> };

type BodyItem = { description?: string; quantity?: string; unit?: string; unitPrice?: string };

function parseStatus(value: unknown) {
  return typeof value === "string" && value in QuotationStatus ? (value as QuotationStatus) : QuotationStatus.DRAFT;
}

function mapItems(items: BodyItem[]) {
  return items
    .filter((item) => item.description?.trim())
    .map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = Math.round(quantity * unitPrice * 100);
      return {
        description: item.description!.trim(),
        quantity,
        unit: item.unit?.trim() || null,
        unitPriceInCents: Math.round(unitPrice * 100),
        totalInCents: total,
        sortOrder: index,
      };
    });
}

function computeTotals(items: ReturnType<typeof mapItems>, discount: number, taxEnabled: boolean, taxRate: number) {
  const subtotalInCents = items.reduce((sum, item) => sum + item.totalInCents, 0);
  const discountInCents = Math.max(0, Math.round(discount * 100));
  const taxable = Math.max(0, subtotalInCents - discountInCents);
  const taxInCents = taxEnabled ? Math.round(taxable * (taxRate / 100)) : 0;
  const totalInCents = taxable + taxInCents;
  return { subtotalInCents, discountInCents, taxInCents, totalInCents };
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);
    if (!membership || !canManageOrganizationData(membership.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const quotationNumber = body?.quotationNumber?.trim();
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";
    if (!quotationNumber) return NextResponse.json({ error: "Quotation number is required" }, { status: 400 });
    if (!customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    const items = mapItems(Array.isArray(body?.items) ? body.items : []);
    if (items.length === 0) return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    const totals = computeTotals(items, Number(body?.discount) || 0, Boolean(body?.taxEnabled), Number(body?.taxRate) || 7);
    await prisma.quotation.create({ data: { organizationId: membership.organizationId, customerId, projectId: body?.projectId?.trim() || null, createdById: userId, quotationNumber, status: parseStatus(body?.status), issueDate: body?.issueDate ? new Date(body.issueDate) : new Date(), validUntil: body?.validUntil ? new Date(body.validUntil) : null, taxEnabled: Boolean(body?.taxEnabled), taxRate: Number(body?.taxRate) || 7, note: body?.note?.trim() || null, ...totals, items: { create: items } } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
