# Task Roadmap: Project Control First

## Goal

พัฒนาระบบ `ไซต์งานโปร` ให้เป็นแกนหลักสำหรับ `Budgeting, Accounting, Reporting, and Auditing` โดยเริ่มจากการควบคุมงบโครงการและติดตามต้นทุนจริงให้ใช้งานได้จริงก่อน

## Current Status

ทำเสร็จแล้ว:

- Auth flow พร้อม onboarding สร้าง organization แรก
- Multi-organization routing ผ่าน `orgSlug`
- Customers CRUD
- Projects CRUD
- Transactions CRUD
- Local receipt upload สำหรับ transaction
- Project Detail พร้อม linked business flow
- Project Budgeting MVP พร้อม budget lines และ budget vs actual
- Survey Appointment Queue ใช้งานได้ในระดับ CRUD เบื้องต้น
- Quotation Management ใช้งานได้ในระดับ CRUD เบื้องต้น
- Quotation Preview / Print
- Flow `Survey Appointment -> Quotation`
- Flow `Quotation -> Project`
- Reports ระดับองค์กรสำหรับ Budget vs Actual
- Audit Explorer ระดับองค์กร
- Profit/Loss Reporting พร้อม filter ตามช่วงเวลา โครงการ และประเภทธุรกรรม
- Audit Explorer แสดง before/after diff แบบอ่านง่าย พร้อม fallback raw JSON
- Approval workflow สำหรับ budget change ที่เกิน threshold
- Settings ระดับองค์กรสำหรับ `approvalThresholdInCents`
- Member Management พร้อม invite link ระดับองค์กร
- Super Admin Console สำหรับจัดการ organizations และ subscriptions เบื้องต้น
- Subscription foundation แบบ monthly / yearly / lifetime พร้อม seat tracking
- Dashboard summary cards, quick actions, และ recent transactions
- Dashboard workload pulse, project health snapshot, และ recent activity feed
- Project Task/Schedule polish พร้อม filters, overdue highlight, schedule summary และ timeline readability
- Filters/Search เพิ่มเติมใน Projects, Transactions และ Tasks

กำลังทำรอบนี้:

- เก็บ product flow หลักให้ครบและนิ่งก่อนกลับไป deploy readiness
- ปรับ UI หลัง login ให้สอดคล้องกับ `DESIGN.md` แบบ incremental โดยไม่รื้อ light admin dashboard เดิมทันที
- จัดเอกสาร task แยกจาก project plan ให้ตรงกับสภาพ repo ปัจจุบัน
- เก็บ permission layer ให้รองรับ super admin และ organization members flow ให้ชัดขึ้นในจุดที่ยังเหลือ

ถัดไปทันที:

- เก็บ Customer/Survey Appointment/Quotation flow polish ให้ลื่นขึ้น
- เพิ่ม linked action/shortcut ระหว่าง Customer -> Survey Appointment -> Quotation -> Project
- เพิ่ม filters/search ใน Quotation และ Survey Appointment ถ้ายังไม่ครบ
- เพิ่ม member audit และ owner transfer flow ในรอบถัดไป

อัปเดตล่าสุด:

