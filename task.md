# Task Board: Refactor + Demo Data + UX/UI Audit

อัปเดตล่าสุด: 2026-05-06
สถานะ: วางแผนรอบปรับโครงสร้างเอกสารและจัดลำดับงาน

## เป้าหมายของรอบนี้

1. จัดแผน refactor ให้ระบบอ่านง่าย ดูแลง่าย และลด code/doc drift
2. ยกระดับ demo data ให้ครอบคลุม flow หลักของ product รวมถึงทีมคนงาน ค่าแรง งานประจำวัน และรายงาน
3. ประเมินว่า UX/UI หน้าไหนพร้อมใช้ หน้าไหนยังต้องเก็บงาน
4. อัปเดตไฟล์ `.md` ให้ทีมเปิดแล้วรู้เลยว่าควรทำอะไรต่อ

## สรุปสภาพระบบตอนนี้

- Product flow หลักมีแล้ว: dashboard, customers, projects, tasks, schedule, quotations, survey appointments, transactions, reports, members, worker teams, work logs
- โครงสร้างข้อมูลและ route หลักไปถูกทางแล้ว แต่เอกสารเดิมมี drift และบางไฟล์มีปัญหา encoding ภาษาไทย
- UI ยังไม่เรียบร้อยทั้งหมด: มี shared component รุ่นใหม่แล้ว แต่หลายหน้ายังใช้ light admin pattern เดิมปนอยู่
- Demo seed มีอยู่แล้วผ่าน `npm run seed:demo` แต่ dataset ยังไม่ครอบคลุม worker planning และยังมีข้อความไทยเพี้ยนบางจุด

## คำตอบสั้น ๆ ว่า UX/UI เรียบร้อยไหม

ยังไม่เรียบร้อยทั้งหมด

พร้อมใช้งานระดับ flow:
- customers
- projects
- quotations
- survey appointments
- transactions
- members
- worker teams
- work logs

ยังควรเก็บ UX/UI เพิ่ม:
- dashboard
- global search
- รายการ manager หลักให้ใช้ pattern เดียวกัน
- copy ภาษาไทย/อังกฤษ และข้อความที่ยัง hardcode

## หน้าและไฟล์ที่ควรแก้

### กลุ่ม 1: UX/UI consistency

- `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx`
- `src/components/org/customer-manager.tsx`
- `src/components/org/project-manager.tsx`
- `src/components/org/quotation-manager.tsx`
- `src/components/org/survey-appointment-manager.tsx`
- `src/components/org/transaction-manager.tsx`
- `src/components/org/member-manager.tsx`
- `src/components/org/work-log-manager.tsx`
- `src/components/org/worker-team-manager.tsx`

เป้าหมาย:
- จัด spacing, panel tone, filter bar, action button, empty state ให้สอดคล้องกัน
- ลดการปนกันของ style เก่าและ style ใหม่
- อิง `DESIGN.md` แบบ incremental โดยไม่รื้อทั้งระบบ

### กลุ่ม 2: Localization และ copy cleanup

- `src/components/org/global-search.tsx`
- `src/components/org/member-manager.tsx`
- `src/components/org/survey-appointment-manager.tsx`
- `src/messages/th.ts`
- `src/messages/en.ts`
- seed/demo docs ที่ยังมีข้อความไทยเพี้ยน

เป้าหมาย:
- แก้ข้อความ mojibake
- เอา hardcoded English ออกจากหน้าไทย
- ทำ label, empty state, helper text ให้ consistent

### กลุ่ม 3: Demo data / seed

- `prisma/demo-seed.mjs`
- ถ้าจำเป็น: `prisma/tes001-seed.mjs`
- เอกสารอ้างอิงใน `task.md`, `project-plan.md`, `test-plan.md`

เป้าหมาย:
- เพิ่ม dataset สำหรับ worker teams, worker assignments, work logs
- ทำ customer/project/quotation/transaction chain ให้เห็นภาพธุรกิจจริง
- ทำ dashboard และ reports มีตัวเลขอ่านแล้วสมเหตุผล
- แก้ข้อความไทยใน seed ให้เป็น UTF-8 ปกติ

### กลุ่ม 4: Print-ready documents

- `src/app/[locale]/org/[orgSlug]/quotations/[quotationId]/page.tsx`
- `src/components/org/print-quotation-button.tsx`
- ถัดไปพิจารณา:
  - `src/app/[locale]/org/[orgSlug]/projects/[projectId]/page.tsx`
  - `src/app/[locale]/org/[orgSlug]/reports/page.tsx`
  - summary/detail pages ที่ต้องแชร์ให้ลูกค้าหรือหัวหน้างาน

เป้าหมาย:
- ทำหน้าเอกสารสำหรับพิมพ์ให้ layout เรียบร้อยในกระดาษ A4
- ทำ visual hierarchy ให้ “ยังเป็น product เดียวกับหน้าเว็บ” แต่เหมาะกับเอกสาร
- จัด print CSS / print-only sections / page breaks ให้คุมได้
- เริ่มจาก quotation ก่อน แล้วค่อยขยายไป project summary และ report summary

