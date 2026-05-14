/**
 * Reset ฐานข้อมูลทั้งหมด — ลบทุกตาราง ไม่มีเหลือ
 *
 * Usage: npx tsx scripts/reset-data.ts
 */

import { prisma } from "../src/lib/db";

async function main() {
  console.log("🔄 กำลัง reset ฐานข้อมูลทั้งหมด (ลบทุกตาราง)...");

  // 1. ปิด foreign key checks ชั่วคราว
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF");

  // 2. ตารางที่ต้องลบ (เรียงจาก child → parent)
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

  for (const table of tables) {
    try {
      // นับจำนวนก่อนลบ (SQLite คืน BigInt ต้องแปลงเป็น number)
      const result: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = Number(result[0]?.count ?? 0);

      // ลบข้อมูล
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);

      if (count > 0) {
        totalDeleted += count;
        console.log(`  ✅ ลบ ${table} (${count} records)`);
      } else {
        console.log(`  ⏭️  ${table}: ไม่มีข้อมูล`);
      }
    } catch (err: any) {
      console.log(`  ⚠️  ${table}: ${err.message || "ไม่พบตารางหรือไม่มีข้อมูล"}`);
    }
  }

  // 3. เปิด foreign key กลับ
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");

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
