import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next-auth and related modules before any route imports
const mockAuth = vi.fn(() => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
  auth: vi.fn(() => Promise.resolve({ user: { id: "user-1" } })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: mockAuth,
  getServerSession: vi.fn(() => Promise.resolve(null)),
  unstable_getServerSession: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ name: "credentials" })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

// Mock auth.ts to return a fake session
vi.mock("@/lib/auth", () => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
  auth: vi.fn(() => Promise.resolve({ user: { id: "user-1" } })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock organization to return valid membership and permissions
vi.mock("@/lib/organization", () => ({
  getMembershipByOrgSlug: vi.fn(() => Promise.resolve({
    organizationId: "org-1",
    role: "OWNER",
  })),
  canManageOrganizationData: vi.fn(() => true),
  canWriteTransactions: vi.fn(() => true),
}));

// Shared mocks for prisma models
const customerCreate = vi.fn();
const customerFindMany = vi.fn();

const projectCreate = vi.fn();
const projectFindMany = vi.fn();

const transactionCreate = vi.fn();
const transactionFindMany = vi.fn();
const budgetCategoryUpsert = vi.fn().mockResolvedValue({ id: "bc-1", name: "income" });
const budgetCategoryFindMany = vi.fn().mockResolvedValue([]);
const auditLogCreate = vi.fn().mockResolvedValue({ id: "audit-1" });

vi.mock("@/lib/db", () => ({
  default: {
    customer: { create: customerCreate, findMany: customerFindMany },
    project: { create: projectCreate, findMany: projectFindMany },
    transaction: { create: transactionCreate, findMany: transactionFindMany },
    budgetCategory: { upsert: budgetCategoryUpsert, findMany: budgetCategoryFindMany },
    auditLog: { create: auditLogCreate },
  },
}));

describe("API CRUD tests for customers, projects, and transactions", () => {
  const orgSlug = "acme";
  const ctx = { params: Promise.resolve({ orgSlug }) };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    customerCreate.mockResolvedValue({ id: "c1", name: "Alice", email: "alice@example.com" });
    customerFindMany.mockResolvedValue([{ id: "c1", name: "Alice", email: "alice@example.com", _count: { projects: 0, quotations: 0, surveyAppointments: 0 } }]);

    projectCreate.mockResolvedValue({ id: "p1", name: "New Project" });
    projectFindMany.mockResolvedValue([{ id: "p1", name: "New Project", budgetLines: [], _count: { tasks: 0, quotations: 0, transactions: 0, customers: 0 } }]);

    transactionCreate.mockResolvedValue({ id: "t1", amountCents: 10000, type: "income", category: "income" });
    transactionFindMany.mockResolvedValue([{ id: "t1", amountCents: 10000 }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Customer API", () => {
    it("POST creates a customer", async () => {
      const { POST } = await import("@/app/api/org/[orgSlug]/customers/route");
      const resp = await POST(new Request(`http://localhost:3000/api/org/${orgSlug}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice", email: "alice@example.com" }),
      }), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("customer");
      expect(data.customer).toHaveProperty("id");
    });

    it("GET returns customer list", async () => {
      const { GET } = await import("@/app/api/org/[orgSlug]/customers/route");
      const resp = await GET(new Request(`http://localhost:3000/api/org/${orgSlug}/customers`), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray(data.customers)).toBe(true);
    });
  });

  describe("Project API", () => {
    it("POST creates a project", async () => {
      const { POST } = await import("@/app/api/org/[orgSlug]/projects/route");
      const resp = await POST(new Request(`http://localhost:3000/api/org/${orgSlug}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Project" }),
      }), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("project");
    });

    it("GET returns project list", async () => {
      const { GET } = await import("@/app/api/org/[orgSlug]/projects/route");
      const resp = await GET(new Request(`http://localhost:3000/api/org/${orgSlug}/projects`), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("projects");
      expect(Array.isArray(data.projects)).toBe(true);
    });
  });

  describe("Transaction API", () => {
    it("POST creates a transaction", async () => {
      const { POST } = await import("@/app/api/org/[orgSlug]/transactions/route");
      const formData = new FormData();
      formData.append("category", "income");
      formData.append("amount", "10000");
      formData.append("note", "Test");
      const resp = await POST(new Request(`http://localhost:3000/api/org/${orgSlug}/transactions`, {
        method: "POST",
        body: formData,
      }), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("success", true);
    });

    it("GET returns transaction list", async () => {
      const { GET } = await import("@/app/api/org/[orgSlug]/transactions/route");
      const resp = await GET(new Request(`http://localhost:3000/api/org/${orgSlug}/transactions`), ctx);
      expect(resp.ok).toBe(true);
      const data = await resp.json();
      expect(data).toHaveProperty("transactions");
      expect(Array.isArray(data.transactions)).toBe(true);
    });
  });
});
