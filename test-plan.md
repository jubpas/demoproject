# Test Plan

## Scope

เอกสารนี้สรุปแผนทดสอบ end-to-end, regression, และ test data สำหรับระบบ `ไซต์งานโปร` ตามสถานะ implementation ปัจจุบันใน repo นี้

เป้าหมายของรอบนี้:

- ครอบคลุม auth, onboarding, org access, member invite, customer pipeline, survey, quotation, project, tasks, transactions, reports, admin/subscription
- มี test data ชุด `Tes001` ที่ใช้ซ้ำได้
- แยก known blockers ที่ต้องแก้ก่อนจึงจะเทสครบทุก flow ได้

## Current Risks And Blockers

ต้องรับรู้ก่อนเริ่มเทสเต็มชุด:

1. `worker-teams` และ `work-logs` ยังมี blocker ระดับ route implementation
   - `src/app/api/org/[orgSlug]/worker-teams/route.ts`
   - `src/app/api/org/[orgSlug]/worker-teams/[teamId]/members/route.ts`
   - `src/app/api/org/[orgSlug]/work-logs/route.ts`
   - ใช้ `requireOrganizationAccess` จาก path ที่หาไม่เจอ
   - ใช้ `getPrisma()` แต่ `src/lib/db.ts` export แค่ `prisma`

2. policy รหัสผ่านไม่ตรงกัน
   - `src/app/api/register/route.ts` กำหนดขั้นต่ำ 8 ตัวอักษร
   - `src/app/api/reset-password/route.ts` กำหนดขั้นต่ำ 6 ตัวอักษร

3. `survey -> quotation` ยังเสี่ยงสร้างซ้ำ
   - `src/app/api/org/[orgSlug]/survey-appointments/[appointmentId]/convert-to-quotation/route.ts`

4. `quotation -> project` ยังไม่ guard สถานะ quotation
   - `src/app/api/org/[orgSlug]/quotations/[quotationId]/convert-to-project/route.ts`

5. search หลายจุดมีแนวโน้มแคบเกินคาดจากการประกอบเงื่อนไขแบบ AND

6. super admin ยังอิง `SUPER_ADMIN_EMAILS` ได้แม้ไม่มี email verification

## Task Groups

1. Stabilization
   - แก้ blocker ที่ทำให้ test flow เดินไม่ครบ
   - ปรับ password policy ให้ตรงกัน
   - เพิ่ม guard กัน duplicate conversion และ invalid conversion

2. Test Data
   - สร้าง seed ชุด `Tes001`
   - ให้ rerun ได้ซ้ำและ predictable

3. Automated Regression
   - Unit tests สำหรับ business logic
   - API integration tests สำหรับ routes หลัก
   - UI smoke/component tests สำหรับหน้าหลัก

4. Manual E2E
   - เดิน full product flow ด้วยข้อมูล `Tes001`
   - ตรวจ positive, permission, และ negative cases

## End-To-End Flow Matrix

### 1. Guest And Locale

- เข้า `/` ต้อง redirect ไป `/th`
- guest เข้า `/th/login`, `/th/register`, `/th/forgot-password` ได้
- guest เข้า `/th/org/...` ต้องถูก redirect ไป login
- guest เข้า `/th/reset-password/[token]` ได้
- guest เข้า invite page ตาม flow ที่ระบบรองรับได้

### 2. Register / Login / Reset Password

- สมัครสมาชิกสำเร็จ
- สมัครด้วยอีเมลซ้ำต้องถูกปฏิเสธ
- สมัครด้วย password สั้นต้องถูกปฏิเสธ
- login สำเร็จด้วย email/password
- login ผิดรหัสผ่านต้องล้มเหลว
- forgot-password สำหรับ email ที่มีอยู่จริง
- forgot-password สำหรับ email ที่ไม่มีในระบบต้องตอบข้อความ success เหมือนกัน
- reset password ด้วย token ที่ valid สำเร็จ
- token เดิมใช้ซ้ำไม่ได้
- production mode ต้องไม่ expose `resetUrl`

