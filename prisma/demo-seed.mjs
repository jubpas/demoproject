import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const organizationSlug = "demo-sitepro";
const password = "demo1234";

const users = {
  owner: {
    email: "demo.owner@sitepro.local",
    name: "Nattapong Owner",
  },
  admin: {
    email: "demo.admin@sitepro.local",
    name: "Kanyarat Admin",
  },
  manager: {
    email: "demo.manager@sitepro.local",
    name: "Preecha Site Manager",
  },
  carpenter: {
    email: "demo.carpenter@sitepro.local",
    name: "Somchai Carpenter",
  },
  electrician: {
    email: "demo.electrician@sitepro.local",
    name: "Anan Electrician",
  },
  painter: {
    email: "demo.painter@sitepro.local",
    name: "Mali Painter",
  },
};

function at(isoDateTime) {
  return new Date(isoDateTime);
}

function toCents(amount) {
  return Math.round(amount * 100);
}

async function upsertUser(email, name, passwordHash) {
  return prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash },
    create: { name, email, password: passwordHash },
  });
}

async function createAuditLog({
  organizationId,
  projectId = null,
  actorId,
  entityType,
  entityId,
  action,
  summary,
  beforeJson = null,
  afterJson = null,
  createdAt,
}) {
  return prisma.auditLog.create({
    data: {
      organizationId,
      projectId,
      actorId,
      entityType,
      entityId,
      action,
      summary,
      beforeJson,
      afterJson,
      createdAt,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const [owner, admin, manager, carpenter, electrician, painter] = await Promise.all([
    upsertUser(users.owner.email, users.owner.name, passwordHash),
    upsertUser(users.admin.email, users.admin.name, passwordHash),
    upsertUser(users.manager.email, users.manager.name, passwordHash),
    upsertUser(users.carpenter.email, users.carpenter.name, passwordHash),
    upsertUser(users.electrician.email, users.electrician.name, passwordHash),
    upsertUser(users.painter.email, users.painter.name, passwordHash),
  ]);

  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
  });

  if (existingOrganization) {
    await prisma.organization.delete({ where: { id: existingOrganization.id } });
  }

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { code: "starter-demo" },
    update: {
      name: "Starter Demo",
      description: "Demo subscription for the seeded workspace.",
      billingInterval: "MONTHLY",
      priceInCents: toCents(2490),
      seatLimit: 12,
      isActive: true,
    },
    create: {
      code: "starter-demo",
      name: "Starter Demo",
      description: "Demo subscription for the seeded workspace.",
      billingInterval: "MONTHLY",
      priceInCents: toCents(2490),
      seatLimit: 12,
      isActive: true,
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: "SiteNgan Pro Demo",
      slug: organizationSlug,
      description: "Demo workspace for projects, finance, teams, work logs, approvals, and reports.",
      approvalThresholdInCents: toCents(120000),
      createdById: owner.id,
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, organizationId: organization.id, role: "OWNER" },
      { userId: admin.id, organizationId: organization.id, role: "ADMIN" },
      { userId: manager.id, organizationId: organization.id, role: "MANAGER" },
      { userId: carpenter.id, organizationId: organization.id, role: "STAFF" },
      { userId: electrician.id, organizationId: organization.id, role: "STAFF" },
      { userId: painter.id, organizationId: organization.id, role: "STAFF" },
    ],
  });

  await Promise.all([
    prisma.userPreference.upsert({
      where: { userId: owner.id },
      update: { lastOrganizationId: organization.id, locale: "th" },
      create: { userId: owner.id, lastOrganizationId: organization.id, locale: "th" },
    }),
    prisma.userPreference.upsert({
      where: { userId: manager.id },
      update: { lastOrganizationId: organization.id, locale: "th" },
      create: { userId: manager.id, lastOrganizationId: organization.id, locale: "th" },
    }),
    prisma.organizationSubscription.create({
      data: {
        organizationId: organization.id,
        planId: starterPlan.id,
        assignedById: owner.id,
        status: "ACTIVE",
        startedAt: at("2026-04-01T00:00:00.000Z"),
        renewAt: at("2026-06-01T00:00:00.000Z"),
      },
    }),
    prisma.organizationInvite.create({
      data: {
        organizationId: organization.id,
        email: "pending.contractor@sitepro.local",
        role: "STAFF",
        tokenHash: `demo-pending-invite-${organization.id}`,
        invitedById: admin.id,
        status: "PENDING",
        expiresAt: at("2026-05-20T00:00:00.000Z"),
      },
    }),
  ]);

  const [customerA, customerB, customerC] = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "บริษัท สยามโฮมดีไซน์ จำกัด",
        companyName: "Siam Home Design Co., Ltd.",
        phone: "0812345678",
        email: "contact@siamhome.example",
        address: "Bangna, Bangkok",
        note: "Main renovation customer with office fit-out and phased payments.",
        createdAt: at("2026-04-02T09:00:00.000Z"),
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "คุณเมธา ศิริชัย",
        companyName: "Metta Residence",
        phone: "0890001122",
        email: "metta@example.com",
        address: "Chiang Mai",
        note: "House extension and facade refresh lead.",
        createdAt: at("2026-04-12T09:00:00.000Z"),
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "บริษัท นอร์ธเทค เวิร์กสเปซ",
        companyName: "NorthTech Workspace",
        phone: "0867774455",
        email: "ops@northtech.example",
        address: "Ratchadaphisek, Bangkok",
        note: "Workspace refresh project already completed and used for historical reporting.",
        createdAt: at("2026-03-14T09:00:00.000Z"),
      },
    }),
  ]);

  const [activeProject, planningProject, completedProject] = await Promise.all([
    prisma.project.create({
      data: {
        organizationId: organization.id,
        customerId: customerA.id,
        createdById: owner.id,
        name: "Bangna Office Renovation",
        code: "BNG-REN-001",
        description: "Interior renovation with MEP, partitions, ceiling, and furnishing scope.",
        location: "Bangna, Bangkok",
        status: "ACTIVE",
        budgetInCents: toCents(1250000),
        startDate: at("2026-05-01T00:00:00.000Z"),
        endDate: at("2026-08-15T00:00:00.000Z"),
        createdAt: at("2026-04-25T09:00:00.000Z"),
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        customerId: customerB.id,
        createdById: manager.id,
        name: "Metta House Extension",
        code: "MHT-EXT-002",
        description: "Planning package for extension, facade paint, and electrical refresh.",
        location: "Chiang Mai",
        status: "PLANNING",
        budgetInCents: toCents(680000),
        startDate: at("2026-06-01T00:00:00.000Z"),
        endDate: at("2026-09-10T00:00:00.000Z"),
        createdAt: at("2026-05-02T09:00:00.000Z"),
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        customerId: customerC.id,
        createdById: admin.id,
        name: "NorthTech Meeting Hub Refresh",
        code: "NTH-REF-003",
        description: "Completed refresh project for reporting history and margin comparison.",
        location: "Ratchadaphisek, Bangkok",
        status: "COMPLETED",
        budgetInCents: toCents(540000),
        startDate: at("2026-03-01T00:00:00.000Z"),
        endDate: at("2026-04-18T00:00:00.000Z"),
        createdAt: at("2026-02-20T09:00:00.000Z"),
      },
    }),
  ]);

  const [materialsCategory, laborCategory, equipmentCategory, logisticsCategory] = await Promise.all([
    prisma.budgetCategory.create({
      data: { organizationId: organization.id, name: "Materials", colorToken: "blue", sortOrder: 1 },
    }),
    prisma.budgetCategory.create({
      data: { organizationId: organization.id, name: "Labor", colorToken: "emerald", sortOrder: 2 },
    }),
    prisma.budgetCategory.create({
      data: { organizationId: organization.id, name: "Equipment", colorToken: "amber", sortOrder: 3 },
    }),
    prisma.budgetCategory.create({
      data: { organizationId: organization.id, name: "Logistics", colorToken: "violet", sortOrder: 4 },
    }),
  ]);

  const budgetLines = await Promise.all([
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: materialsCategory.id,
        plannedAmountInCents: toCents(600000),
        note: "Main materials package for office renovation.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: laborCategory.id,
        plannedAmountInCents: toCents(350000),
        note: "Labor allocation for field crew and subcontract support.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: equipmentCategory.id,
        plannedAmountInCents: toCents(150000),
        note: "Rental equipment and safety gear.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: planningProject.id,
        budgetCategoryId: materialsCategory.id,
        plannedAmountInCents: toCents(280000),
        note: "Preliminary material estimate.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: planningProject.id,
        budgetCategoryId: laborCategory.id,
        plannedAmountInCents: toCents(220000),
        note: "Estimated labor for extension works.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: completedProject.id,
        budgetCategoryId: materialsCategory.id,
        plannedAmountInCents: toCents(250000),
        note: "Completed project material budget.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: completedProject.id,
        budgetCategoryId: laborCategory.id,
        plannedAmountInCents: toCents(180000),
        note: "Completed project labor budget.",
      },
    }),
    prisma.projectBudgetLine.create({
      data: {
        organizationId: organization.id,
        projectId: completedProject.id,
        budgetCategoryId: logisticsCategory.id,
        plannedAmountInCents: toCents(45000),
        note: "Delivery and travel budget for completed project.",
      },
    }),
  ]);

  const [activeSurvey, planningSurvey, completedSurvey] = await Promise.all([
    prisma.surveyAppointment.create({
      data: {
        organizationId: organization.id,
        customerId: customerA.id,
        projectId: activeProject.id,
        assignedToId: manager.id,
        createdById: owner.id,
        title: "Final site verification",
        location: "Bangna, Bangkok",
        contactName: "Khun Nida",
        contactPhone: "0812345678",
        scheduledStart: at("2026-05-05T03:00:00.000Z"),
        scheduledEnd: at("2026-05-05T05:00:00.000Z"),
        status: "CONFIRMED",
        note: "Verify ceiling level and electrical route before demolition starts.",
      },
    }),
    prisma.surveyAppointment.create({
      data: {
        organizationId: organization.id,
        customerId: customerB.id,
        assignedToId: manager.id,
        createdById: admin.id,
        title: "Initial house survey",
        location: "Chiang Mai",
        contactName: "Khun Metta",
        contactPhone: "0890001122",
        scheduledStart: at("2026-05-12T02:00:00.000Z"),
        scheduledEnd: at("2026-05-12T04:00:00.000Z"),
        status: "PENDING",
        note: "Collect requirements for extension and facade refresh.",
      },
    }),
    prisma.surveyAppointment.create({
      data: {
        organizationId: organization.id,
        customerId: customerC.id,
        projectId: completedProject.id,
        assignedToId: admin.id,
        createdById: manager.id,
        title: "Post-handover defect check",
        location: "Ratchadaphisek, Bangkok",
        contactName: "Khun May",
        contactPhone: "0867774455",
        scheduledStart: at("2026-04-16T03:00:00.000Z"),
        scheduledEnd: at("2026-04-16T04:30:00.000Z"),
        status: "COMPLETED",
        note: "Customer signed off after minor touch-up completion.",
      },
    }),
  ]);

  const quotations = await Promise.all([
    prisma.quotation.create({
      data: {
        organizationId: organization.id,
        customerId: customerA.id,
        projectId: activeProject.id,
        createdById: owner.id,
        surveyAppointmentId: activeSurvey.id,
        quotationNumber: "QT-2026-0001",
        status: "SENT",
        issueDate: at("2026-05-03T00:00:00.000Z"),
        validUntil: at("2026-05-20T00:00:00.000Z"),
        subtotalInCents: toCents(980000),
        discountInCents: toCents(30000),
        taxEnabled: true,
        taxRate: 7,
        taxInCents: toCents(66500),
        totalInCents: toCents(1016500),
        note: "Progress billing terms split into three milestones.",
        items: {
          create: [
            { description: "Demolition and disposal", quantity: 1, unit: "lot", unitPriceInCents: toCents(120000), totalInCents: toCents(120000), sortOrder: 1 },
            { description: "Interior fit-out", quantity: 1, unit: "lot", unitPriceInCents: toCents(540000), totalInCents: toCents(540000), sortOrder: 2 },
            { description: "MEP adjustment", quantity: 1, unit: "lot", unitPriceInCents: toCents(320000), totalInCents: toCents(320000), sortOrder: 3 },
          ],
        },
      },
    }),
    prisma.quotation.create({
      data: {
        organizationId: organization.id,
        customerId: customerB.id,
        projectId: planningProject.id,
        createdById: manager.id,
        surveyAppointmentId: planningSurvey.id,
        quotationNumber: "QT-2026-0002",
        status: "DRAFT",
        issueDate: at("2026-05-06T00:00:00.000Z"),
        validUntil: at("2026-05-30T00:00:00.000Z"),
        subtotalInCents: toCents(410000),
        discountInCents: 0,
        taxEnabled: false,
        totalInCents: toCents(410000),
        note: "Draft estimate pending structural review.",
        items: {
          create: [
            { description: "Extension structure", quantity: 1, unit: "lot", unitPriceInCents: toCents(260000), totalInCents: toCents(260000), sortOrder: 1 },
            { description: "Facade paint", quantity: 1, unit: "lot", unitPriceInCents: toCents(95000), totalInCents: toCents(95000), sortOrder: 2 },
            { description: "Electrical refresh", quantity: 1, unit: "lot", unitPriceInCents: toCents(55000), totalInCents: toCents(55000), sortOrder: 3 },
          ],
        },
      },
    }),
    prisma.quotation.create({
      data: {
        organizationId: organization.id,
        customerId: customerC.id,
        projectId: completedProject.id,
        createdById: admin.id,
        surveyAppointmentId: completedSurvey.id,
        quotationNumber: "QT-2026-0003",
        status: "ACCEPTED",
        issueDate: at("2026-03-10T00:00:00.000Z"),
        validUntil: at("2026-03-24T00:00:00.000Z"),
        subtotalInCents: toCents(525000),
        discountInCents: toCents(15000),
        taxEnabled: true,
        taxRate: 7,
        taxInCents: toCents(35700),
        totalInCents: toCents(545700),
        note: "Accepted and completed. Used for historical margin reference.",
        items: {
          create: [
            { description: "Meeting room refresh", quantity: 1, unit: "lot", unitPriceInCents: toCents(280000), totalInCents: toCents(280000), sortOrder: 1 },
            { description: "Acoustic panel installation", quantity: 1, unit: "lot", unitPriceInCents: toCents(145000), totalInCents: toCents(145000), sortOrder: 2 },
            { description: "Lighting retune", quantity: 1, unit: "lot", unitPriceInCents: toCents(100000), totalInCents: toCents(100000), sortOrder: 3 },
          ],
        },
      },
    }),
    prisma.quotation.create({
      data: {
        organizationId: organization.id,
        customerId: customerA.id,
        createdById: admin.id,
        quotationNumber: "QT-2026-0004",
        status: "EXPIRED",
        issueDate: at("2026-04-01T00:00:00.000Z"),
        validUntil: at("2026-04-10T00:00:00.000Z"),
        subtotalInCents: toCents(155000),
        discountInCents: 0,
        taxEnabled: false,
        totalInCents: toCents(155000),
        note: "Expired alternative furniture proposal.",
        items: {
          create: [
            { description: "Loose furniture package", quantity: 1, unit: "lot", unitPriceInCents: toCents(155000), totalInCents: toCents(155000), sortOrder: 1 },
          ],
        },
      },
    }),
  ]);

  const tasks = await Promise.all([
    prisma.projectTask.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        createdById: owner.id,
        assignedToId: manager.id,
        title: "Approve material samples",
        description: "Customer approval before procurement.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        startDate: at("2026-05-02T00:00:00.000Z"),
        dueDate: at("2026-05-10T00:00:00.000Z"),
        progressPercent: 45,
        sortOrder: 1,
      },
    }),
    prisma.projectTask.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        createdById: owner.id,
        assignedToId: electrician.id,
        title: "Submit revised lighting layout",
        description: "Coordinate with electrician and customer feedback.",
        status: "TODO",
        priority: "MEDIUM",
        startDate: at("2026-05-08T00:00:00.000Z"),
        dueDate: at("2026-05-14T00:00:00.000Z"),
        progressPercent: 0,
        sortOrder: 2,
      },
    }),
    prisma.projectTask.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        createdById: manager.id,
        assignedToId: carpenter.id,
        title: "Install partition framing",
        description: "Frame and level the meeting room partition line.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        startDate: at("2026-05-04T00:00:00.000Z"),
        dueDate: at("2026-05-08T00:00:00.000Z"),
        progressPercent: 70,
        sortOrder: 3,
      },
    }),
    prisma.projectTask.create({
      data: {
        organizationId: organization.id,
        projectId: planningProject.id,
        createdById: manager.id,
        assignedToId: admin.id,
        title: "Finalize structural estimate",
        description: "Prepare planning pack and supplier assumptions.",
        status: "TODO",
        priority: "HIGH",
        startDate: at("2026-05-07T00:00:00.000Z"),
        dueDate: at("2026-05-16T00:00:00.000Z"),
        progressPercent: 10,
        sortOrder: 1,
      },
    }),
    prisma.projectTask.create({
      data: {
        organizationId: organization.id,
        projectId: completedProject.id,
        createdById: admin.id,
        assignedToId: painter.id,
        title: "Touch-up paint defects",
        description: "Final punch list item before sign-off.",
        status: "DONE",
        priority: "LOW",
        startDate: at("2026-04-14T00:00:00.000Z"),
        dueDate: at("2026-04-15T00:00:00.000Z"),
        endDate: at("2026-04-15T00:00:00.000Z"),
        progressPercent: 100,
        completedAt: at("2026-04-15T10:30:00.000Z"),
        sortOrder: 1,
      },
    }),
  ]);

  await prisma.transaction.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: materialsCategory.id,
        createdById: owner.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Steel framing",
        vendorName: "Bangkok Steel Supply",
        referenceNumber: "PO-001",
        amountInCents: toCents(185000),
        description: "Initial material order for partition framing.",
        transactionDate: at("2026-05-04T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: laborCategory.id,
        createdById: manager.id,
        type: "EXPENSE",
        paymentStatus: "PENDING",
        category: "Labor advance",
        vendorName: "Crew Alpha",
        referenceNumber: "PAY-001",
        amountInCents: toCents(92000),
        description: "Advance payment for the first site work package.",
        transactionDate: at("2026-05-06T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        budgetCategoryId: equipmentCategory.id,
        createdById: admin.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Scaffold rental",
        vendorName: "SafeLift Rental",
        referenceNumber: "EQ-004",
        amountInCents: toCents(28000),
        description: "Seven-day scaffold rental.",
        transactionDate: at("2026-05-05T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        createdById: owner.id,
        type: "INCOME",
        paymentStatus: "PAID",
        category: "Deposit receipt",
        vendorName: "Siam Home Design",
        referenceNumber: "INV-DEP-001",
        amountInCents: toCents(350000),
        description: "Customer deposit on contract sign-off.",
        transactionDate: at("2026-05-07T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: planningProject.id,
        createdById: manager.id,
        type: "INCOME",
        paymentStatus: "PARTIALLY_PAID",
        category: "Design retainer",
        vendorName: "Metta Residence",
        referenceNumber: "INV-DES-002",
        amountInCents: toCents(45000),
        description: "Planning retainer partially paid by the customer.",
        transactionDate: at("2026-05-03T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: planningProject.id,
        budgetCategoryId: logisticsCategory.id,
        createdById: admin.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Site travel",
        vendorName: "Northern Travel Service",
        referenceNumber: "TR-102",
        amountInCents: toCents(6000),
        description: "Round trip site travel for planning survey.",
        transactionDate: at("2026-05-02T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: completedProject.id,
        budgetCategoryId: materialsCategory.id,
        createdById: admin.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Acoustic materials",
        vendorName: "AcoustiBuild",
        referenceNumber: "PO-310",
        amountInCents: toCents(118000),
        description: "Completed project material package.",
        transactionDate: at("2026-04-02T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: completedProject.id,
        budgetCategoryId: laborCategory.id,
        createdById: manager.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Installer labor",
        vendorName: "Crew Beta",
        referenceNumber: "PAY-221",
        amountInCents: toCents(91000),
        description: "Installer labor for completed project.",
        transactionDate: at("2026-04-06T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        projectId: completedProject.id,
        createdById: owner.id,
        type: "INCOME",
        paymentStatus: "PAID",
        category: "Final collection",
        vendorName: "NorthTech Workspace",
        referenceNumber: "INV-FIN-003",
        amountInCents: toCents(545700),
        description: "Final project collection after handover.",
        transactionDate: at("2026-04-18T00:00:00.000Z"),
      },
      {
        organizationId: organization.id,
        createdById: admin.id,
        type: "EXPENSE",
        paymentStatus: "PAID",
        category: "Office internet",
        vendorName: "Metro Fiber",
        referenceNumber: "OPS-444",
        amountInCents: toCents(1800),
        description: "Organization overhead not assigned to a project.",
        transactionDate: at("2026-05-01T00:00:00.000Z"),
      },
    ],
  });

  const [structureTeam, finishingTeam] = await Promise.all([
    prisma.workerTeam.create({
      data: {
        organizationId: organization.id,
        name: "Structure Crew",
        description: "Main site team for framing, electrical rough-in, and structural work.",
        createdBy: manager.id,
      },
    }),
    prisma.workerTeam.create({
      data: {
        organizationId: organization.id,
        name: "Finishing Crew",
        description: "Finishing team for paint, cleanup, and handover punch list.",
        createdBy: admin.id,
      },
    }),
  ]);

  await prisma.workerTeamMember.createMany({
    data: [
      {
        workerTeamId: structureTeam.id,
        userId: manager.id,
        role: "LEADER",
        isMainWorker: true,
        compensationType: "MONTHLY",
        monthlyWageInCents: toCents(42000),
      },
      {
        workerTeamId: structureTeam.id,
        userId: carpenter.id,
        role: "MEMBER",
        compensationType: "DAILY",
        dailyWageInCents: toCents(950),
      },
      {
        workerTeamId: structureTeam.id,
        userId: electrician.id,
        role: "SUBCONTRACTOR",
        compensationType: "DAILY",
        dailyWageInCents: toCents(1350),
      },
      {
        workerTeamId: finishingTeam.id,
        userId: admin.id,
        role: "LEADER",
        isMainWorker: true,
        compensationType: "MONTHLY",
        monthlyWageInCents: toCents(38000),
      },
      {
        workerTeamId: finishingTeam.id,
        userId: painter.id,
        role: "MEMBER",
        compensationType: "DAILY",
        dailyWageInCents: toCents(820),
      },
    ],
  });

  await prisma.workerAssignment.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        taskId: tasks[2].id,
        workerTeamId: structureTeam.id,
        workerUserId: carpenter.id,
        assignedById: manager.id,
        title: "Partition framing crew allocation",
        startDate: at("2026-05-04T00:00:00.000Z"),
        endDate: at("2026-05-08T00:00:00.000Z"),
        plannedDays: 5,
        compensationType: "DAILY",
        wageInCents: toCents(950),
        estimatedCostInCents: toCents(4750),
        status: "ACTIVE",
        notes: "Primary carpenter on the partition framing package.",
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        taskId: tasks[1].id,
        workerTeamId: structureTeam.id,
        workerUserId: electrician.id,
        assignedById: manager.id,
        title: "Lighting revision support",
        startDate: at("2026-05-08T00:00:00.000Z"),
        endDate: at("2026-05-10T00:00:00.000Z"),
        plannedDays: 3,
        compensationType: "DAILY",
        wageInCents: toCents(1350),
        estimatedCostInCents: toCents(4050),
        status: "PLANNED",
        notes: "Electrical subcontractor for revised lighting layout and rough-in review.",
      },
      {
        organizationId: organization.id,
        projectId: planningProject.id,
        taskId: tasks[3].id,
        workerTeamId: structureTeam.id,
        workerUserId: manager.id,
        assignedById: owner.id,
        title: "Planning estimate lead",
        startDate: at("2026-05-07T00:00:00.000Z"),
        endDate: at("2026-05-12T00:00:00.000Z"),
        plannedDays: 6,
        compensationType: "MONTHLY",
        wageInCents: toCents(42000),
        estimatedCostInCents: toCents(8400),
        status: "ACTIVE",
        notes: "Monthly-paid site lead prorated for planning support.",
      },
      {
        organizationId: organization.id,
        projectId: completedProject.id,
        taskId: tasks[4].id,
        workerTeamId: finishingTeam.id,
        workerUserId: painter.id,
        assignedById: admin.id,
        title: "Final touch-up and handover prep",
        startDate: at("2026-04-14T00:00:00.000Z"),
        endDate: at("2026-04-15T00:00:00.000Z"),
        plannedDays: 2,
        compensationType: "DAILY",
        wageInCents: toCents(820),
        estimatedCostInCents: toCents(1640),
        status: "COMPLETED",
        notes: "Punch list closeout before final sign-off.",
      },
    ],
  });

  await prisma.workLog.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        taskId: tasks[2].id,
        workerTeamId: structureTeam.id,
        workerUserId: carpenter.id,
        date: at("2026-05-04T00:00:00.000Z"),
        checkIn: at("2026-05-04T01:00:00.000Z"),
        checkOut: at("2026-05-04T10:00:00.000Z"),
        durationMinutes: 540,
        status: "APPROVED",
        notes: "Completed first partition line and layout marking.",
        completionPercent: 35,
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        taskId: tasks[2].id,
        workerTeamId: structureTeam.id,
        workerUserId: carpenter.id,
        date: at("2026-05-05T00:00:00.000Z"),
        checkIn: at("2026-05-05T01:15:00.000Z"),
        checkOut: at("2026-05-05T09:45:00.000Z"),
        durationMinutes: 510,
        status: "PENDING",
        notes: "Framing progress ongoing. Waiting for material top-up.",
        completionPercent: 60,
      },
      {
        organizationId: organization.id,
        projectId: activeProject.id,
        taskId: tasks[1].id,
        workerTeamId: structureTeam.id,
        workerUserId: electrician.id,
        date: at("2026-05-06T00:00:00.000Z"),
        checkIn: at("2026-05-06T02:00:00.000Z"),
        checkOut: at("2026-05-06T06:30:00.000Z"),
        durationMinutes: 270,
        status: "REJECTED",
        notes: "Draft layout submitted without the final client markups attached.",
        completionPercent: 20,
      },
      {
        organizationId: organization.id,
        projectId: planningProject.id,
        taskId: tasks[3].id,
        workerTeamId: structureTeam.id,
        workerUserId: manager.id,
        date: at("2026-05-07T00:00:00.000Z"),
        checkIn: at("2026-05-07T01:30:00.000Z"),
        checkOut: at("2026-05-07T08:30:00.000Z"),
        durationMinutes: 420,
        status: "PENDING",
        notes: "Prepared quantity assumptions and supplier shortlist.",
        completionPercent: 40,
      },
      {
        organizationId: organization.id,
        projectId: completedProject.id,
        taskId: tasks[4].id,
        workerTeamId: finishingTeam.id,
        workerUserId: painter.id,
        date: at("2026-04-15T00:00:00.000Z"),
        checkIn: at("2026-04-15T01:00:00.000Z"),
        checkOut: at("2026-04-15T07:00:00.000Z"),
        durationMinutes: 360,
        status: "APPROVED",
        notes: "Final paint touch-up and cleanup completed.",
        completionPercent: 100,
      },
    ],
  });

  const [budgetRevision, pendingApproval, approvedApproval, rejectedApproval] = await Promise.all([
    prisma.budgetRevision.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        projectBudgetLineId: budgetLines[1].id,
        changedById: manager.id,
        action: "UPDATE",
        budgetCategoryName: "Labor",
        previousAmountInCents: toCents(320000),
        newAmountInCents: toCents(350000),
        note: "Expanded labor allowance for overtime and subcontract support.",
        reason: "Customer requested compressed delivery window.",
        createdAt: at("2026-05-05T08:00:00.000Z"),
      },
    }),
    prisma.approvalRequest.create({
      data: {
        organizationId: organization.id,
        projectId: activeProject.id,
        requestedById: manager.id,
        entityType: "PROJECT_BUDGET_LINE",
        action: "UPDATE",
        status: "PENDING",
        summary: "Increase labor budget for Bangna Office Renovation by THB 30,000",
        payloadJson: JSON.stringify({
          budgetCategory: "Labor",
          previousAmountInCents: toCents(320000),
          newAmountInCents: toCents(350000),
          reason: "Compressed delivery window",
        }),
        createdAt: at("2026-05-05T08:30:00.000Z"),
      },
    }),
    prisma.approvalRequest.create({
      data: {
        organizationId: organization.id,
        projectId: completedProject.id,
        requestedById: admin.id,
        approvedById: owner.id,
        entityType: "TRANSACTION",
        action: "APPROVE",
        status: "APPROVED",
        summary: "Approve final variation expense for NorthTech project",
        payloadJson: JSON.stringify({
          amountInCents: toCents(12500),
          category: "Final variation",
        }),
        responseNote: "Approved after checking signed variation order.",
        createdAt: at("2026-04-11T10:00:00.000Z"),
        respondedAt: at("2026-04-11T12:00:00.000Z"),
      },
    }),
    prisma.approvalRequest.create({
      data: {
        organizationId: organization.id,
        projectId: planningProject.id,
        requestedById: manager.id,
        approvedById: owner.id,
        entityType: "PROJECT_BUDGET_LINE",
        action: "REJECT",
        status: "REJECTED",
        summary: "Request to add contingency budget before structural review",
        payloadJson: JSON.stringify({
          budgetCategory: "Contingency",
          newAmountInCents: toCents(60000),
        }),
        responseNote: "Rejected until structural review is complete.",
        createdAt: at("2026-05-01T10:00:00.000Z"),
        respondedAt: at("2026-05-01T15:00:00.000Z"),
      },
    }),
  ]);

  await Promise.all([
    createAuditLog({
      organizationId: organization.id,
      actorId: admin.id,
      entityType: "MEMBERSHIP",
      entityId: manager.id,
      action: "CREATE",
      summary: "Added Preecha Site Manager to the organization as MANAGER",
      beforeJson: null,
      afterJson: JSON.stringify({ email: users.manager.email, role: "MANAGER" }),
      createdAt: at("2026-04-01T09:00:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      actorId: admin.id,
      entityType: "ORGANIZATION_INVITE",
      entityId: "pending.contractor@sitepro.local",
      action: "CREATE",
      summary: "Invited pending.contractor@sitepro.local as STAFF",
      beforeJson: null,
      afterJson: JSON.stringify({ email: "pending.contractor@sitepro.local", role: "STAFF", status: "PENDING" }),
      createdAt: at("2026-05-02T10:00:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: activeProject.id,
      actorId: manager.id,
      entityType: "PROJECT_BUDGET_LINE",
      entityId: budgetLines[1].id,
      action: "UPDATE",
      summary: "Adjusted labor budget for Bangna Office Renovation",
      beforeJson: JSON.stringify({ plannedAmountInCents: toCents(320000), note: "Initial labor budget" }),
      afterJson: JSON.stringify({ plannedAmountInCents: toCents(350000), note: "Expanded labor allowance for overtime and subcontract support." }),
      createdAt: at("2026-05-05T08:05:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: activeProject.id,
      actorId: owner.id,
      entityType: "APPROVAL_REQUEST",
      entityId: pendingApproval.id,
      action: "CREATE",
      summary: pendingApproval.summary,
      beforeJson: null,
      afterJson: pendingApproval.payloadJson,
      createdAt: at("2026-05-05T08:31:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: completedProject.id,
      actorId: owner.id,
      entityType: "APPROVAL_REQUEST",
      entityId: approvedApproval.id,
      action: "APPROVE",
      summary: approvedApproval.summary,
      beforeJson: approvedApproval.payloadJson,
      afterJson: JSON.stringify({ status: "APPROVED", responseNote: approvedApproval.responseNote }),
      createdAt: at("2026-04-11T12:00:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: planningProject.id,
      actorId: owner.id,
      entityType: "APPROVAL_REQUEST",
      entityId: rejectedApproval.id,
      action: "REJECT",
      summary: rejectedApproval.summary,
      beforeJson: rejectedApproval.payloadJson,
      afterJson: JSON.stringify({ status: "REJECTED", responseNote: rejectedApproval.responseNote }),
      createdAt: at("2026-05-01T15:00:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: activeProject.id,
      actorId: owner.id,
      entityType: "TRANSACTION",
      entityId: "deposit-receipt",
      action: "CREATE",
      summary: "Recorded customer deposit receipt for Bangna Office Renovation",
      beforeJson: null,
      afterJson: JSON.stringify({ category: "Deposit receipt", amountInCents: toCents(350000), type: "INCOME" }),
      createdAt: at("2026-05-07T10:00:00.000Z"),
    }),
    createAuditLog({
      organizationId: organization.id,
      projectId: activeProject.id,
      actorId: manager.id,
      entityType: "WORK_LOG",
      entityId: `${structureTeam.id}-2026-05-05`,
      action: "UPDATE",
      summary: "Updated daily work log for partition framing progress",
      beforeJson: JSON.stringify({ completionPercent: 35, status: "PENDING" }),
      afterJson: JSON.stringify({ completionPercent: 60, status: "PENDING" }),
      createdAt: at("2026-05-05T18:00:00.000Z"),
    }),
  ]);

  console.log("Demo seed completed");
  console.log(`Owner login: ${users.owner.email} / ${password}`);
  console.log(`Manager login: ${users.manager.email} / ${password}`);
  console.log(`Org slug: ${organizationSlug}`);
  console.log(`Projects seeded: 3`);
  console.log(`Quotations seeded: ${quotations.length}`);
  console.log(`Budget revision seeded: ${budgetRevision.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
