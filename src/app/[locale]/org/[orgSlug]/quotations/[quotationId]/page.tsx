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
    <div className="space-y-3">
      {/* Screen-only navigation breadcrumbs */}
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

      {/* Screen-only action bar */}
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

      {/* Print-ready quotation document - single page A4 */}
      <article className="print-document rounded-3xl border border-slate-200 bg-white p-3 shadow-sm print:rounded-none print:border-0 print:shadow-none sm:p-4">
        {/* Document header - organization info */}
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-1.5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">{messages.common.appName}</p>
            <h2 className="mt-0.5 text-base font-bold text-slate-950">{organization.name}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {organization.description || quotation.customer.address || quotation.customer.email || quotation.customer.phone || "-"}
            </p>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600 sm:text-right">
            <div>
              <p className="font-semibold text-slate-950">{messages.quotations.quotationNumber}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{messages.quotations.issueDate}</p>
              <p className="mt-0.5">{quotation.issueDate.toISOString().slice(0, 10)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{messages.quotations.validUntil}</p>
              <p className="mt-0.5">
                {quotation.validUntil
                  ? quotation.validUntil.toISOString().slice(0, 10)
                  : messages.common.noData}
              </p>
            </div>
            <div className="print:hidden">
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
            <div className="print:block hidden">
              <p className="text-[10px] text-slate-600 font-medium mt-1 uppercase tracking-wider">
                {status.label}
              </p>
            </div>
          </div>
        </div>

        {/* Customer and Project info - side by side columns */}
        <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-2 bg-slate-50">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{messages.quotations.customer}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-950">{quotation.customer.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {quotation.customer.companyName || quotation.customer.email || quotation.customer.phone || messages.common.noData}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {quotation.customer.address || messages.common.noData}
              </p>
            </div>
            <div className="p-2 bg-slate-50">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{messages.quotations.project}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-950">
                {quotation.project?.name || messages.quotations.noProject}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {quotation.note || messages.common.noData}
              </p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-[10px] print:border-collapse print:border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-600 print:bg-slate-100">
                <th className="rounded-l-lg px-2 py-1.5 font-semibold text-[9px] uppercase tracking-wider">{messages.quotations.itemDescription}</th>
                <th className="px-2 py-1.5 font-semibold text-[9px] uppercase tracking-wider text-center">{messages.quotations.quantity}</th>
                <th className="px-2 py-1.5 font-semibold text-[9px] uppercase tracking-wider text-center">{messages.quotations.unit}</th>
                <th className="px-2 py-1.5 font-semibold text-[9px] uppercase tracking-wider text-right">{messages.quotations.unitPrice}</th>
                <th className="rounded-r-lg px-2 py-1.5 font-semibold text-[9px] uppercase tracking-wider text-right">{messages.quotations.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 text-slate-700 print:border-slate-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/50 print:bg-slate-50"
                  }`}
                >
                  <td className="px-2 py-1.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="px-2 py-1.5 text-center">{item.quantity}</td>
                  <td className="px-2 py-1.5 text-center">{item.unit || messages.common.noData}</td>
                  <td className="px-2 py-1.5 text-right">{formatter.format(item.unitPriceInCents / 100)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{formatter.format(item.totalInCents / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-3 ml-auto w-full max-w-md space-y-1.5 rounded-lg bg-slate-50 p-3 border border-slate-100 print:rounded-none print:border print:border-slate-300">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-medium">{messages.quotations.subtotal}</span>
            <span className="font-medium">{formatter.format(quotation.subtotalInCents / 100)}</span>
          </div>
          {quotation.discountInCents > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">{messages.quotations.discount}</span>
              <span className="font-medium text-red-600">- {formatter.format(quotation.discountInCents / 100)}</span>
            </div>
          )}
          {quotation.taxEnabled && (
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">
                {messages.quotations.taxAmount} ({quotation.taxRate}%)
              </span>
              <span className="font-medium">{formatter.format(quotation.taxInCents / 100)}</span>
            </div>
          )}
          <div className="h-px bg-slate-200" />
          <div className="flex items-center justify-between text-sm font-bold text-slate-950 pt-0.5">
            <span className="uppercase tracking-wider">{messages.quotations.total}</span>
            <span className="text-blue-600">{formatter.format(quotation.totalInCents / 100)} ฿</span>
          </div>
        </div>

        {/* Signature area - print only, no page break */}
        <div className="mt-4 border-t-2 border-slate-300 pt-3 print:block hidden">
          <p className="text-center text-[9px] font-bold text-slate-800 uppercase tracking-wider mb-2">
            ลงชื่อผู้รับผิดชอบ
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-700 mb-6 uppercase tracking-wider">ผู้จัดทำเอกสาร</p>
              <div className="border-b border-slate-400 mb-1 mx-auto" style={{width: "80%"}}></div>
              <p className="text-[7px] text-slate-500">วันที่: ...... / ...... / ............</p>
              <p className="text-[7px] text-slate-400 mt-0.5">ชื่อ-นามสกุล: ....................................</p>
              <p className="text-[7px] text-slate-400">ตำแหน่ง: ....................................</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-700 mb-6 uppercase tracking-wider">ผู้อนุมัติ</p>
              <div className="border-b border-slate-400 mb-1 mx-auto" style={{width: "80%"}}></div>
              <p className="text-[7px] text-slate-500">วันที่: ...... / ...... / ............</p>
              <p className="text-[7px] text-slate-400 mt-0.5">ชื่อ-นามสกุล: ....................................</p>
              <p className="text-[7px] text-slate-400">ตำแหน่ง: ....................................</p>
            </div>
          </div>
        </div>

        {/* Footer note - print only */}
        <div className="mt-3 border-t border-slate-200 pt-3 print:block hidden">
          <p className="text-[7px] text-slate-400 text-center leading-relaxed">
            เอกสารนี้สร้างจากระบบ {organization.name} • เลขที่เอกสาร: {quotation.quotationNumber} • 
            วันที่พิมพ์: {new Date().toLocaleDateString(validLocale === "th" ? "th-TH" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </article>
    </div>
  );
}