- เพิ่ม `Survey Appointment Queue` ใช้งานได้ในระดับ CRUD เบื้องต้น
- เพิ่ม `Quotation Management` ใช้งานได้ในระดับ CRUD เบื้องต้น
- เพิ่มเมนูและ route สำหรับสองฟีเจอร์ใหม่แล้ว
- เพิ่มหน้า `Quotation Preview / Print` สำหรับเปิดดูเอกสารรายใบเสนอราคา
- เพิ่ม flow `Survey Appointment -> Quotation` แบบสร้าง draft quotation อัตโนมัติจากคิวนัด
- เพิ่ม flow `Quotation -> Project` แบบสร้างโครงการอัตโนมัติจากใบเสนอราคา
- เพิ่มหน้า `Project Detail` พร้อมแสดงความเชื่อมโยงกับ quotation, survey appointment และ transactions
- เพิ่ม `BudgetCategory` ระดับ organization และ `ProjectBudgetLine` ระดับโครงการ
- เพิ่มการผูก transaction กับ budget category, payment status, vendor, และ reference number
- เพิ่ม budget overview ในหน้า project detail พร้อม planned / actual / remaining / variance / usage
- เพิ่ม `BudgetRevision` และ `AuditLog` พร้อม recent history ในหน้า project detail
- เพิ่มการบันทึก audit อัตโนมัติจาก budget line และ transaction CRUD
- เพิ่มหน้า `Reports` ระดับองค์กรสำหรับดู Budget vs Actual ทุกโครงการ
- เพิ่ม summary cards, project variance table, และ expense by budget category
- เพิ่มหน้า `Audit Explorer` ระดับองค์กร พร้อม filter ตาม actor, entity, action, project และช่วงเวลา
- เพิ่ม `ApprovalRequest` และ threshold-based approval workflow สำหรับ budget change ที่เกินเกณฑ์
- เพิ่มหน้า `Approvals` พร้อม approve/reject สำหรับ OWNER/ADMIN
- เพิ่ม `approvalThresholdInCents` field ใน Organization model สำหรับตั้งค่า threshold ได้ต่อองค์กร
- สร้าง `Settings` page สำหรับอัปเดตค่า threshold การอนุมัติ
- สร้าง API route `/api/org/[orgSlug]/settings/route.ts` สำหรับอัปเดต threshold พร้อมตรวจสอบ role
- รีแฟกเตอร์ `src/lib/approvals.ts` ให้ใช้ threshold จาก `organization.approvalThresholdInCents` แทนค่า hardcoded
- อัปเดต budget-line API routes (create/update/delete) ให้ส่ง threshold จาก org ไปยัง approval logic
- เพิ่ม cost accounting foundation บางส่วนผ่าน `paymentStatus`, `vendorName`, `referenceNumber`, และ `budgetCategory`
- เพิ่ม recent budget revision และ recent audit log ในหน้า project detail
- แก้ settings form ให้ยิง `/api/org/[orgSlug]/settings` ตรงกับ route จริง และแปลงค่าบาทเป็น cents ก่อนบันทึก
- แก้หน้า approvals ให้แสดง threshold จาก `organization.approvalThresholdInCents` แทนค่า default hardcoded
- เพิ่มหน้า `Members` ระดับองค์กร พร้อมสร้าง invite link, เปลี่ยน role และลบสมาชิก
- เพิ่มหน้า public `invite/[token]` สำหรับรับคำเชิญหลัง login/register
- เพิ่ม `systemRole` สำหรับรองรับ `SUPER_ADMIN` และรองรับ bootstrap ผ่าน `SUPER_ADMIN_EMAILS`
- เพิ่มหน้า `admin` และ `admin/organizations/[organizationId]` สำหรับจัดการองค์กรทั้งระบบ
- เพิ่ม models `OrganizationInvite`, `SubscriptionPlan`, `OrganizationSubscription`, `SubscriptionEvent`
- เพิ่ม subscription foundation แบบ manual admin-managed พร้อม monthly / yearly / lifetime plans และ seat limit summary
- เพิ่มการแสดงแผนใช้งานและ seat usage ในหน้า settings ขององค์กร
- เพิ่ม `ProjectTask` พร้อม task CRUD, audit log, overdue logic และ schedule page แบบ read-only
- เพิ่ม Task/Schedule polish: task filters, overdue highlight, schedule dark technical header, status badge และ progress overlay
- เพิ่ม Dashboard Analytics รอบสอง: workload pulse, project health snapshot, over-budget metric และ recent audit activity feed
- เพิ่ม Profit/Loss Reporting ในหน้า Reports พร้อม filter ตามวันที่ โครงการ และประเภทธุรกรรม
- เพิ่ม Audit readable diff ใน Audit Explorer แทนการอ่าน JSON ดิบเป็นหลัก
- เพิ่ม filters ใน Projects และ Transactions พร้อม count และ clear filters

## Main Tasks

### 1. Project Budget Control

- เพิ่มการ lock budget เมื่อโครงการเริ่มใช้งานจริง
- ✅ เพิ่ม threshold แบบปรับค่าได้ต่อ organization — เสร็จแล้ว
  - เพิ่ม field `approvalThresholdInCents` ใน Organization
  - สร้าง Settings page และ API route สำหรับอัปเดตค่า
  - รีแฟกเตอร์ approval logic ให้ใช้ค่าจาก DB แทน hardcoded