### กลุ่ม 5: AI assistant roadmap (vLLM API)

- เอกสารอ้างอิงใน `task.md`, `project-plan.md`, `test-plan.md`
- ระยะ implement หลักในอนาคต:
  - `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx`
  - `src/app/[locale]/org/[orgSlug]/projects/[projectId]/page.tsx`
  - `src/app/[locale]/org/[orgSlug]/reports/page.tsx`
  - `src/app/api/org/[orgSlug]/*` กลุ่ม AI endpoints ที่จะเพิ่มภายหลัง
  - `src/lib/*` กลุ่ม service/helper สำหรับ prompt, retrieval, guardrails, AI audit log

เป้าหมาย:
- ทำ AI assistant ที่ผูกกับข้อมูลองค์กร/โครงการ/งบประมาณ/ทีมงานจริง
- ใช้ `vLLM API` เป็น model serving layer
- เริ่มจาก summary / risk / alert / drafting ก่อน
- ค่อยขยายไป predictive และ action-oriented assistant

## ลำดับทำงานที่แนะนำ

### Phase 1: Cleanup ที่กระทบความเข้าใจของทีมทันที

- [ ] rewrite docs ที่ drift และ encoding เพี้ยน
- [ ] audit หน้า product flow หลัก
- [ ] สรุปไฟล์ที่ควร refactor ก่อนหลัง

### Phase 2: Demo data พร้อมใช้งานจริง

- [x] ขยาย `npm run seed:demo`
- [x] เพิ่มทีมคนงาน, ค่าแรงรายวัน/รายเดือน, assignment, work log
- [x] เพิ่มข้อมูล dashboard/reports ให้มี sample ครบ
- [ ] ระบุ demo account / org slug / expected records ในเอกสาร

### Phase 3: UX/UI refactor แบบไม่รื้อระบบ

- [ ] เก็บ dashboard ให้ align กับ shared dashboard components
- [ ] ทำ filter/action/list pattern ให้คล้ายกันระหว่าง manager หลัก
- [ ] เก็บ empty state, badge, spacing, section hierarchy
- [ ] เก็บ localization และ copy ให้ครบ

### Phase 3.5: Print documents

- [ ] ออกแบบ print layout มาตรฐานของระบบ
- [ ] เก็บ quotation print view ให้สวยและพร้อมใช้งานจริง
- [ ] วาง pattern สำหรับ print header / footer / metadata / totals
- [ ] ระบุหน้าที่ควรมี print version เพิ่มในรอบถัดไป

### Phase 4: AI planning backlog

- [ ] วาง AI architecture สำหรับ `vLLM API`
- [ ] กำหนด AI use cases แยกเป็น summary / alerts / prediction / actions
- [ ] ระบุ data sources ที่ AI ใช้ได้จริงจาก schema ปัจจุบัน
- [ ] ออกแบบ permission / audit / human review flow
- [ ] เขียน evaluation checklist สำหรับ AI answers และ AI suggestions

### Phase 4: Regression check

- [ ] login/register
- [ ] onboarding/create organization
- [ ] members/invite
- [ ] project/task/schedule
- [ ] quotation/survey/transaction
- [ ] worker-teams/work-logs

## สิ่งที่ควรทำก่อนถัดไปทันที

1. เก็บ `global-search.tsx` และ copy ที่ encoding เพี้ยน
2. เก็บ `dashboard/page.tsx` ให้ visual language ชัดขึ้น
3. ค่อยไล่ manager หลักทีละกลุ่ม: customers -> projects -> quotations -> transactions
4. เพิ่ม demo credential/reference ลงเอกสารและหน้า internal note ถ้าจำเป็น
5. เริ่ม print-ready document จาก quotation detail เป็นตัวแรก
6. เก็บ AI roadmap ให้ครบก่อน implement จริง

## Progress Update: 2026-05-06

- `prisma/demo-seed.mjs` ถูกขยายจาก seed ขนาดเล็กไปเป็น demo workspace ที่ครอบคลุม:
  - users หลาย role
  - subscription + seat summary
  - 3 projects หลายสถานะ
  - 4 quotations หลายสถานะ
  - survey appointments หลายสถานะ
  - worker teams + wage model + assignments
  - work logs หลายสถานะ
  - approval requests + audit logs
  - transaction และ budget data สำหรับ dashboard/reports
- ตรวจรัน `npm run seed:demo` ผ่านแล้ว
- `src/components/org/global-search.tsx` ถูกเก็บใหม่:
  - แก้ข้อความ mojibake
  - ทำ copy ไทย/อังกฤษใน component
  - แก้ task result ให้ลิงก์เข้าหน้า tasks route ที่มีอยู่จริง
  - เปลี่ยน navigation เป็น `router.push`
