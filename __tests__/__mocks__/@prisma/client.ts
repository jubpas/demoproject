import { vi } from "vitest";

function createMockModel() {
  return {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  };
}

export const mockPrismaClient = {
  user: createMockModel(),
  account: createMockModel(),
  session: createMockModel(),
  verificationToken: createMockModel(),
  authenticatedSession: createMockModel(),
  organization: createMockModel(),
  membership: createMockModel(),
  userPreference: createMockModel(),
  customer: createMockModel(),
  project: createMockModel(),
  transaction: createMockModel(),
  budgetCategory: createMockModel(),
  projectBudgetLine: createMockModel(),
  budgetRevision: createMockModel(),
  auditLog: createMockModel(),
  approvalRequest: createMockModel(),
  attachment: createMockModel(),
  quotation: createMockModel(),
  quotationItem: createMockModel(),
  surveyAppointment: createMockModel(),
  passwordResetToken: createMockModel(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $on: vi.fn(),
  $transaction: vi.fn(async (fn: (tx: typeof mockPrismaClient) => Promise<void>) => fn(mockPrismaClient)),
  $use: vi.fn(),
};

const PrismaClient = vi.fn(() => mockPrismaClient);

export { PrismaClient };
export default PrismaClient;
