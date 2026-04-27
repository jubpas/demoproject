import prisma from "@/lib/db";
import { ProjectManager } from "@/components/org/project-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function ProjectsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);
  const [projects, customers] = await Promise.all([
    prisma.project.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.customer.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <ProjectManager
      locale={validLocale}
      orgSlug={orgSlug}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        code: project.code,
        customerId: project.customerId,
        customerName: project.customer?.name ?? null,
        location: project.location,
        budgetInCents: project.budgetInCents,
        startDate: project.startDate?.toISOString() ?? null,
        endDate: project.endDate?.toISOString() ?? null,
        status: project.status,
        description: project.description,
      }))}
      customers={customers}
      canManage={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, projects: messages.projects }}
    />
  );
}