### 3. Onboarding / First Organization

- ผู้ใช้ใหม่ที่ยังไม่มี org ต้องเข้า `/th/onboarding/create-organization`
- สร้าง organization แรกสำเร็จ
- ผู้สร้างต้องได้ role `OWNER`
- `lastOrganizationId` ต้องถูกตั้งค่า
- สร้างเสร็จต้อง redirect ไป `/th/org/[slug]/dashboard`

### 4. Organization Access / Route Protection

- user ที่ไม่มี membership เข้า org อื่นไม่ได้
- archived org ต้องกัน user ปกติ
- super admin ต้องเข้า org ได้แม้ไม่มี membership จริง
- login แล้วเข้า guest routes ต้องถูก redirect กลับ home target

### 5. Member Management / Invite

- OWNER สร้าง invite ได้
- ADMIN สร้าง invite role ที่อนุญาตได้
- MANAGER และ STAFF ทำไม่ได้
- invite email ซ้ำเดิมที่ยัง pending ต้องถูกกัน
- seat limit เต็มต้องสร้าง invite ไม่ได้
- accept invite ด้วย account ที่ email ตรงกันสำเร็จ
- accept invite ด้วย account คนละ email ต้องถูกปฏิเสธ
- revoke invite สำเร็จ
- เปลี่ยน role สมาชิกได้ตามสิทธิ
- ห้ามแก้ role ตัวเอง
- ห้ามลบตัวเอง
- ห้ามลบ owner คนสุดท้าย

### 6. Customers

- create customer
- list customers
- update customer
- delete customer
- validation ของ field สำคัญ
- linked counts ของ quotations / surveys / projects แสดงถูก

### 7. Survey Appointments

- create survey appointment
- update survey appointment
- cancel survey appointment
- reschedule survey appointment
- status flow รองรับ `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`
- assign ผู้รับผิดชอบได้
- convert survey เป็น quotation ได้
- ต้องมี test กัน duplicate conversion ต่อ appointment เดิม

### 8. Quotations

- create quotation ปกติ
- quotation items หลายบรรทัด
- subtotal / discount / VAT / total คำนวณถูก
- update status `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`
- quotation detail / preview เปิดได้
- convert quotation เป็น project ได้
- ถ้า convert ซ้ำต้องคืน project เดิมหรือถูกกันอย่างชัดเจน

### 9. Projects

- create project
- update project
- เปลี่ยน status project
- ผูก customer / quotation ได้ถูกต้อง
- project detail แสดง budget, transactions, tasks, related entities ครบ
- project code ต้องไม่ชนกันเมื่อ rerun seed หรือสร้างหลายรายการ

### 10. Budget Lines And Approval Flow

- OWNER/ADMIN สร้าง budget line ต่ำกว่า threshold ได้ตรง
- MANAGER สร้าง budget line ที่เกิน threshold ต้องได้ `approvalRequired`
- approver approve แล้วต้องเกิด budget line จริง
- approver reject แล้วต้องไม่เกิด budget line
- audit log และ budget revision ต้องถูกสร้าง

### 11. Tasks And Schedule

- create task
- assign task
- filter ตาม status / priority / assignee
- overdue highlight แสดงถูก
- mark `DONE` แล้ว progress ต้องเป็น 100
- STAFF/SUBCONTRACTOR update งานที่ assigned ให้ตัวเองได้ตาม flow ปัจจุบัน

### 12. Transactions

- create income transaction
- create expense transaction
- payment status รองรับ `PENDING`, `PAID`, `PARTIALLY_PAID`, `CANCELLED`
- ผูก project และ budget category ได้
- amount validation ทำงานถูก
- filter / search ทำงานถูก
- update transaction ได้ตามสิทธิ
- delete transaction ได้ตามสิทธิ
- attachment flow ต้องเทสถ้าเปิดใช้งานจริงในรอบนั้น

