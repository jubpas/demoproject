import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { DataPanel } from "@/components/dashboard/data-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; customerId: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { locale, orgSlug, customerId } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: organization.id },
    include: {
      _count: {
        select: {
          projects: true,
          quotations: true,
          surveyAppointments: true,
        },
      },
      projects: { orderBy: { updatedAt: "desc" }, take: 6 },
      quotations: { orderBy: { updatedAt: "desc" }, take: 6 },
      surveyAppointments: { orderBy: { scheduledStart: "desc" }, take: 6 },
    },
  });

  if (!customer) {
    notFound();
  }

  const quotationStatusMap = {
    ACCEPTED: { label: messages.quotations.accepted, tone: "green" as const },
    DRAFT: { label: messages.quotations.draft, tone: "slate" as const },
    EXPIRED: { label: messages.quotations.expired, tone: "amber" as const },
    REJECTED: { label: messages.quotations.rejected, tone: "red" as const },
    SENT: { label: messages.quotations.sent, tone: "blue" as const },
  };
  const appointmentStatusMap = {
    CANCELLED: { label: messages.surveyAppointments.cancelled, tone: "red" as const },
    COMPLETED: { label: messages.surveyAppointments.completed, tone: "green" as const },
    CONFIRMED: { label: messages.surveyAppointments.confirmed, tone: "blue" as const },
    PENDING: { label: messages.surveyAppointments.pending, tone: "slate" as const },
    RESCHEDULED: { label: messages.surveyAppointments.rescheduled, tone: "amber" as const },
  };
  const projectStatusMap = {
    ACTIVE: { label: messages.projects.active, tone: "blue" as const },
    CANCELLED: { label: messages.projects.cancelled, tone: "red" as const },
    COMPLETED: { label: messages.projects.completed, tone: "green" as const },
    ON_HOLD: { label: messages.projects.onHold, tone: "amber" as const },
    PLANNING: { label: messages.projects.planning, tone: "slate" as const },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={customer.companyName || organization.slug}
        title={customer.name}
        description={messages.customers.detailSubtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/${validLocale}/org/${orgSlug}/survey-appointments?customerId=${customer.id}`} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">{messages.customers.createSurveyAction}</Link>
            <Link href={`/${validLocale}/org/${orgSlug}/quotations?customerId=${customer.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{messages.customers.createQuotationAction}</Link>
            <Link href={`/${validLocale}/org/${orgSlug}/customers`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{messages.customers.title}</Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label={messages.projects.title} value={String(customer._count.projects)} tone="blue" />
        <MetricCard label={messages.quotations.title} value={String(customer._count.quotations)} tone="green" />
        <MetricCard label={messages.surveyAppointments.title} value={String(customer._count.surveyAppointments)} tone="slate" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <DataPanel title={messages.customers.contactSummaryTitle}>
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-medium text-slate-950">{messages.customers.companyName}:</span> {customer.companyName || messages.common.noData}</p>
            <p><span className="font-medium text-slate-950">{messages.customers.phone}:</span> {customer.phone || messages.common.noData}</p>
            <p><span className="font-medium text-slate-950">{messages.customers.email}:</span> {customer.email || messages.common.noData}</p>
            <p><span className="font-medium text-slate-950">{messages.customers.address}:</span> {customer.address || messages.common.noData}</p>
            <p><span className="font-medium text-slate-950">{messages.customers.note}:</span> {customer.note || messages.common.noData}</p>
          </div>
        </DataPanel>

        <DataPanel title={messages.customers.flowSummaryTitle} description={messages.customers.flowSummaryDescription}>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href={`/${validLocale}/org/${orgSlug}/survey-appointments?customerId=${customer.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">{messages.customers.createSurveyAction}</Link>
            <Link href={`/${validLocale}/org/${orgSlug}/quotations?customerId=${customer.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">{messages.customers.createQuotationAction}</Link>
            <Link href={`/${validLocale}/org/${orgSlug}/projects`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">{messages.customers.openProjectsAction}</Link>
          </div>
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DataPanel title={messages.customers.relatedSurveysTitle}>
          <div className="space-y-3">
            {customer.surveyAppointments.length === 0 ? <p className="text-sm text-slate-500">{messages.customers.noRelatedSurveys}</p> : customer.surveyAppointments.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium text-slate-950">{item.title}</p><StatusBadge label={appointmentStatusMap[item.status].label} tone={appointmentStatusMap[item.status].tone} /></div><p className="mt-2 text-xs text-slate-500">{item.scheduledStart.toISOString().slice(0, 16).replace("T", " ")}</p></div>)}
          </div>
        </DataPanel>

        <DataPanel title={messages.customers.relatedQuotationsTitle}>
          <div className="space-y-3">
            {customer.quotations.length === 0 ? <p className="text-sm text-slate-500">{messages.customers.noRelatedQuotations}</p> : customer.quotations.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium text-slate-950">{item.quotationNumber}</p><StatusBadge label={quotationStatusMap[item.status].label} tone={quotationStatusMap[item.status].tone} /></div><Link href={`/${validLocale}/org/${orgSlug}/quotations/${item.id}`} className="mt-3 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">{messages.common.view}</Link></div>)}
          </div>
        </DataPanel>

        <DataPanel title={messages.customers.relatedProjectsTitle}>
          <div className="space-y-3">
            {customer.projects.length === 0 ? <p className="text-sm text-slate-500">{messages.customers.noRelatedProjects}</p> : customer.projects.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium text-slate-950">{item.name}</p><StatusBadge label={projectStatusMap[item.status].label} tone={projectStatusMap[item.status].tone} /></div><Link href={`/${validLocale}/org/${orgSlug}/projects/${item.id}`} className="mt-3 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">{messages.common.view}</Link></div>)}
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
