import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const password = "Tes001pass!";
const ownerEmail = "tes001.owner@sitepro.local";
const adminEmail = "tes001.admin@sitepro.local";
const managerEmail = "tes001.manager@sitepro.local";
const staffEmail = "tes001.staff@sitepro.local";
const subconEmail = "tes001.subcon@sitepro.local";
const invitedEmail = "tes001.invited@sitepro.local";
const superClassEmail = "tes001.superadmin@sitepro.local";
const organizationSlug = "tes001-construction-group";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { name: "Tes001 Owner", password: passwordHash },
    create: { name: "Tes001 Owner", email: ownerEmail, password: passwordHash },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Tes001 Admin", password: passwordHash },
    create: { name: "Tes001 Admin", email: adminEmail, password: passwordHash },
  });

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { name: "Tes001 Manager", password: passwordHash },
    create: { name: "Tes001 Manager", email: managerEmail, password: passwordHash },
  });

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: { name: "Tes001 Staff", password: passwordHash },
    create: { name: "Tes001 Staff", email: staffEmail, password: passwordHash },
  });

  const subcon = await prisma.user.upsert({
    where: { email: subconEmail },
    update: { name: "Tes001 Subcon", password: passwordHash },
    create: { name: "Tes001 Subcon", email: subconEmail, password: passwordHash },
  });

  const invited = await prisma.user.upsert({
    where: { email: invitedEmail },
    update: { name: "Tes001 Invited", password: passwordHash },
    create: { name: "Tes001 Invited", email: invitedEmail, password: passwordHash },
  });

  const superClass = await prisma.user.upsert({
    where: { email: superClassEmail },
    update: { name: "Tes001 SuperAdmin", systemRole: "SUPER_ADMIN", password: passwordHash },
    create: { name: "Tes001 SuperAdmin", email: superClassEmail, systemRole: "SUPER_ADMIN", password: passwordHash },
  });

  const existingOrganization = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (existingOrganization) {
    await prisma.organization.delete({ where: { id: existingOrganization.id } });
  }

  const organization = await prisma.organization.create({
    data: {
      name: "Tes001 Construction Group",
      slug: organizationSlug,
      description: "Test workspace for Tes001",
      createdById: owner.id,
      approvalThresholdInCents: 10000000,
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, organizationId: organization.id, role: "OWNER" },
      { userId: admin.id, organizationId: organization.id, role: "ADMIN" },
      { userId: manager.id, organizationId: organization.id, role: "MANAGER" },
      { userId: staff.id, organizationId: organization.id, role: "STAFF" },
      { userId: subcon.id, organizationId: organization.id, role: "SUBCONTRACTOR" },
    ],
  });

  await prisma.userPreference.upsert({
    where: { userId: owner.id },
    update: { lastOrganizationId: organization.id, locale: "th" },
    create: { userId: owner.id, lastOrganizationId: organization.id, locale: "th" },
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "Tes001 Customer A",
        companyName: "Tes001 Home Build Co., Ltd.",
        phone: "0811111001",
        email: "contact-a@tes001.example",
        address: "Bangna, Bangkok",
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "Tes001 Customer B",
        companyName: "Tes001 Office Fitout Co., Ltd.",
        phone: "0811111002",
        email: "contact-b@tes001.example",
        address: "Chiang Mai",
      },
    }),
  ]);

  const projectA = await prisma.project.create({
    data: {
      organizationId: organization.id,
      customerId: customers[0].id,
      createdById: owner.id,
      name: "Tes001 Project A",
      code: "TES001-PRJ-A",
      description: "Test project for renovation scope",
      location: "Bangna, Bangkok",
      status: "ACTIVE",
      budgetInCents: 125000000,
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-08-15T00:00:00.000Z"),
    },
  });

  const projectB = await prisma.project.create({
    data: {
      organizationId: organization.id,
      customerId: customers[1].id,
      createdById: owner.id,
      name: "Tes001 Project B",
      code: "TES001-PRJ-B",
      description: "Test project for office fitout",
      location: "Chiang Mai",
      status: "PLANNING",
      budgetInCents: 80000000,
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-10-30T00:00:00.000Z"),
    },
  });

  const categories = await Promise.all([
    prisma.budgetCategory.create({ data: { organizationId: organization.id, name: "Materials", colorToken: "blue", sortOrder: 1 } }),
    prisma.budgetCategory.create({ data: { organizationId: organization.id, name: "Labor", colorToken: "emerald", sortOrder: 2 } }),
    prisma.budgetCategory.create({ data: { organizationId: organization.id, name: "Equipment", colorToken: "amber", sortOrder: 3 } }),
  ]);

  await prisma.projectBudgetLine.createMany({
    data: [
      { organizationId: organization.id, projectId: projectA.id, budgetCategoryId: categories[0].id, plannedAmountInCents: 60000000, note: "Main materials" },
      { organizationId: organization.id, projectId: projectA.id, budgetCategoryId: categories[1].id, plannedAmountInCents: 35000000, note: "Labor allocation" },
      { organizationId: organization.id, projectId: projectA.id, budgetCategoryId: categories[2].id, plannedAmountInCents: 15000000, note: "Equipment and tooling" },
    ],
  });

  await prisma.surveyAppointment.createMany({
    data: [
      {
        organizationId: organization.id,
        customerId: customers[0].id,
        projectId: projectA.id,
        assignedToId: staff.id,
        createdById: owner.id,
        title: "Final site verification",
        location: "Bangna, Bangkok",
        contactName: "Khun Nida",
        contactPhone: "0812345678",
        scheduledStart: new Date("2026-05-05T03:00:00.000Z"),
        scheduledEnd: new Date("2026-05-05T05:00:00.000Z"),
        status: "CONFIRMED",
        note: "Verify ceiling and electrical layout before demolition.",
      },
      {
        organizationId: organization.id,
        projectId: undefined,
        customerId: customers[1].id,
        assignedToId: staff.id,
        createdById: owner.id,
        title: "Initial house survey",
        location: "Chiang Mai",
        contactName: "Khun Metta",
        contactPhone: "0890001122",
        scheduledStart: new Date("2026-05-12T02:00:00.000Z"),
        scheduledEnd: new Date("2026-05-12T04:00:00.000Z"),
        status: "PENDING",
        note: "Collect requirements for extension and facade refresh.",
      },
    ],
  });

  const quotation = await prisma.quotation.create({
    data: {
      organizationId: organization.id,
      customerId: customers[0].id,
      projectId: projectA.id,
      createdById: owner.id,
      quotationNumber: "QT-2026-0001",
      status: "SENT",
      issueDate: new Date("2026-05-03T00:00:00.000Z"),
      validUntil: new Date("2026-05-20T00:00:00.000Z"),
      subtotalInCents: 98000000,
      discountInCents: 3000000,
      taxEnabled: true,
      taxRate: 7,
      taxInCents: 6650000,
      totalInCents: 101650000,
      note: "Progress billing terms split into three milestones.",
      items: {
        create: [
          { description: "Demolition and disposal", quantity: 1, unit: "lot", unitPriceInCents: 12000000, totalInCents: 12000000, sortOrder: 1 },
          { description: "Interior fit-out", quantity: 1, unit: "lot", unitPriceInCents: 54000000, totalInCents: 54000000, sortOrder: 2 },
          { description: "MEP adjustment", quantity: 1, unit: "lot", unitPriceInCents: 32000000, totalInCents: 32000000, sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.projectTask.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: projectA.id,
        createdById: owner.id,
        assignedToId: staff.id,
        title: "Approve material samples",
        description: "Customer approval before procurement.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        startDate: new Date("2026-05-02T00:00:00.000Z"),
        dueDate: new Date("2026-05-10T00:00:00.000Z"),
        progressPercent: 45,
        sortOrder: 1,
      },
      {
        organizationId: organization.id,
        projectId: projectA.id,
        createdById: owner.id,
        assignedToId: staff.id,
        title: "Submit revised lighting layout",
        description: "Coordinate with electrician and customer feedback.",
        status: "TODO",
        priority: "MEDIUM",
        startDate: new Date("2026-05-08T00:00:00.000Z"),
        dueDate: new Date("2026-05-14T00:00:00.000Z"),
        progressPercent: 0,
        sortOrder: 2,
      },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: projectA.id,
        budgetCategoryId: categories[0].id,
        createdById: owner.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Steel framing",
        vendorName: "Bangkok Steel Supply",
        referenceNumber: "PO-001",
        amountInCents: 18500000,
        description: "Initial material order",
        transactionDate: new Date("2026-05-04T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: projectA.id,
        budgetCategoryId: categories[1].id,
        createdById: owner.id,
        type: "EXPENSE",
        paymentStatus: "PENDING",
        category: "Labor advance",
        vendorName: "Site Crew A",
        referenceNumber: "PAY-001",
        amountInCents: 9200000,
        description: "Advance payment for first work package",
        transactionDate: new Date("2026-05-06T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: projectB.id,
        createdById: owner.id,
        type: "INCOME",
        paymentStatus: "PAID",
        category: "Deposit receipt",
        vendorName: "Siam Home Design",
        referenceNumber: "INV-DEP-001",
        amountInCents: 35000000,
        description: "Customer deposit on contract sign-off",
        transactionDate: new Date("2026-05-07T00:00:00.000Z"),
      },
    ],
  });

  console.log("Demo seed completed");
  console.log(`Owner login: ${ownerEmail} / ${password}`);
  console.log(`Org slug: ${organizationSlug}`);
  console.log(`Quotation created: ${quotation.quotationNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
