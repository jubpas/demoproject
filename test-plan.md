# Test Plan: Refactor + Demo Data Regression

อัปเดตล่าสุด: 2026-05-06
สถานะ: ใช้เป็น checklist หลังเก็บ docs, seed, และ UX/UI polish

## 1. เป้าหมาย

แผนนี้ใช้ตรวจ 3 เรื่องพร้อมกัน:

1. demo seed สร้าง workspace ตัวอย่างได้จริง
2. flow หลักของ product ไม่ regression หลัง refactor
3. หน้าที่เก็บ UX/UI และ localization แล้ว ยังทำงานตรง behavior เดิม

## 2. Test Scope

ครอบคลุม:
- auth basics
- org-aware routes
- members/invite
- customers
- projects
- project tasks
- project schedule
- survey appointments
- quotations
- transactions
- reports
- worker teams
- work logs
- localization / global search
- print-ready documents
- AI assistant (future scope)

ไม่โฟกัสในรอบนี้:
- production deploy hardening
- cross-browser matrix เต็มรูปแบบ
- performance benchmark เชิงลึก

## 3. Pre-test Setup

### Commands

```bash
npm run seed:demo
npm run lint
npm run build
```

### Expected demo baseline

หลังรัน `npm run seed:demo` ควรมีอย่างน้อย:

- demo owner account
- demo staff account
- 1 demo organization
- customers หลายแบบ
- projects หลายสถานะ
- quotations หลายสถานะ
- survey appointments หลายสถานะ
- transactions income/expense
- worker teams
- worker assignments
- work logs

## 4. Smoke Checklist

### 4.1 Auth and organization

- [ ] login ด้วย demo owner ได้
- [ ] login ด้วย demo staff ได้
- [ ] redirect เข้า org ล่าสุดได้ถูก
- [ ] org routes ไม่เปิดให้ guest

### 4.2 Members and invite

- [ ] เปิดหน้า members ได้
- [ ] เห็น active members และ pending invites
- [ ] invite member ใหม่ได้
- [ ] revoke invite ได้
- [ ] เปลี่ยน role สมาชิกได้ตามสิทธิ์

### 4.3 Customers

- [ ] เปิดหน้ารายชื่อลูกค้าได้
- [ ] search/filter ทำงาน
- [ ] create customer ได้
- [ ] edit customer ได้
- [ ] delete customer ได้
- [ ] เปิด customer detail ได้

### 4.4 Projects

- [ ] เปิดหน้ารายการโครงการได้
- [ ] create/edit/delete project ได้
- [ ] filter ตาม status/customer ได้
- [ ] export CSV ได้
- [ ] เปิด project detail ได้

### 4.5 Tasks and schedule

- [ ] เปิดหน้า tasks ของ project ได้
- [ ] create/edit/update task ได้
- [ ] assigned member แสดงถูก
- [ ] schedule page อ่านข้อมูล demo ได้
- [ ] task status / progress สอดคล้องกับข้อมูลที่ seed มา

### 4.6 Survey appointments

- [ ] create appointment ได้
- [ ] edit/delete appointment ได้
- [ ] filter ตาม status/customer/project ได้
- [ ] convert appointment to quotation ได้
- [ ] copy ภาษาไทย/อังกฤษไม่เพี้ยน

### 4.7 Quotations

- [ ] create quotation ได้
- [ ] edit/delete quotation ได้
- [ ] item lines คำนวณ subtotal/tax/total ถูก
- [ ] filter ตาม status/customer/project ได้
- [ ] เปิด quotation detail ได้
- [ ] print quotation ออกมาแล้ว layout ไม่แตก

### 4.8 Transactions

- [ ] create transaction ได้
- [ ] edit/delete transaction ได้
- [ ] receipt upload flow ยังทำงาน
- [ ] metric cards แสดง income/expense/net ถูก
- [ ] filter ตาม type/payment/project/category ได้
- [ ] export CSV ได้

### 4.9 Worker teams

- [ ] เปิดหน้า worker teams ได้
- [ ] create team ได้
- [ ] add member เข้า team ได้
- [ ] ตั้งค่า wage แบบ daily/monthly ได้
- [ ] create worker assignment ได้
- [ ] estimated cost คำนวณและแสดงผลได้

### 4.10 Work logs

- [ ] เปิดหน้า work logs ได้
- [ ] create/edit/delete log ได้
- [ ] approve/reject log ได้
- [ ] filter ตาม status/team/project/date ได้
- [ ] worker/project/team mapping ถูกต้อง

### 4.11 Reports

- [ ] เปิดหน้า reports ได้
- [ ] approvals report มีข้อมูลอ่านได้
- [ ] audit report มีข้อมูลอ่านได้
- [ ] ตัวเลข dashboard/report ไม่เป็นศูนย์ทั้งหมดหลัง seed

### 4.12 Global search and localization

- [ ] global search เปิดได้
- [ ] keyboard shortcut ทำงาน
- [ ] search project/customer/quotation/task ได้
- [ ] ไม่มีข้อความไทย mojibake
- [ ] label/help text สอดคล้อง locale

### 4.13 Print documents

