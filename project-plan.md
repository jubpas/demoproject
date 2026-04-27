# Project Plan: ไซต์งานโปร

## Vision

สร้างระบบบริหารจัดการโครงการรับเหมาก่อสร้างแบบหลายบริษัท/หลายทีม โดยมีเป้าหมายหลักเป็น `Budgeting, Accounting, Reporting, and Auditing` สำหรับการควบคุมโครงการไซต์งานจริง

## Confirmed Decisions

- ชื่อระบบ: `ไซต์งานโปร`
- รองรับหลายบริษัท / หลายทีม ตั้งแต่แรก
- รองรับ role ตั้งแต่แรก
- รองรับภาษาไทย / English
- ใช้ locale route แบบ `/th/...` และ `/en/...`
- หลังสมัครสมาชิกสำเร็จ ให้ไปหน้า `สร้างบริษัทแรก`
- อัปโหลดใบเสร็จเก็บ local ก่อนใน MVP
- หลีกเลี่ยงการใช้ `currentOrganizationId` ใน cookie เป็นแหล่งอ้างอิงสิทธิ์หลัก
- ใช้ `orgSlug` ใน URL เป็น context หลักขององค์กร
- ใช้แนวทาง `Project-control-first` เป็นลำดับการพัฒนาหลักก่อนขยายไปบัญชีและ audit เต็มรูปแบบ

## Route Architecture

โครงสร้าง route หลักที่ต้องการ:

```txt
/th/login
/en/login

/th/register
/en/register

/th/onboarding/create-organization
/en/onboarding/create-organization

/th/org/[orgSlug]/dashboard
/en/org/[orgSlug]/dashboard

/th/org/[orgSlug]/customers
/en/org/[orgSlug]/customers

/th/org/[orgSlug]/projects
/en/org/[orgSlug]/projects

/th/org/[orgSlug]/transactions
/en/org/[orgSlug]/transactions

/th/org/[orgSlug]/quotations
/en/org/[orgSlug]/quotations

/th/org/[orgSlug]/survey-appointments
/en/org/[orgSlug]/survey-appointments
```

แนวทาง:

- หน้าในระบบทั้งหมดอยู่ภายใต้ `[locale]`
- ข้อมูลภายในองค์กรอยู่ภายใต้ `org/[orgSlug]`
- ทุกหน้าที่อยู่ใต้ `org/[orgSlug]` ต้องตรวจ session และ membership จาก database เสมอ

## Security Model

หลักการ:

- ใช้ auth ที่มีอยู่ต่อยอดจาก `next-auth`
- proxy ใช้สำหรับ pre-routing checks และ redirects
- authorization จริงต้องตรวจใกล้ data source ใน server components, route handlers, และ server-side helpers
- ห้ามเชื่อค่า organization จาก client โดยตรงโดยไม่ตรวจ membership

กฎพื้นฐาน:

1. ผู้ใช้ที่ไม่ login ห้ามเข้าหน้า protected
2. ผู้ใช้ที่ login แล้วแต่ยังไม่มี organization ต้องไป onboarding
3. ผู้ใช้ที่มี organization แล้วไม่ควรย้อนกลับหน้า onboarding โดยไม่จำเป็น
4. ทุกการเข้าถึงข้อมูล organization ต้องตรวจว่า user เป็นสมาชิกจริง

## Roles

เริ่มต้นด้วย 4 roles:

- `OWNER`
- `ADMIN`
- `MANAGER`
- `STAFF`

สิทธิ์ phase แรก:

- `OWNER`: จัดการองค์กร สมาชิก ลูกค้า โครงการ ธุรกรรม
- `ADMIN`: จัดการลูกค้า โครงการ ธุรกรรม
- `MANAGER`: จัดการลูกค้า โครงการ ธุรกรรม
- `STAFF`: ดูข้อมูลที่เกี่ยวข้อง และเพิ่มรายการธุรกรรม/แนบใบเสร็จในขอบเขตที่อนุญาต

## Data Model Plan

ต้องเพิ่ม/ปรับ schema หลักดังนี้:

### Existing

- `User`
- `Account`
- `Session`
- `VerificationToken`

### New Models

- `Organization`
- `Membership`
- `UserPreference`
- `Customer`
- `Project`
- `Transaction`
- `Attachment`
- `Quotation`
- `QuotationItem`
- `SurveyAppointment`
- `BudgetCategory`
- `ProjectBudgetLine`
- `BudgetRevision`
- `AuditLog`
- `ApprovalRequest`

