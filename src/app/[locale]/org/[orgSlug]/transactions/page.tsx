import prisma from "@/lib/db";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import { TransactionManager } from "@/components/org/transaction-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageOrganizationData, canWriteTransactions } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function TransactionsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [transactions, projects, budgetCategories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        budgetCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    }),
    prisma.project.findMany({
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
    ensureOrganizationBudgetCategories(organization.id),
  ]);

  return (
    <TransactionManager
      locale={validLocale}
      orgSlug={orgSlug}
      transactions={transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amountInCents: transaction.amountInCents,
        description: transaction.description,
        transactionDate: transaction.transactionDate.toISOString(),
        projectId: transaction.projectId,
        projectName: transaction.project?.name ?? null,
        budgetCategoryId: transaction.budgetCategoryId,
        budgetCategoryName: transaction.budgetCategory?.name ?? null,
        paymentStatus: transaction.paymentStatus,
        vendorName: transaction.vendorName,
        referenceNumber: transaction.referenceNumber,
        attachments: transaction.attachments,
      }))}
      projects={projects}
      budgetCategories={budgetCategories.map((category) => ({
        id: category.id,
        name: category.name,
      }))}
      canWrite={canWriteTransactions(membership.role)}
      canDelete={canManageOrganizationData(membership.role)}
      copy={{ common: messages.common, transactions: messages.transactions }}
    />
  );
}
