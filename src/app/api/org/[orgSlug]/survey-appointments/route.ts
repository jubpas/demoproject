import { NextResponse } from "next/server";
import { SurveyAppointmentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { canManageOrganizationData, getMembershipByOrgSlug } from "@/lib/organization";

type Props = { params: Promise<{ orgSlug: string }> };

function parseStatus(value: unknown) {
  return typeof value === "string" && value in SurveyAppointmentStatus ? (value as SurveyAppointmentStatus) : SurveyAppointmentStatus.PENDING;
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
    const title = body?.title?.trim();
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";
    const location = body?.location?.trim();
    const scheduledStart = typeof body?.scheduledStart === "string" ? body.scheduledStart : "";
    if (!title) return NextResponse.json({ error: "Appointment title is required" }, { status: 400 });
    if (!customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    if (!location) return NextResponse.json({ error: "Location is required" }, { status: 400 });
    if (!scheduledStart) return NextResponse.json({ error: "Start time is required" }, { status: 400 });
    await prisma.surveyAppointment.create({ data: { organizationId: membership.organizationId, customerId, projectId: body?.projectId?.trim() || null, assignedToId: body?.assignedToId?.trim() || null, createdById: userId, title, location, contactName: body?.contactName?.trim() || null, contactPhone: body?.contactPhone?.trim() || null, scheduledStart: new Date(scheduledStart), scheduledEnd: body?.scheduledEnd ? new Date(body.scheduledEnd) : null, status: parseStatus(body?.status), note: body?.note?.trim() || null } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create survey appointment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
