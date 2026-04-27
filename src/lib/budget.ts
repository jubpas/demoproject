import "server-only";

import prisma from "@/lib/db";

const defaultBudgetCategories = [
  { name: "Materials", colorToken: "blue", sortOrder: 1 },
  { name: "Labor", colorToken: "emerald", sortOrder: 2 },
  { name: "Subcontractor", colorToken: "violet", sortOrder: 3 },
  { name: "Equipment", colorToken: "amber", sortOrder: 4 },
  { name: "Overhead", colorToken: "slate", sortOrder: 5 },
  { name: "Other", colorToken: "rose", sortOrder: 6 },
] as const;

export async function ensureOrganizationBudgetCategories(organizationId: string) {
  await Promise.all(
    defaultBudgetCategories.map((category) =>
      prisma.budgetCategory.upsert({
        where: {
          organizationId_name: {
            organizationId,
            name: category.name,
          },
        },
        update: {},
        create: {
          organizationId,
          name: category.name,
          colorToken: category.colorToken,
          sortOrder: category.sortOrder,
        },
      }),
    ),
  );

  return prisma.budgetCategory.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
