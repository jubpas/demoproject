import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prismaSchemaSignature = "worker-assignment-v1";
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaSignature?: string;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  // ตรวจสอบว่าเป็น PostgreSQL หรือไม่
  const isPostgres = dbUrl?.includes("postgresql") ?? false;

  if (isPostgres) {
    // PrismaClient รองรับ PostgreSQL โดยตรง — ไม่จำเป็นต้องใช้ adapter
    return new PrismaClient();
  }

  // SQLite สำหรับ local development
  // ถ้าไม่มี DATABASE_URL ให้ใช้ default เป็น file:./dev.db
  const sqliteUrl = dbUrl ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({
    url: sqliteUrl,
  });
  return new PrismaClient({ adapter });
}

// Lazy initialization สำหรับ production (Next.js build จะเรียกตอน collect page data)
// ใช้ SQLite เป็น fallback ตอน build เพื่อให้ build ผ่านได้
let prismaClient: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes("postgresql")) {
      prismaClient = createPrismaClient();
    } else if (dbUrl) {
      prismaClient = createPrismaClient();
    } else {
      // Fallback SQLite สำหรับ build time
      // ใน production ต้องมี DATABASE_URL set เสมอ
      try {
        const adapter = new PrismaBetterSqlite3({
          url: "file:./dev.db",
        });
        prismaClient = new PrismaClient({ adapter });
      } catch (e) {
        // ถ้าสร้าง SQLite ไม่ได้ ก็สร้าง PrismaClient ธรรมดา
        prismaClient = new PrismaClient();
      }
    }
  }
  return prismaClient;
}

// Export function แทนที่จะ export const เพื่อให้ lazy init จริง ๆ
export const getPrisma = (): PrismaClient => {
  return getPrismaClient();
};

// Lazy export สำหรับ backward compatibility - ไม่เรียก createPrismaClient() ตอน module load
// ใช้ Proxy เพื่อ delay การสร้าง PrismaClient จนกว่าจะถูกเรียกใช้จริง
let _prismaClient: PrismaClient | undefined;

export const prisma = new Proxy(
  {} as PrismaClient,
  {
    get: (_, prop) => {
      if (!_prismaClient) {
        _prismaClient = createPrismaClient();
      }
      return (_prismaClient as any)[prop as string];
    },
    set: (_, prop, value) => {
      if (!_prismaClient) {
        _prismaClient = createPrismaClient();
      }
      (_prismaClient as any)[prop as string] = value;
      return true;
    },
  }
);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaSignature = prismaSchemaSignature;
}

export default prisma;
