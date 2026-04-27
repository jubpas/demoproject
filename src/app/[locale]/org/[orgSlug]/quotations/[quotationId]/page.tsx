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
