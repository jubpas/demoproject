import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConvertQuotationButton } from "@/components/org/convert-quotation-button";
import { PrintQuotationButton } from "@/components/org/print-quotation-button";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; quotationId: string }>;
};

export default async function QuotationPreviewPage({ params }: Props) {
  const { locale, orgSlug, quotationId } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const quotation = await prisma.quotation.findFirst({
    where: {
      id: quotationId,
      organizationId: organization.id,
    },
    include: {
      customer: true,
      project: true,
      surveyAppointment: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  const formatter = new Intl.NumberFormat(validLocale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const statusMap = {
    ACCEPTED: { label: messages.quotations.accepted, tone: "green" as const },
    DRAFT: { label: messages.quotations.draft, tone: "slate" as const },
    EXPIRED: { label: messages.quotations.expired, tone: "amber" as const },
    REJECTED: { label: messages.quotations.rejected, tone: "red" as const },
    SENT: { label: messages.quotations.sent, tone: "blue" as const },
  };

  const status = statusMap[quotation.status];

  return (
    <div className="space-y-6">
      {quotation.projectId || quotation.customerId || quotation.surveyAppointmentId ? (
        <div className="print:hidden flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {quotation.customerId ? (
            <Link href={`/${validLocale}/org/${orgSlug}/customers/${quotation.customerId}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {quotation.customer.name}
            </Link>
          ) : null}
          {quotation.surveyAppointment ? (
            <Link href={`/${validLocale}/org/${orgSlug}/survey-appointments/${quotation.surveyAppointment.id}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              {quotation.surveyAppointment.title}
            </Link>
          ) : null}
          {quotation.projectId && quotation.project ? (
            <Link href={`/${validLocale}/org/${orgSlug}/projects/${quotation.project.id}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M5.5 12.5a1 1 0 0 1 1 1v1.5l1.25-1.88a1 1 0 0 0-1.53-1.23Z"/><path d="M3.56 8.56a1.99 1.99 0 0 1-.9-1.66V6a1 1 0 0 1 1-1h.93a1 1 0 0 1 1.66.9l-1.7 2.68a.22.22 0 0 0 .34.26l2.68-1.7A1 1 0 0 1 15.1 8.1v.93a1.99 1.99 0 0 1-.9 1.66l-5.64 3.76a3 3 0 0 1-4.44-.44l-1.88-2.52a1 1 0 0 1 .07-1.35 3 3 0 0 1 3.25-.7Z"/><path d="M10 10h8"/><path d="M14 6h2"/><path d="M6 14h2"/></svg>
              {quotation.project.name}
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className="print:hidden flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{messages.quotations.previewTitle}</p>
          <h1 className="text-2xl font-semibold text-slate-950">{quotation.quotationNumber}</h1>
          <p className="max-w-2xl text-sm text-slate-500">{messages.quotations.previewSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!quotation.projectId ? (
            <ConvertQuotationButton
              locale={validLocale}
              orgSlug={orgSlug}
              quotationId={quotation.id}
              label={messages.quotations.convertToProject}
              loadingLabel={messages.quotations.convertingToProject}
            />
          ) : null}
          <PrintQuotationButton label={messages.common.print} />
        </div>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none sm:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{messages.common.appName}</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">{organization.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{organization.description || quotation.customer.address || quotation.customer.email || quotation.customer.phone || "-"}</p>
          </div>

          <div className="space-y-3 text-sm text-slate-600 sm:text-right">
            <div>
              <p className="font-medium text-slate-950">{messages.quotations.quotationNumber}</p>
              <p>{quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="font-medium text-slate-950">{messages.quotations.issueDate}</p>
              <p>{quotation.issueDate.toISOString().slice(0, 10)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-950">{messages.quotations.validUntil}</p>
              <p>{quotation.validUntil ? quotation.validUntil.toISOString().slice(0, 10) : messages.common.noData}</p>
            </div>
            <div className="print:hidden">
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">{messages.quotations.customer}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{quotation.customer.name}</p>
            <p className="mt-1 text-sm text-slate-600">{quotation.customer.companyName || quotation.customer.email || quotation.customer.phone || messages.common.noData}</p>
            <p className="mt-1 text-sm text-slate-600">{quotation.customer.address || messages.common.noData}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">{messages.quotations.project}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{quotation.project?.name || messages.quotations.noProject}</p>
            <p className="mt-1 text-sm text-slate-600">{quotation.note || messages.common.noData}</p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="rounded-l-2xl px-4 py-3 font-medium">{messages.quotations.itemDescription}</th>
                <th className="px-4 py-3 font-medium">{messages.quotations.quantity}</th>
                <th className="px-4 py-3 font-medium">{messages.quotations.unit}</th>
                <th className="px-4 py-3 font-medium">{messages.quotations.unitPrice}</th>
                <th className="rounded-r-2xl px-4 py-3 text-right font-medium">{messages.quotations.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-4 py-4 font-medium text-slate-950">{item.description}</td>
                  <td className="px-4 py-4">{item.quantity}</td>
                  <td className="px-4 py-4">{item.unit || messages.common.noData}</td>
                  <td className="px-4 py-4">{formatter.format(item.unitPriceInCents / 100)}</td>
                  <td className="px-4 py-4 text-right">{formatter.format(item.totalInCents / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 ml-auto w-full max-w-md space-y-3 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{messages.quotations.subtotal}</span>
            <span>{formatter.format(quotation.subtotalInCents / 100)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{messages.quotations.discount}</span>
            <span>{formatter.format(quotation.discountInCents / 100)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{messages.quotations.taxAmount}{quotation.taxEnabled ? ` (${quotation.taxRate}%)` : ""}</span>
            <span>{formatter.format(quotation.taxInCents / 100)}</span>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex items-center justify-between text-base font-semibold text-slate-950">
            <span>{messages.quotations.total}</span>
            <span>{formatter.format(quotation.totalInCents / 100)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
