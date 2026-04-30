# การเทสระบบ (Unit Tests)

## สิ่งที่ติดตั้งแล้ว

- **Vitest** (test framework)
- **@vitest/coverage-v8** (coverage)
- **@testing-library/react** (component testing)
- **@testing-library/jest-dom** (DOM matchers)
- **@testing-library/user-event** (user interaction)
- **jsdom** (DOM environment)

## โครงสร้างไฟล์

```
__tests__/
├── setup.ts                           # Config เริ่มต้น + jest-dom matchers
├── smoke.test.ts                      # Smoke test (เช็คว่าระบบทำงาน)
├── __mocks__/
│   └── @prisma/
│       └── client.ts                  # Mock Prisma Client สำหรับเทส
```

## วิธีรันเทส

```bash
# รันเทส (watch mode)
npm test

# รันเทส (ครั้งเดียว)
npm run test:run

# รันเทส + coverage
npm run test:coverage
```

## Mock Prisma Client

ไฟล์ `__tests__/__mocks__/@prisma/client.ts` สร้าง mock model สำหรับทุก model ใน schema:

- `user` - ผู้ใช้ (ล็อกอิน/สมัครสมาชิก)
- `account` - OAuth accounts
- `session` - NextAuth sessions
- `verificationToken` - Verification tokens
- `authenticatedSession` - Sessions แบบ extended
- `organization` - องค์กร (multi-tenant)
- `membership` - สมาชิกในองค์กร
- `userPreference` - การตั้งค่าผู้ใช้
- `customer` - ลูกค้า
- `project` - โครงการก่อสร้าง
- `transaction` - รายการการเงิน
- `budgetCategory` - หมวดหมู่ budget
- `projectBudgetLine` - Budget line ในโครงการ
- `budgetRevision` - ประวัติการเปลี่ยนแปลง budget
- `auditLog` - บันทึกการกระทำ
- `approvalRequest` -คำขอ approval
- `attachment` - ไฟล์แนบ
- `quotation` - ใบเสนอราคา
- `quotationItem` - รายการในใบเสนอราคา
- `surveyAppointment` - นัดหมายสำรวจ

แต่ละ model มี method: `create`, `findUnique`, `findFirst`, `findMany`, `count`, `update`, `upsert`, `delete`, `deleteMany`, `updateMany`

## แผนการเทส (Phase 1 - Setup เสร็จแล้ว)

### Phase 2: Unit Tests - Business Logic (`src/lib/`)

| ไฟล์ที่เทส | สิ่งที่ต้องเทส |
|----------|--------------|
| `lib/auth.ts` | ✅/❌ Credentials validate, JWT callback, Session callback, bcrypt compare |
| `lib/organization.ts` | ✅ สร้าง org, ✅ ตรวจสอบบทบาท, ✅ role permissions |
| `lib/budget.ts` | ✅ คำนวณ budget, ✅ validation, ✅ revision logic |
| `lib/approvals.ts` | ✅ Approve/reject flow, ✅ permission checks |
| `lib/audit.ts` | ✅ Log creation, ✅ format before/after JSON |
| `lib/slug.ts` | ✅ Slug generation, ✅ edge cases |
| `lib/locales.ts` | ✅ Locale validation, ✅ fallback behavior |
| `lib/messages.ts` | ✅ Localization messages |
| `lib/uploads.ts` | ✅ File validation, ✅ type/size limits |
| `lib/app-context.ts` | ✅ Auth guard, ✅ redirect logic |

### Phase 3: Unit Tests - API Routes (`src/app/api/`)

| Route | Methods | สิ่งที่ต้องเทส |
|-------|---------|--------------|
| `api/register/route.ts` | POST | สมัครสมาชิกสำเร็จ, Email ซ้ำ, Password สั้นเกิน, ข้อมูลไม่ครบ |
| `api/auth/[...nextauth]/route.ts` | POST | Login สำเร็จ, Password ผิด, User ไม่พบ |
| `api/organizations/route.ts` | POST, GET | สร้าง org, ดึงรายการ org, Auth guard |
| `api/org/[orgSlug]/customers/route.ts` | GET, POST, PUT, DELETE | CRUD customers + Auth + Org membership |
| `api/org/[orgSlug]/projects/route.ts` | GET, POST, PUT, DELETE | CRUD projects + Status transitions |
| `api/org/[orgSlug]/transactions/route.ts` | GET, POST, PUT, DELETE | CRUD transactions + Amount validation |
| `api/org/[orgSlug]/quotations/route.ts` | GET, POST, PUT, DELETE | CRUD quotations + Status flow |
| `api/org/[orgSlug]/survey-appointments/route.ts` | GET, POST, PUT, DELETE | CRUD appointments |
| `api/org/[orgSlug]/approval-requests/**/*.ts` | POST | Approve/Reject + Permission checks |
| `api/org/[orgSlug]/budget-lines/**/*.ts` | GET, POST, PUT, DELETE | Budget line operations |
| `api/org/[orgSlug]/settings/route.ts` | GET, PUT | Org settings |

### Phase 4: Component Tests

| Component | สิ่งที่ต้องเทส |
|----------|--------------|
| `login/page.tsx` | ✅ ฟอร์มกรอก email/password, ✅ Submit → redirect, ✅ Error handling |
| `register/page.tsx` | ✅ ฟอร์มสมัครสมาชิก, ✅ Password confirm match, ✅ Submit → redirect |
| `dashboard/page.tsx` | ✅ Auth guard (ไม่ล็อกอิน → redirect), ✅ แสดงข้อมูลเมื่อล็อกอิน |

### Phase 5: Integration Tests

| สิ่งที่ต้องเทส | รายละเอียด |
|----------|-----------|
| Full Register → Login Flow | สมัคร → ล็อกอิน → เข้า dashboard |
| Middleware Protection | ไม่ล็อกอินเข้า dashboard ไม่ได้, ล็อกอินแล้วไม่เข้า login/register |
| API + DB End-to-End | API Route → Prisma → SQLite (ใช้ in-memory DB) |

## ตัวอย่างการเขียนเทส

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/lib/db";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("slugify", () => {
  it("should convert string to slug", async () => {
    // Mock prisma.slugify
    const mockSlugify = vi.fn(() => "my-slug");

    const result = mockSlugify("My Slug!");
    expect(result).toBe("my-slug");
  });

  it("should handle empty string", async () => {
    const mockSlugify = vi.fn(() => "");
    const result = mockSlugify("   ");
    expect(result).toBe("");
  });
});
```

## สิ่งที่ต้องทำต่อ (Phase 2+)

1. สร้างไฟล์เทสสำหรับ `lib/slug.ts`
2. สร้างไฟล์เทสสำหรับ `lib/locales.ts`
3. สร้างไฟล์เทสสำหรับ `lib/organization.ts`
4. สร้างไฟล์เทสสำหรับ API routes หลัก (`api/register/route.ts`)
5. เพิ่มเทสสำหรับ component (`login`, `register`, `dashboard`)