### 13. Reports And Audit

- reports page โหลดได้
- budget vs actual แสดงข้อมูล project และ category ถูก
- profit/loss filter ตามช่วงเวลา / project / transaction type ได้
- approvals page แสดง pending requests ถูก
- audit page แสดง before/after diff อ่านได้

### 14. Admin And Subscription

- super admin เข้า `/th/admin` ได้
- user ปกติเข้าไม่ได้
- create organization ใน admin flow
- edit organization ใน admin flow
- archive organization
- assign subscription แบบ monthly / yearly / lifetime
- seat limit override ทำงานถูก
- archived org behavior ถูกต้องกับทั้ง super admin และสมาชิกทั่วไป

### 15. Worker Teams And Work Logs

กลุ่มนี้ยังไม่ควรนับเป็น pass จนกว่า blocker route จะถูกแก้

เมื่อแก้ blocker แล้วต้องเทส:

- create worker team
- update worker team
- delete worker team
- add team member
- remove team member
- leader switch / main worker behavior
- create work log
- list work logs
- approve/reject work log

## Automated Test Layers

### Unit Tests

ไฟล์เป้าหมาย:

- `src/lib/auth.ts`
- `src/lib/organization.ts`
- `src/lib/budget.ts`
- `src/lib/approvals.ts`
- `src/lib/audit.ts`
- `src/lib/slug.ts`
- `src/lib/locales.ts`
- `src/lib/messages.ts`
- `src/lib/uploads.ts`
- `src/lib/app-context.ts`
- `src/lib/password-reset.ts`
- `src/lib/subscription.ts`

### API Integration Tests

route เป้าหมาย:

- `POST /api/register`
- `POST /api/forgot-password`
- `POST /api/reset-password`
- `POST /api/organizations`
- `POST /api/invites/[token]/accept`
- `POST /api/org/[orgSlug]/invites`
- `POST /api/org/[orgSlug]/invites/[inviteId]/revoke`
- `PATCH|DELETE /api/org/[orgSlug]/memberships/[membershipId]`
- customer routes
- survey appointment routes
- quotation routes
- project routes
- budget-line routes
- task routes
- transaction routes
- approval routes
- settings routes
- admin organization and subscription routes

### UI Smoke / Component Tests

หน้าหลักที่ควรมี smoke coverage:

- `/[locale]/login`
- `/[locale]/register`
- `/[locale]/forgot-password`
- `/[locale]/onboarding/create-organization`
- `/[locale]/org/[orgSlug]/dashboard`
- `/[locale]/org/[orgSlug]/members`
- `/[locale]/org/[orgSlug]/customers`
- `/[locale]/org/[orgSlug]/quotations`
- `/[locale]/org/[orgSlug]/projects`
- `/[locale]/org/[orgSlug]/transactions`
- `/[locale]/admin`

## Test Data: Tes001

ใช้ prefix `tes001` กับ user, org slug, และ entity สำคัญทุกตัว เพื่อค้นหาและ cleanup ได้ง่าย

### Accounts

1. Owner
   - email: `tes001.owner@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Owner`

2. Admin
   - email: `tes001.admin@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Admin`

3. Manager
   - email: `tes001.manager@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Manager`

4. Staff
   - email: `tes001.staff@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Staff`

5. Subcontractor
   - email: `tes001.subcon@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Subcon`

6. Invite Target
   - email: `tes001.invited@sitepro.local`
   - password: `Tes001pass!`
   - name: `Tes001 Invited`

7. Super Admin
   - email: `tes001.superadmin@sitepro.local`
   - password: `Tes001pass!`
   - ต้องอยู่ใน `SUPER_ADMIN_EMAILS` ตอนเทส

### Organization

- name: `Tes001 Construction Group`
- slug: `tes001-construction-group`
- approval threshold: `100000` บาท
- locale default: `th`

### Customers

