import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaSchemaSignature = "worker-assignment-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaSignature?: string;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

  if (!dbUrl) {
    throw new Error("DATABASE_URL is required for the PostgreSQL Prisma schema.");
  }

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: dbUrl }),
    });
  }

  throw new Error(
    "DATABASE_URL must be a PostgreSQL TCP connection string starting with postgres:// or postgresql://. " +
      "The current value is not compatible with @prisma/adapter-pg.",
  );
}

export const prisma: PrismaClient =
  globalForPrisma.prisma && globalForPrisma.prismaSchemaSignature === prismaSchemaSignature
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaSignature = prismaSchemaSignature;
}

export default prisma;