### 2. Cost Accounting

- ✅ เพิ่ม `paymentStatus`, `vendorName`, `referenceNumber` และการผูก `budgetCategory` — เสร็จแล้วบางส่วน
- เพิ่ม payable / receivable status ให้ครบขึ้น
- เพิ่ม supplier/vendor master data
- เพิ่มเอกสารอ้างอิงทางบัญชีให้ละเอียดขึ้น

### 3. Reporting

- ✅ เพิ่ม project profit/loss report พร้อม filter ตามช่วงเวลา โครงการ และประเภทธุรกรรม
- เพิ่ม over-budget project report ให้ลึกขึ้น
- เพิ่ม export CSV/PDF ใน phase ถัดไป

### 4. Auditing

- ✅ เพิ่มแสดง before/after diff แบบอ่านง่ายขึ้น พร้อม fallback raw JSON
- ขยาย audit log ไปยัง entity อื่นให้ครบขึ้น
- เพิ่ม export audit log ใน phase ถัดไป

### 5. Filters And Search

- เพิ่ม search/filter ใน Customers
- ✅ เพิ่ม search/filter ใน Projects ตาม keyword, status, customer
- ✅ เพิ่ม search/filter ใน Transactions ตาม keyword, type, payment status, project, budget category
- ✅ เพิ่ม search/filter ใน Tasks ตาม keyword, status, priority, assignee
- รองรับ filter ตาม status, type, project, date range

### 6. Dashboard Analytics

- ✅ เพิ่ม workload pulse สำหรับงานค้าง งานเกินกำหนด และนัดหมายใกล้ถึง
- ✅ เพิ่ม project health snapshot และ over-budget project metric
- ✅ เพิ่ม recent activity feed จาก audit log
- เพิ่ม analytics visual summary ให้ลึกขึ้นในรอบถัดไป

### 6.1 UI Alignment With DESIGN.md

- ทุกงาน UI ต้องอ่าน `DESIGN.md` ก่อนเริ่มแก้
- ใช้ `DESIGN.md` เป็น source of truth สำหรับ visual direction, color tokens, typography, spacing, component tone, และ responsive behavior
- ปัจจุบัน app เป็น light admin dashboard ให้ preserve UX เดิมก่อน แล้วนำ principle จาก `DESIGN.md` มาปรับ hierarchy, spacing, card tone, CTA, และ state styling แบบ incremental
- ห้าม redesign ทั้งระบบเป็น dark theme ทันที เว้นแต่มีคำสั่งชัดเจน
- หน้าใหม่หรือ component ใหม่ควร map token จาก `DESIGN.md` เข้ากับ Tailwind class ที่มีอยู่ โดยไม่เพิ่ม UI library ถ้าไม่จำเป็น

### 7. Member Management

- ✅ เพิ่มหน้าจัดการสมาชิกองค์กร — เสร็จแล้วระดับพื้นฐาน
- ✅ แสดง role: `OWNER`, `ADMIN`, `MANAGER`, `STAFF`
- ✅ เพิ่ม invite link / change role / remove member ระดับพื้นฐาน
- เพิ่ม email delivery สำหรับ invite ในรอบถัดไป
- เพิ่ม owner transfer flow แบบชัดเจนในรอบถัดไป
- เพิ่ม member audit log สำหรับการเชิญ, เปลี่ยน role, และลบสมาชิกในรอบถัดไป

### 8. Super Admin And Billing

- ✅ เพิ่ม `SUPER_ADMIN` foundation และ admin routes ระดับระบบ
- ✅ เพิ่ม organization management ระดับระบบแบบ create/edit/archive
- ✅ เพิ่ม subscription foundation แบบ monthly / yearly / lifetime
- ✅ เพิ่ม seat tracking โดยนับสมาชิก + pending invites
- เก็บ bootstrap safety และ production guardrails ของ super admin
- เพิ่ม payment gateway integration ในรอบถัดไป
- เพิ่ม checkout / self-service billing flow สำหรับ owner องค์กรในรอบถัดไป
- เพิ่ม custom plan management และ billing history ให้ลึกขึ้นในรอบถัดไป

