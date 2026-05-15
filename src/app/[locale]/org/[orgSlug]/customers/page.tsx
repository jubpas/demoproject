import prisma from "@/lib/db";
import { canManageOrganizationData } from "@/lib/organization";
import { CustomerManager } from "@/components/org/customer-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

type CustomerListRow = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  createdAt: Date;
  _count?: {
    quotations: number;
    surveyAppointments: number;
    projects: number;
  };
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
    include: {
        _count: {
        select: { surveyAppointments: true, quotations: true, projects: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CustomerManager
      locale={validLocale}
      orgSlug={orgSlug}
      customers={customers.map((customer: CustomerListRow) => ({
        id: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        note: customer.note,
        createdAt: customer.createdAt.toISOString(),
        quotationCount: customer._count?.quotations ?? 0,
        appointmentCount: customer._count?.surveyAppointments ?? 0,
        projectCount: customer._count?.projects ?? 0,
      }))}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, customers: messages.customers }}
    />
  );
}
