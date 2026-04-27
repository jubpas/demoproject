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

กำลังทำรอบนี้:

- รีแฟกเตอร์ UI หลัง login ให้เป็น Light Admin Dashboard
- จัดเอกสาร task แยกจาก project plan เพื่อใช้ตามงานรอบถัดไป

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

## Main Tasks

### 1. Project Budget Control

- เพิ่มการ lock budget เมื่อโครงการเริ่มใช้งานจริง
- เพิ่ม threshold แบบปรับค่าได้ต่อ organization ในรอบถัดไป

### 2. Cost Accounting

- แยก transaction categories ให้เป็นระบบมากขึ้น
- เพิ่ม payable / receivable status
- เพิ่ม supplier/vendor master data ในรอบถัดไป
- เพิ่มเอกสารอ้างอิงทางบัญชีให้ละเอียดขึ้น

### 3. Reporting

- เพิ่ม project profit/loss report
- เพิ่ม expense breakdown by category
- เพิ่ม over-budget project report
- เพิ่ม export CSV/PDF ใน phase ถัดไป

### 4. Auditing

- ขยาย audit log ไปยัง project และ quotation
- เพิ่มแสดง before/after diff แบบอ่านง่ายขึ้น
- เพิ่ม export audit log ใน phase ถัดไป

### 5. Transaction Attachments

- เพิ่ม replace receipt ตอนแก้ transaction
- เพิ่ม remove receipt แบบแยกไฟล์
- รองรับหลายไฟล์ต่อ transaction ใน phase ถัดไป

### 6. Filters And Search

- เพิ่ม search/filter ใน Customers
- เพิ่ม search/filter ใน Projects
- เพิ่ม search/filter ใน Transactions
- รองรับ filter ตาม status, type, project, date range

### 7. Dashboard Analytics

- เพิ่ม profit/loss summary
- เพิ่ม analytics section, recent activity, overview cards
- เพิ่ม visual summary แบบเบา ๆ โดยยังไม่เพิ่ม chart library ถ้าไม่จำเป็น

### 8. Member Management

- เพิ่มหน้าจัดการสมาชิกองค์กร
- แสดง role: `OWNER`, `ADMIN`, `MANAGER`, `STAFF`
- เพิ่ม invite/change role/remove member ในรอบถัดไป

### 9. Quotation Management

- เพิ่มหน้าออกใบเสนอราคา
- รองรับผูกกับลูกค้าและโครงการ
- เพิ่มรายการงาน/วัสดุ/ค่าแรงหลายบรรทัด
- คำนวณ subtotal, discount, VAT, total
- ค่าเริ่มต้น VAT ต้องเป็นปิด แต่เปิดใช้งานได้
- เมื่อเปิด VAT ให้ใช้ 7% เป็นค่าเริ่มต้น และอนุญาตให้แก้เปอร์เซ็นต์ได้
- เตรียมหน้า preview/print สำหรับส่งลูกค้า

### 10. Survey Appointment Queue

- เพิ่มหน้าคิวสำรวจ / นัดลูกค้า
- ผูกกับ customer และ project ได้ในอนาคต
- เก็บสถานที่ วันเวลา ผู้รับผิดชอบ และข้อมูลติดต่อ
- รองรับสถานะ `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`
- ใช้เป็นต้นทางของ flow ก่อนออก quotation และเปิด project

## Recommended Order

1. Cost Accounting
2. Reporting
3. Auditing
4. Project Budget Control
5. Filters And Search
6. Transaction Attachments
7. Dashboard Analytics เพิ่มเติม
8. Member Management

## Notes

- ยึดแนวทาง project-control-first บน light admin dashboard
- Desktop ต้องอ่านง่ายเป็น table-first
- Mobile ต้อง fallback เป็น cards และ stacked sections
- ทุก task ใหม่ต้องอัปเดตไฟล์นี้และ `project-plan.md` เสมอ
- business flow ที่ต้องรองรับระยะถัดไปคือ `Customer -> Survey Appointment -> Quotation -> Project -> Transactions`
- implementation รอบต่อไปควรเพิ่ม profit/loss report, approval threshold settings, และ audit diff ที่อ่านง่ายขึ้น
