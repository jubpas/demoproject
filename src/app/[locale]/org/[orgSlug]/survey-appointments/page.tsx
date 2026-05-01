import prisma from "@/lib/db";
import { SurveyAppointmentManager } from "@/components/org/survey-appointment-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ customerId?: string | string[] }>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SurveyAppointmentsPage({ params, searchParams }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const initialCustomerId = getSingleValue((await searchParams).customerId).trim();

  const [appointments, customers, projects, members] = await Promise.all([
    prisma.surveyAppointment.findMany({ where: { organizationId: organization.id }, include: { customer: { select: { name: true } }, project: { select: { name: true } }, assignedTo: { select: { name: true, email: true } } }, orderBy: { scheduledStart: "desc" } }),
    prisma.customer.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({ where: { organizationId: organization.id }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <SurveyAppointmentManager
      locale={validLocale}
      orgSlug={orgSlug}
      appointments={appointments.map((item) => ({ id: item.id, customerId: item.customerId, customerName: item.customer.name, projectId: item.projectId, projectName: item.project?.name ?? null, assignedToId: item.assignedToId, assignedToName: item.assignedTo?.name || item.assignedTo?.email || null, title: item.title, location: item.location, contactName: item.contactName, contactPhone: item.contactPhone, scheduledStart: item.scheduledStart.toISOString(), scheduledEnd: item.scheduledEnd?.toISOString() ?? null, status: item.status, note: item.note }))}
      customers={customers}
      projects={projects}
      members={members.map((item) => ({ id: item.user.id, name: item.user.name || item.user.email || "User" }))}
      initialCustomerId={customers.some((customer) => customer.id === initialCustomerId) ? initialCustomerId : ""}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, surveyAppointments: messages.surveyAppointments }}
    />
  );
}
