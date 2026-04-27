import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = { params: Promise<{ orgSlug: string; appointmentId: string }> };

async function createQuotationNumber(organizationId: string) {
  const now = new Date();
  const prefix = `QT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const count = await prisma.quotation.count({
    where: {
      organizationId,
      quotationNumber: {
        startsWith: prefix,
      },
    },
  });

  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, appointmentId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);
    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const appointment = await prisma.surveyAppointment.findFirst({
      where: {
        id: appointmentId,
        organizationId: membership.organizationId,
      },
      include: {
        customer: true,
        project: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const quotationNumber = await createQuotationNumber(membership.organizationId);
    const noteParts = [
      `สร้างจากคิวสำรวจ: ${appointment.title}`,
      `สถานที่: ${appointment.location}`,
      appointment.contactName ? `ผู้ติดต่อ: ${appointment.contactName}` : null,
      appointment.contactPhone ? `เบอร์ติดต่อ: ${appointment.contactPhone}` : null,
      appointment.note ? `หมายเหตุ: ${appointment.note}` : null,
    ].filter(Boolean);

    const quotation = await prisma.quotation.create({
      data: {
        organizationId: membership.organizationId,
        customerId: appointment.customerId,
        projectId: appointment.projectId,
        createdById: userId,
        quotationNumber,
        note: noteParts.join("\n"),
        items: {
          create: [
            {
              description: `เสนอราคาจากนัดสำรวจ: ${appointment.title}`,
              quantity: 1,
              unit: "งาน",
              unitPriceInCents: 0,
              totalInCents: 0,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, quotationId: quotation.id }, { status: 201 });
  } catch (error) {
    console.error("Convert survey appointment to quotation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