- [ ] ปุ่ม print ทำงาน
- [ ] ส่วน control/navigation ที่ไม่ควรพิมพ์ถูกซ่อน
- [ ] header เอกสารและ metadata แสดงครบ
- [ ] ตารางรายการไม่ล้นกระดาษ
- [ ] totals block ไม่แตกหน้าแบบอ่านยาก
- [ ] สี/เส้นขอบ/spacing ยังดูเป็นเอกสารจาก product เดียวกัน
- [ ] A4 preview ใช้งานได้ทั้งไทยและอังกฤษ

## 5. UX/UI Verification

ใช้เช็กหลังเก็บงาน visual consistency:

- [ ] page header ทุกหน้าหลักมี hierarchy ชัด
- [ ] filter bar รูปแบบใกล้กันระหว่าง manager หลัก
- [ ] empty state ไม่ล้น ไม่โล่งเกิน
- [ ] action buttons ใช้ tone สอดคล้องกัน
- [ ] alert success/error ใช้ pattern เดียวกัน
- [ ] spacing ใน card/list/form ไม่แน่นเกิน
- [ ] mobile layout ยังอ่านได้
- [ ] print layout มี hierarchy ชัดและไม่ดูเหมือนหน้าเว็บที่ถูกแคปมาเฉย ๆ

## 6. Demo Data Verification

สิ่งที่ต้องเห็นหลังปรับ `prisma/demo-seed.mjs`:

- [ ] project active อย่างน้อย 1
- [ ] project planning/completed อย่างน้อยอย่างละ 1
- [ ] quotation draft/sent/accepted และ rejected หรือ expired
- [ ] worker team อย่างน้อย 2 ทีม
- [ ] member แบบ daily และ monthly
- [ ] assignment หลาย status
- [ ] work logs pending/approved/rejected
- [ ] transactions income/expense หลาย category
- [ ] reports มีข้อมูลสัมพันธ์กันจริง

## 6.5 AI readiness verification (future)

ก่อนเริ่ม implement AI จริง ควรเช็กว่าข้อมูลตั้งต้นพร้อม:

- [ ] project/task/transaction/budget data มีความสัมพันธ์พอให้สรุปสถานะได้
- [ ] worker assignment / work log data พร้อมใช้สำหรับ workforce insight
- [ ] approval / audit data พร้อมใช้สำหรับ explanation use case
- [ ] quotation / survey flow มีข้อมูลพอสำหรับ alert และ follow-up drafting
- [ ] implementation อ้างอิงจาก [ai-plan.md](J:/devRepo/demoNextjs/demoproject/ai-plan.md) ตรงกันทั้ง endpoint, guardrails, และ fallback rules

## 7. Regression Watchlist

จุดที่ต้องระวังเป็นพิเศษ:

- Prisma seed ลบ/create demo org แล้วกระทบ user preference หรือ relation หรือไม่
- worker assignment / work log relation ทำให้หน้าเก่า query fail หรือไม่
- localization update ทำให้ key translation ตกหรือไม่
- UI refactor ทำให้ form submit path เปลี่ยนโดยไม่ตั้งใจหรือไม่
- shared styling update ทำให้หน้า detail หรือ print layout เพี้ยนหรือไม่
- AI endpoints ในอนาคตอาจเผลอเปิดข้อมูลข้าม organization ถ้า query scope ไม่ชัด
- AI summary อาจสรุปผิดถ้าปล่อยให้ model คิดตัวเลขแทนแอป

## 7.5 AI validation checklist (future)

เมื่อเริ่มทำ AI จริง ควรเพิ่ม checklist นี้:

- [ ] AI summary อ้างอิงตัวเลขจริงจากระบบ
- [ ] AI ไม่สรุปข้าม organization
- [ ] AI respect role/permission
- [ ] AI alerts ไม่เตือนซ้ำแบบ noisy เกินไป
- [ ] AI drafting แยกชัดว่าเป็น generated text
- [ ] AI prediction ระบุว่าเป็น estimate ไม่ใช่ fact
- [ ] AI response timeout/fallback ทำงาน
- [ ] vLLM API failure ไม่ทำให้หน้าหลักพังทั้งหน้า

## 8. Exit Criteria

รอบนี้ถือว่าผ่านเมื่อ:

- `npm run seed:demo` ผ่าน
- `npm run lint` ผ่าน หรือมีรายการค้างชัดเจนแยกออกจาก scope
- `npm run build` ผ่าน
- smoke checklist ผ่านใน flow หลัก
- ไม่เหลือข้อความไทยเพี้ยนในหน้าหลักที่ผู้ใช้เห็น
- quotation print view ใช้งานได้และมีคุณภาพพอสำหรับแชร์ลูกค้า/พิมพ์ PDF

สำหรับ AI phase ในอนาคต ควรถือว่าผ่านเมื่อ:

- มี org-scoped AI architecture ชัดเจน
- deterministic calculation layer อยู่ก่อน LLM summary
- AI responses ถูก audit/log ได้
- vLLM API integration มี timeout, retry, และ graceful fallback

## 9. Notes

- ถ้ามีการขยาย scope UI มากกว่าที่วางไว้ ให้ rerun checklist ทั้ง section 4 และ 5
- ถ้ามีการแก้ seed schema/relations ให้ทวน worker-teams และ work-logs เป็นพิเศษ
- ถ้าเริ่ม implement AI จริง ให้ใช้ [ai-plan.md](J:/devRepo/demoNextjs/demoproject/ai-plan.md) เป็น baseline ก่อนแตก task ย่อย
