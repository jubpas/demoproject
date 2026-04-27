import prisma from "@/lib/db";
import { QuotationManager } from "@/components/org/quotation-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";

type Props = { params: Promise<{ locale: string; orgSlug: string }> };

export default async function QuotationsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [quotations, customers, projects] = await Promise.all([
    prisma.quotation.findMany({ where: { organizationId: organization.id }, include: { customer: { select: { name: true } }, project: { select: { name: true } }, items: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <QuotationManager
      locale={validLocale}
      quotations={quotations.map((item) => ({ id: item.id, quotationNumber: item.quotationNumber, customerId: item.customerId, customerName: item.customer.name, projectId: item.projectId, projectName: item.project?.name ?? null, status: item.status, issueDate: item.issueDate.toISOString(), validUntil: item.validUntil?.toISOString() ?? null, discountInCents: item.discountInCents, taxEnabled: item.taxEnabled, taxRate: item.taxRate, subtotalInCents: item.subtotalInCents, taxInCents: item.taxInCents, totalInCents: item.totalInCents, note: item.note, items: item.items }))}
      customers={customers}
      projects={projects}
      orgSlug={orgSlug}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, quotations: messages.quotations }}
    />
  );
}