### 9. Deploy Readiness And Security

สถานะ: พักไว้ก่อนจนกว่า core product flow จะเรียบร้อยกว่าเดิม

- ปิดการส่ง `resetUrl` กลับ client ใน production เมื่อ email delivery ไม่พร้อม
- วางแผนหรือย้าย database จาก SQLite local file ไปยัง hosted database สำหรับการ deploy จริง
- หยุด track `dev.db` ใน workflow deployment และแยก local development data ออกจาก shared environment
- ตรวจ `AUTH_SECRET`, `NEXTAUTH_SECRET`, `APP_URL`, `DATABASE_URL`, และ mail provider env ให้ครบ
- ทบทวน super admin bootstrap ผ่าน `SUPER_ADMIN_EMAILS` ให้ปลอดภัยขึ้น

### 10. Transaction Attachments

- เพิ่ม replace receipt ตอนแก้ transaction
- เพิ่ม remove receipt แบบแยกไฟล์
- รองรับหลายไฟล์ต่อ transaction ใน phase ถัดไป

### 11. Quotation Management

- เพิ่มหน้าออกใบเสนอราคา
- รองรับผูกกับลูกค้าและโครงการ
- เพิ่มรายการงาน/วัสดุ/ค่าแรงหลายบรรทัด
- คำนวณ subtotal, discount, VAT, total
- ค่าเริ่มต้น VAT ต้องเป็นปิด แต่เปิดใช้งานได้
- เมื่อเปิด VAT ให้ใช้ 7% เป็นค่าเริ่มต้น และอนุญาตให้แก้เปอร์เซ็นต์ได้
- เตรียมหน้า preview/print สำหรับส่งลูกค้า

### 12. Survey Appointment Queue

- เพิ่มหน้าคิวสำรวจ / นัดลูกค้า
- ผูกกับ customer และ project ได้ในอนาคต
- เก็บสถานที่ วันเวลา ผู้รับผิดชอบ และข้อมูลติดต่อ
- รองรับสถานะ `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`
- ใช้เป็นต้นทางของ flow ก่อนออก quotation และเปิด project

## Recommended Order

1. Customer/Survey/Quotation Flow Polish
2. Quotation And Survey Appointment Filters
3. Member Management Enhancements
4. Transaction Attachment Improvements
5. Cost Accounting Expansion
6. Invite Email Delivery
7. Owner Transfer And Member Audit Log
8. UI Alignment รอบต่อเนื่องด้วย `DESIGN.md`
9. Deploy Readiness And Security
10. Payment Gateway And Billing Checkout

## Notes

- ยึดแนวทาง project-control-first บน light admin dashboard และใช้ `DESIGN.md` เป็น design source of truth สำหรับงาน UI
- Desktop ต้องอ่านง่ายเป็น table-first
- Mobile ต้อง fallback เป็น cards และ stacked sections
- ทุก task ใหม่ต้องอัปเดตไฟล์นี้และ `project-plan.md` เสมอ
- business flow ที่ต้องรองรับระยะถัดไปคือ `Customer -> Survey Appointment -> Quotation -> Project -> Transactions`
- ✅ `approval threshold settings` ทำเสร็จแล้ว (2026-04-28)
- ✅ `settings endpoint mismatch` และ `approval threshold display` เก็บแล้ว (2026-04-28)
- ✅ task/schedule polish, dashboard analytics, profit/loss report, audit diff readability และ filters หลักทำเสร็จแล้วในรอบ product polish ล่าสุด
- มี demo seed script ใช้งานได้ผ่าน `npm run seed:demo` สำหรับสร้าง workspace ตัวอย่างเพื่อทดสอบ dashboard, reports, tasks, quotations และ survey flow
- implementation รอบต่อไปควรเก็บ Customer/Survey Appointment/Quotation flow polish และ filters ของ business flow ฝั่งเอกสาร
- เอกสารต้องสะท้อนว่า approval workflow และ threshold settings ทำเสร็จแล้ว
- มี code/doc drift เรื่อง i18n: เอกสารเดิมอ้าง `next-intl` แต่โค้ดจริงใช้ message modules แบบ `.ts`
- implementation รอบถัดไปควรเก็บ technical alignment ควบคู่กับ feature work
