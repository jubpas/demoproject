import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaSchemaSignature = "worker-assignment-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaSignature?: string;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

  if (dbUrl?.startsWith("postgresql://") || dbUrl?.startsWith("postgres://")) {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: dbUrl }),
    });
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: dbUrl ?? "file:./dev.db",
    }),
  });
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
