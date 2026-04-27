import prisma from "@/lib/db";
import { canManageOrganizationData } from "@/lib/organization";
import { CustomerManager } from "@/components/org/customer-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function CustomersPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const customers = await prisma.customer.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CustomerManager
      orgSlug={orgSlug}
      customers={customers.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toISOString(),
      }))}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, customers: messages.customers }}
    />
  );
}