### Key Relationships

```txt
User many-to-many Organization ผ่าน Membership
Organization 1-to-many Customer
Organization 1-to-many Project
Organization 1-to-many Transaction
Project belongs-to Organization
Project belongs-to Customer (optional ในบางช่วง)
Project 1-to-many ProjectBudgetLine
Transaction belongs-to Organization
Transaction belongs-to Project (optional)
Transaction belongs-to BudgetCategory (optional)
Attachment belongs-to Organization
Attachment belongs-to Transaction (optional)
Quotation belongs-to Organization
Quotation belongs-to Customer
Quotation belongs-to Project (optional)
SurveyAppointment belongs-to Organization
SurveyAppointment belongs-to Customer
SurveyAppointment belongs-to Project (optional)
BudgetCategory belongs-to Organization
ProjectBudgetLine belongs-to Project
ProjectBudgetLine belongs-to BudgetCategory
```

### Required Organization Fields

- `id`
- `name`
- `slug`
- `description?`
- `createdById`
- timestamps

### Required Membership Fields

- `userId`
- `organizationId`
- `role`
- unique composite on `[userId, organizationId]`

### Required UserPreference Fields

- `userId`
- `lastOrganizationId?`
- `locale?`

## i18n Plan

แนวทางที่ใช้:

- ใช้ `next-intl`
- เก็บข้อความแปลใน `src/messages/th.json` และ `src/messages/en.json`
- สร้าง helper กลางใน `src/i18n/`

ข้อความควรแยก namespace อย่างน้อย:

- `common`
- `auth`
- `onboarding`
- `dashboard`
- `customers`
- `projects`

## UI Direction

ธีมหลัก:

- น้ำเงินเข้มเป็น primary
- แดงใช้กับ action สำคัญและ accent
- รองรับมือถือ 100%
- auth pages ใช้ modern gradient + glassmorphism
- app pages ใช้ dashboard layout ที่อ่านง่ายและใช้งานได้จริง

## Receipt Upload Plan

ช่วง MVP:

- เก็บไฟล์ใน local storage ภายใต้ `public/uploads/`
- เก็บ path ที่เปิดผ่าน browser ได้ใน database
- จำกัดชนิดไฟล์เป็น image ก่อน เช่น `jpg`, `jpeg`, `png`, `webp`
- จำกัดขนาดไฟล์ เช่น 5MB

ตัวอย่าง path:

```txt
/public/uploads/organizations/{organizationId}/receipts/{filename}
```

## Implementation Phases

### Phase 1: Foundation

1. ตรวจและเพิ่ม dependencies ที่จำเป็น
2. จัด route เป็น `[locale]`
3. ทำ proxy ให้รองรับ locale + auth + onboarding redirects
4. เพิ่ม schema สำหรับ multi-organization
5. ทำ onboarding สร้างบริษัทแรก
6. ปรับ metadata และชื่อระบบเป็น `ไซต์งานโปร`

### Phase 2: App Shell

1. สร้าง auth layout และ app layout
2. ทำ language switcher
3. ทำ organization-aware navigation
4. ปรับ global styles โทนน้ำเงิน-แดง responsive

### Phase 3: Dashboard MVP

1. สร้าง dashboard ภายใต้ `orgSlug`
2. แสดง summary เบื้องต้น
3. รองรับ empty states

### Phase 4: Customers MVP

1. รายการลูกค้า
2. เพิ่มลูกค้า
3. แก้ไขลูกค้า
4. ลบลูกค้า

### Phase 5: Projects MVP

1. รายการโครงการ
2. เพิ่มโครงการ
3. แก้ไขโครงการ
4. ดูรายละเอียดโครงการขั้นต่ำ

### Phase 6: Transactions MVP

1. เพิ่มรายรับ/รายจ่าย
2. แนบรูปใบเสร็จ
3. แสดงรายการล่าสุดใน dashboard

### Phase 7: Quotation MVP

1. สร้างรายการใบเสนอราคา
2. ผูกลูกค้าและโครงการ
3. เพิ่ม quotation items หลายบรรทัด
4. รองรับส่วนลด
5. รองรับ VAT แบบ opt-in
6. ทำหน้า preview/print

### Phase 8: Survey Appointment MVP