1. `Tes001 ลูกค้า A`
   - company: `Tes001 Home Build Co., Ltd.`
   - phone: `0811111001`

2. `Tes001 ลูกค้า B`
   - company: `Tes001 Office Fitout Co., Ltd.`
   - phone: `0811111002`

### Survey Appointments

1. `Tes001 Survey A`
   - customer: `Tes001 ลูกค้า A`
   - status: `CONFIRMED`
   - assignedTo: `Tes001 Manager`

2. `Tes001 Survey B`
   - customer: `Tes001 ลูกค้า B`
   - status: `PENDING`

### Quotations

1. `Tes001-QT-001`
   - source: `Tes001 Survey A`
   - status: `SENT`
   - taxEnabled: `true`
   - taxRate: `7`
   - items:
     - demolition 1 lot 120000
     - interior fit-out 1 lot 350000
     - MEP 1 lot 180000

2. `Tes001-QT-002`
   - source: manual quotation
   - status: `DRAFT`
   - taxEnabled: `false`

### Projects

1. `Tes001 Project A`
   - source quotation: `Tes001-QT-001`
   - status: `ACTIVE`
   - code: `TES001-PRJ-A`

2. `Tes001 Project B`
   - source: manual
   - status: `PLANNING`
   - code: `TES001-PRJ-B`

### Budget Categories

- `Tes001 Materials`
- `Tes001 Labor`
- `Tes001 Equipment`

### Budget Lines

- Project A / Materials / 300000
- Project A / Labor / 200000
- Project A / Equipment / 100000
- approval case: Manager ขอเพิ่ม Materials จำนวนมากพอให้เกิน threshold

### Tasks

1. `Tes001 Task A`
   - project: `Tes001 Project A`
   - assignee: `Tes001 Staff`
   - status: `IN_PROGRESS`
   - priority: `HIGH`

2. `Tes001 Task B`
   - project: `Tes001 Project A`
   - assignee: `Tes001 Subcon`
   - status: `TODO`
   - priority: `MEDIUM`

3. `Tes001 Task Overdue`
   - project: `Tes001 Project A`
   - due date: ย้อนหลัง
   - status: `TODO`

### Transactions

1. Expense / Materials / `PAID` / 85000
2. Expense / Labor / `PENDING` / 42000
3. Income / Deposit / `PAID` / 180000
4. Expense / Equipment / `PARTIALLY_PAID` / 25000

### Subscription

- plan: `monthly`
- seatLimitOverride: `6`
- ใช้ทดสอบ seat limit พร้อม pending invites

### Worker Team / Work Log

ใช้หลังแก้ blocker:

- team: `Tes001 Team Alpha`
- members:
  - `Tes001 Staff` = `LEADER`
  - `Tes001 Subcon` = `MEMBER`
- work log 1: 480 นาที, `PENDING`
- work log 2: 300 นาที, `APPROVED`

## Recommended Execution Order

1. แก้ blockers ที่ทำให้ flow เทสไม่ครบ
2. สร้างหรือเตรียม seed `Tes001`
3. รัน auth + onboarding + route protection
4. รัน member invite + role management
5. รัน customer -> survey -> quotation -> project flow
6. รัน budget lines + approval flow
7. รัน tasks + schedule + transactions
8. รัน reports + audit
9. รัน admin + subscription
10. รัน worker teams + work logs หลังแก้ route blockers

## Done Criteria

งานรอบทดสอบนี้ถือว่าเสร็จเมื่อ:

1. auth, onboarding, invite, org access, super admin ไม่ regression
2. core product flow `customer -> survey -> quotation -> project -> task/transaction -> report` ผ่านครบ
3. approval flow ผ่านทั้ง approve และ reject
4. archived org, seat limit, และ permission negative cases ผ่าน
5. worker team/work log ถูกจัดการเป็น known blocker หรือผ่านครบหลังแก้
6. `npm run lint` และ test suite ที่เกี่ยวข้องผ่าน