- `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx` ถูกเก็บรอบแรก:
  - แก้ separator ที่เพี้ยน
  - เอา hardcoded `Net` / `Active overview` ออกให้รองรับ locale
  - ลดความเสี่ยงเรื่อง encoding/trend text
- ตรวจ `npx eslint src/components/org/global-search.tsx src/app/[locale]/org/[orgSlug]/dashboard/page.tsx` ผ่าน
- ตรวจ `npm run build` ผ่าน

## Print Direction

- เป้าหมายของ print ไม่ใช่ “เอาหน้าเว็บไปสั่งพิมพ์ตรง ๆ”
- เป้าหมายคือ “ทำ document view ที่ยังคง brand และลำดับข้อมูลเหมือนหน้าเว็บ แต่จัด typography, spacing, border, และ page break สำหรับกระดาษ”
- เริ่มจาก:
  1. quotation print
  2. project summary print
  3. report summary print

## AI Direction (Future)

AI ในระบบนี้จะไม่เริ่มจาก chatbot ลอย ๆ แต่เริ่มจาก assistant ที่ผูกกับข้อมูลจริงในระบบ และใช้ `vLLM API` เป็น serving layer

กลุ่มความสามารถที่ต้องการเก็บไว้ทำภายหลัง:

1. Summary assistant
   - สรุปสถานะโครงการ
   - สรุปงบประมาณ/กระแสเงินสด
   - Daily / weekly briefing
   - สรุปสิ่งที่ต้องโฟกัสวันนี้

2. Alert assistant
   - แจ้งเตือน budget risk
   - แจ้งเตือน overdue task
   - แจ้งเตือน quotation ใกล้หมดอายุ
   - แจ้งเตือน work log / approval queue ที่ค้าง

3. Drafting assistant
   - ช่วยเขียนสรุปส่งลูกค้า
   - ช่วยเขียน note โครงการ
   - ช่วยเขียน report summary
   - ช่วยเตรียมข้อความก่อนประชุม/ตามงาน

4. Predictive assistant
   - ทำนายงบบานปลาย
   - ทำนายความเสี่ยงส่งงานช้า
   - แนะนำโครงการที่ควรจับตา
   - แนะนำผลกระทบ manpower ต่อ timeline/cost

5. Workforce assistant
   - ช่วยประเมินการจัดทีมคนงาน
   - เปรียบเทียบค่าแรงรายวัน/รายเดือน
   - แนะนำ team/worker allocation ตามงาน

6. Action assistant
   - สร้าง task จากข้อความ
   - สร้าง follow-up note
   - สร้าง executive summary จากข้อมูลจริง
   - ตอบคำถามเชิง business ผ่าน chat with org data

หลักการสำคัญ:
- AI เป็น “ผู้ช่วยแนะนำ” ไม่ใช่ “ผู้อนุมัติแทน”
- ข้อมูลจริงและข้อความคาดการณ์ต้องแยกให้ชัด
- ทุก AI output ควร trace ได้ว่าดึงจากข้อมูลกลุ่มไหน
- งานตัวเลข/งบต้องมี deterministic calculation รองก่อนค่อยให้ LLM สรุปภาษา

## Demo Reference

- org slug: `demo-sitepro`
- owner login: `demo.owner@sitepro.local / demo1234`
- manager login: `demo.manager@sitepro.local / demo1234`
- projects seeded: 3
- quotations seeded: 4

## AI Blueprint Update: 2026-05-06

- เพิ่ม [ai-plan.md](J:/devRepo/demoNextjs/demoproject/ai-plan.md) เป็นเอกสารหลักสำหรับ AI implementation phase
- ครอบคลุม `vLLM API` integration assumptions, endpoint drafts, context strategy, guardrails, logging, fallback, และ evaluation
- ใช้ไฟล์นี้เป็น baseline ก่อนแตกงาน implement ใน `src/lib/ai/*` และ `src/app/api/org/[orgSlug]/ai/*`

## Definition of Done สำหรับรอบ refactor นี้

- เอกสาร `.md` สอดคล้องกับ implementation จริง
- `npm run seed:demo` สร้าง workspace demo ที่ใช้เดโม product flow ได้จริง
- หน้า product หลักไม่มีข้อความเพี้ยน
- UX/UI ของหน้าหลักใช้ pattern ไปในทางเดียวกัน
- flow สำคัญไม่ regression

## หมายเหตุ

- ใช้แนวทาง refactor ทีละกลุ่มงาน ไม่ redesign ใหญ่ทีเดียว
- ระหว่างเก็บ UI ให้ preserve โครงสร้าง App Router และ flow ปัจจุบัน
- ถ้าจะเพิ่ม dependency ใหม่ ต้องมีเหตุผลชัดและเช็กว่าอยู่ `dependencies` หรือ `devDependencies`