1. สร้างคิวนัดสำรวจ
2. ผูกลูกค้า
3. ระบุวันเวลาและผู้รับผิดชอบ
4. จัดการสถานะนัดหมาย
5. เตรียม flow ต่อไปยัง quotation หรือ project

### Phase 9: Project Budgeting MVP

1. เพิ่ม budget categories ระดับ organization
2. เพิ่ม budget lines ระดับ project
3. ผูก actual expense ผ่าน transaction กับ budget category
4. แสดง budget vs actual ใน project detail
5. แสดง remaining budget, variance, usage

### Phase 10: Cost Accounting Foundation

1. เพิ่ม payment status
2. เพิ่ม vendor / payee
3. เพิ่ม reference number
4. เตรียมข้อมูลสำหรับ payable / receivable และรายงานบัญชี

### Phase 11: Reporting And Auditing

1. สร้าง budget vs actual report
2. สร้าง profit/loss report ระดับโครงการ
3. เพิ่ม audit log สำหรับข้อมูลสำคัญ
4. เพิ่ม approval workflow ใน phase หลัง

## Quotation Plan

Route ที่ต้องมี:

```txt
/[locale]/org/[orgSlug]/quotations
/[locale]/org/[orgSlug]/quotations/new
/[locale]/org/[orgSlug]/quotations/[quotationId]
```

โครงสร้างข้อมูลหลัก:

- `Quotation`
- `QuotationItem`

ฟิลด์สำคัญของ `Quotation`:

- `organizationId`
- `customerId`
- `projectId?`
- `quotationNumber`
- `status`
- `issueDate`
- `validUntil`
- `subtotalInCents`
- `discountInCents`
- `taxEnabled`
- `taxRate`
- `taxInCents`
- `totalInCents`
- `note`

ฟิลด์สำคัญของ `QuotationItem`:

- `quotationId`
- `description`
- `quantity`
- `unit`
- `unitPriceInCents`
- `totalInCents`
- `sortOrder`

สถานะใบเสนอราคา:

- `DRAFT`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`

พฤติกรรม VAT ที่ยืนยันแล้ว:

- ค่าเริ่มต้นต้องเป็นปิด (`taxEnabled = false`)
- เมื่อเปิด VAT ให้ใช้ `7%` เป็นค่าเริ่มต้น
- ผู้ใช้สามารถแก้เปอร์เซ็นต์ VAT ได้
- คำนวณ VAT จากยอดหลังหักส่วนลด

สูตรคำนวณ:

```txt
Subtotal = รวมรายการทั้งหมด
Discount = ส่วนลด
Taxable Amount = Subtotal - Discount
VAT = Taxable Amount × taxRate
Total = Taxable Amount + VAT
```

## Survey Appointment Plan

Route ที่ต้องมี:

```txt
/[locale]/org/[orgSlug]/survey-appointments
/[locale]/org/[orgSlug]/survey-appointments/new
/[locale]/org/[orgSlug]/survey-appointments/[appointmentId]
```

ข้อมูลหลักของ `SurveyAppointment`:

- `organizationId`
- `customerId`
- `projectId?`
- `assignedToId?`
- `title`
- `location`
- `contactName`
- `contactPhone`
- `scheduledStart`
- `scheduledEnd`
- `status`
- `note`

สถานะนัดหมาย:

- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `RESCHEDULED`

## Business Flow

flow ธุรกิจที่ต้องรองรับใน milestone ถัดไป:

```txt
Customer
-> Survey Appointment
-> Quotation
-> Project
-> Project Budget
-> Transactions
-> Profit/Loss Dashboard
-> Budget Vs Actual Reporting
-> Audit Trail
```

## Progress Log

### 2026-04-27

Completed:

- วาง route ใหม่เป็น `/[locale]/org/[orgSlug]/*`
- ทำ login/register/onboarding flow พร้อม redirect ตามสถานะ organization
- เพิ่ม schema รองรับ multi-organization และ role
- ทำ dashboard shell และ UI responsive โทนน้ำเงิน-แดง
- ทำ Customers CRUD
- ทำ Projects CRUD

Completed in current round:

- เพิ่มหน้า `transactions` ภายใต้แต่ละ organization
- เพิ่ม Transactions CRUD เบื้องต้น
- เพิ่ม local receipt upload และผูก `Attachment` กับ `Transaction`
- อัปเดต dashboard ให้แสดงธุรกรรมล่าสุด
- เพิ่มหน้า `survey-appointments` และ CRUD เบื้องต้น
- เพิ่มหน้า `quotations` และ CRUD เบื้องต้นพร้อม VAT opt-in
- เพิ่มหน้า `quotations/[quotationId]` สำหรับ preview/print ใบเสนอราคา
- เพิ่ม action แปลง `survey-appointment` เป็น `quotation draft`
- เพิ่ม action แปลง `quotation` เป็น `project`
- เพิ่มหน้า `projects/[projectId]` สำหรับแสดงรายละเอียดโครงการและข้อมูลที่เชื่อมโยง
- เพิ่ม `BudgetCategory` ระดับ organization พร้อม default categories สำหรับทุกองค์กร
- เพิ่ม `ProjectBudgetLine` ระดับโครงการ พร้อม create/update/delete API
- เพิ่มการผูก `Transaction` เข้ากับ budget category, payment status, vendor, และ reference number
- เพิ่ม budget control section ในหน้า `projects/[projectId]` เพื่อดู planned vs actual และงบคงเหลือ
- เพิ่ม `BudgetRevision` สำหรับเก็บประวัติการเปลี่ยนงบในระดับโครงการ
- เพิ่ม `AuditLog` สำหรับเก็บ create/update/delete ของ budget line และ transaction
- เพิ่ม recent revision history และ recent audit log ในหน้า `projects/[projectId]`
- เพิ่มหน้า `reports` ระดับองค์กรสำหรับสรุป Budget vs Actual ทุกโครงการ
- เพิ่ม expense breakdown ตาม budget category และตัวชี้วัดโครงการเกินงบ
- เพิ่มหน้า `reports/audit` ระดับองค์กรสำหรับค้นหา audit log ตาม actor, entity, action, project, และช่วงเวลา
- เพิ่ม `ApprovalRequest` และหน้า `reports/approvals` สำหรับอนุมัติ budget change ที่เกิน threshold
- เพิ่ม approve/reject API สำหรับคำขออนุมัติและเชื่อมการบันทึก audit เมื่อมีการอนุมัติหรือปฏิเสธ

Current implemented routes:

```txt
/th/org/[orgSlug]/dashboard
/th/org/[orgSlug]/customers
/th/org/[orgSlug]/projects
/th/org/[orgSlug]/transactions
/th/org/[orgSlug]/survey-appointments
/th/org/[orgSlug]/quotations

/en/org/[orgSlug]/dashboard
/en/org/[orgSlug]/customers
/en/org/[orgSlug]/projects
/en/org/[orgSlug]/transactions
/en/org/[orgSlug]/survey-appointments
/en/org/[orgSlug]/quotations
```

Suggested next phase:

1. ทำรายงาน profit/loss ระดับองค์กรและระดับโครงการ
2. ปรับ audit log ให้แสดง diff ที่อ่านง่ายขึ้น
3. เพิ่ม approval threshold settings ต่อ organization
4. ทำ filters/search สำหรับ customers/projects/transactions
5. เพิ่ม summary กำไร/ขาดทุนและกราฟบน dashboard
6. เพิ่ม action เชื่อมโยงกลับจาก project ไปหา quotation / survey มากขึ้น
7. เพิ่ม member management ตาม role

## Step-by-Step Execution Order

ลำดับที่ควรทำจริงในโค้ด:

1. เพิ่มเอกสารแผนงานนี้
2. ตรวจ dependency/runtime placement
3. ปรับ Prisma schema และ generate client
4. เพิ่ม locale routing + message files
5. ย้ายหน้า auth/app เข้าโครงสร้างใหม่
6. ปรับ auth flow และ onboarding
7. ทำ proxy ให้สอดคล้องกับ route ใหม่
8. ทำ app shell UI
9. ทำ dashboard
10. ทำ customers
11. ทำ projects
12. ทำ lint และเก็บงาน

## Definition Of Done For Current Milestone

milestone นี้ถือว่าเสร็จเมื่อ:

- login/register ยังทำงานได้
- หลัง register ไปหน้า create organization
- ผู้ใช้สร้าง organization แรกได้
- route แบบ `/th/...` และ `/en/...` ใช้งานได้
- dashboard ภายใต้ `/[locale]/org/[orgSlug]/dashboard` ใช้งานได้
- มีโครงสร้างพร้อมต่อยอด customers/projects
- `npm run lint` ผ่าน
