/**
 * Reset ฐานข้อมูลทั้งหมด — ลบทุกตาราง ไม่มีเหลือ
 *
 * Usage: npx tsx scripts/reset-data.ts
 */

import { prisma } from "../src/lib/db";

async function main() {
  console.log("🔄 กำลัง reset ฐานข้อมูลทั้งหมด (ลบทุกตาราง)...");

  // 1. ตารางที่ต้องลบ (เรียงจาก child → parent)
  const tables = [
    "WorkLog",
    "WorkerAssignment",
    "WorkerTeamMember",
    "WorkerTeam",
    "SurveyAppointment",
    "ApprovalRequest",
    "BudgetRevision",
    "ProjectBudgetLine",
    "BudgetCategory",
    "ProjectTask",
    "Attachment",
    "Transaction",
    "Customer",
    "Project",
    "OrganizationSubscription",
    "SubscriptionEvent",
    "SubscriptionPlan",
    "AuditLog",
    "Quotation",
    "OrganizationInvite",
    "Membership",
    "Organization",
    "PasswordResetToken",
    "AuthenticatedSession",
    "Session",
    "Account",
    "User",
  ];

  let totalDeleted = 0;

  // ใช้ transaction เพื่อให้ atomic (all or nothing)
  await prisma.$transaction(async (tx) => {
    for (const table of tables) {
      try {
        // นับจำนวนก่อนลบ
        const result: Record<string, unknown>[] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = Number(result[0]?.count ?? 0);

        // ลบข้อมูล
        await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);

        if (count > 0) {
          totalDeleted += count;
          console.log(`  ✅ ลบ ${table} (${count} records)`);
        } else {
          console.log(`  ⏭️  ${table}: ไม่มีข้อมูล`);
        }
      } catch (err: unknown) {
        console.log(`  ⚠️  ${table}: ${(err as Error).message || "ไม่พบตารางหรือไม่มีข้อมูล"}`);
      }
    }
  });

  console.log(`\n✅ เสร็จสิ้น! ลบข้อมูล ${totalDeleted} records — ฐานข้อมูลว่างหมดแล้ว`);
}

main()
  .catch((err) => {
    console.error("❌ เกิดข้อผิดพลาด:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
