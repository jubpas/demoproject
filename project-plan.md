# Project Plan: System Refactor + Demo Workspace

อัปเดตล่าสุด: 2026-05-06
เจ้าของแผน: Codex
สถานะ: Active planning

## 1. Objective

แผนรอบนี้ไม่ได้โฟกัสเพิ่ม feature ใหญ่ใหม่ แต่โฟกัส 4 เรื่องพร้อมกันแบบคุม scope:

1. จัดระบบเอกสารให้ตรงกับของจริงใน repo
2. วางแผน refactor เพื่อให้ product flow ดูแลง่ายขึ้น
3. ยกระดับ demo data ให้ใช้เดโมระบบได้ครบขึ้น
4. ประเมินความพร้อม UX/UI ของหน้าหลักแบบตรงไปตรงมา

## 2. Executive Summary

ระบบพ้น baseline auth มาเป็น product ที่มี flow หลักค่อนข้างครบแล้ว แต่ตอนนี้มีปัญหาหลัก 4 แบบ:

1. เอกสารบางส่วน drift จาก implementation จริง
2. บางไฟล์มีข้อความไทย encoding เพี้ยน
3. UI มีทั้ง shared component รุ่นใหม่และ style เดิมปนกัน
4. demo seed ยังไม่ครอบคลุม worker planning, wage planning, และ report-oriented scenarios

ข้อสรุปสำคัญ:

- ระบบใช้งานได้ในหลาย flow แล้ว
- UX/UI ยังไม่ควรถือว่าเรียบร้อยทั้งหมด
- งานรอบถัดไปควรเป็น incremental refactor ไม่ใช่ redesign ใหญ่

## 3. Page Audit

| Area | Route / File | สถานะ | ประเด็น | Action |
| --- | --- | --- | --- | --- |
| Dashboard | `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx` | Yellow | ใช้งานได้ แต่ visual language ยังไม่สุดและมี style เดิมปน shared dashboard pattern | เก็บ hierarchy, spacing, panel tone, data grouping |
| Customers | `src/app/[locale]/org/[orgSlug]/customers/page.tsx` + `src/components/org/customer-manager.tsx` | Yellow | flow ดีแล้ว แต่ยังเป็น light admin pattern ชัด | ทำ filter/action/list ให้เข้าชุดกับหน้าหลักอื่น |
| Projects | `src/app/[locale]/org/[orgSlug]/projects/page.tsx` + `src/components/org/project-manager.tsx` | Yellow | ใช้ได้จริง, มี export/filter แล้ว, แต่ UI ยังแยกภาษากับส่วนใหม่ | เก็บ consistency กับ dashboard + schedule/tasks |
| Project Detail | `src/app/[locale]/org/[orgSlug]/projects/[projectId]/page.tsx` | Yellow | ควรเช็กการอ่านข้อมูลยาวและ block สรุป | เก็บ readability และ section order |
| Tasks | `src/app/[locale]/org/[orgSlug]/projects/[projectId]/tasks/page.tsx` + `src/components/org/project-task-manager.tsx` | Yellow | อยู่ใน flow หลักแล้ว | ทบทวน density, badge, empty state |
| Schedule | `src/app/[locale]/org/[orgSlug]/projects/[projectId]/schedule/page.tsx` + `src/components/org/project-schedule-chart.tsx` | Yellow | ควรเทสกับ demo data มากขึ้น | เพิ่มข้อมูล seed ให้ schedule อ่านออก |
| Quotations | `src/app/[locale]/org/[orgSlug]/quotations/page.tsx` + `src/components/org/quotation-manager.tsx` | Yellow | flow ครบ แต่ form/list ยังหนาและใช้ tone เดิมเยอะ | ลด visual noise, เก็บ item editor และ summary panel |
| Quotation Detail | `src/app/[locale]/org/[orgSlug]/quotations/[quotationId]/page.tsx` | Yellow | ควรเช็ก print/detail readability | เก็บ hierarchy และ action placement |
| Survey Appointments | `src/app/[locale]/org/[orgSlug]/survey-appointments/page.tsx` + `src/components/org/survey-appointment-manager.tsx` | Yellow | มี hardcoded English และ separator เพี้ยนบางจุด | เก็บ locale copy และ card/readability |
| Transactions | `src/app/[locale]/org/[orgSlug]/transactions/page.tsx` + `src/components/org/transaction-manager.tsx` | Yellow | functionality ดี, metric card ชัด, แต่ list/edit area ยังหนา | เก็บ scanability และ attachment flow |
| Members | `src/app/[locale]/org/[orgSlug]/members/page.tsx` + `src/components/org/member-manager.tsx` | Yellow | ใช้งานได้ แต่มีข้อความเพี้ยนใน invite/activity area | แก้ copy, spacing, status display |
| Worker Teams | `src/app/[locale]/org/[orgSlug]/worker-teams/page.tsx` + `src/components/org/worker-team-manager.tsx` | Yellow | flow ใหม่ไปถูกทาง แต่ต้องมี demo data รองรับ | เพิ่ม seed และทบทวน state/summary card |
| Work Logs | `src/app/[locale]/org/[orgSlug]/work-logs/page.tsx` + `src/components/org/work-log-manager.tsx` | Yellow | flow ใช้ได้ แต่ต้องเทสกับข้อมูลหลากหลาย | เพิ่ม seed และ approval scenarios |
| Reports | `src/app/[locale]/org/[orgSlug]/reports/page.tsx` และ child routes | Yellow | ควรมีข้อมูล sample มากขึ้นเพื่อให้รายงานมีประโยชน์ | ขยาย demo seed ให้ report อ่านได้จริง |
| Global Search | `src/components/org/global-search.tsx` | Red | copy ไทยเพี้ยนชัดเจน, UX ยังไม่พร้อมถือเป็น polished feature | แก้ encoding, copy, keyboard/help text, result grouping |

## 4. Refactor Workstreams

### Workstream A: UI consistency

เป้าหมาย:
- ใช้ page header, panel, metric, status badge ในแนวเดียวกัน
- ลดการผสมกันระหว่าง panel รุ่นใหม่กับ class style เก่า
- คุม spacing, border radius, empty state, action bar ให้ predictable

ไฟล์หลัก:
- `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx`
- `src/components/org/customer-manager.tsx`
- `src/components/org/project-manager.tsx`
- `src/components/org/quotation-manager.tsx`
- `src/components/org/survey-appointment-manager.tsx`
- `src/components/org/transaction-manager.tsx`
- `src/components/org/member-manager.tsx`
- `src/components/org/work-log-manager.tsx`
- `src/components/org/worker-team-manager.tsx`

### Workstream B: Form/list pattern cleanup

เป้าหมาย:
- ทำ filter bar ให้รูปแบบใกล้กัน
- ทำ success/error message pattern ให้เหมือนกัน
- ทำ create/edit/list sections ให้อ่านและสแกนง่ายขึ้น

แนวทาง:
- reuse shared dashboard components เท่าที่มี
- ยังไม่สร้าง abstraction ใหม่ถ้ายังไม่จำเป็น

### Workstream C: Localization + encoding repair

เป้าหมาย:
- แก้ mojibake
- เอา hardcoded English ออกจากหน้าไทย
- ทำ copy ไทย/อังกฤษตรงกับ feature ปัจจุบัน

ไฟล์หลัก:
- `src/components/org/global-search.tsx`
- `src/components/org/member-manager.tsx`
- `src/components/org/survey-appointment-manager.tsx`
- `src/messages/th.ts`
- `src/messages/en.ts`
- `prisma/demo-seed.mjs`

### Workstream D: Demo workspace data

เป้าหมาย:
- ให้ `npm run seed:demo` สร้าง org demo ที่ใช้ walkthrough product ได้ครบ
- ทำให้ dashboard, reports, worker planning, quotations, transactions อ่านแล้วเหมือนธุรกิจจริง

### Workstream E: Print-ready documents

เป้าหมาย:
- ทำให้เอกสารที่ผู้ใช้ต้องแชร์หรือพิมพ์ออกกระดาษมีรูปแบบที่สวยและเชื่อถือได้
- ให้หน้าพิมพ์ยังคง visual language เดียวกับ product แต่ปรับให้เหมาะกับ A4 / PDF
- เริ่มจาก quotation ก่อน แล้วต่อยอดไป project summary และ report summary

ไฟล์หลักระยะแรก:
- `src/app/[locale]/org/[orgSlug]/quotations/[quotationId]/page.tsx`
- `src/components/org/print-quotation-button.tsx`

แนวทาง:
- ใช้ dedicated print layout หรือ print mode ที่ตั้งใจทำ ไม่พึ่ง browser default ล้วน ๆ
- ใช้ `@media print` และ utility classes เช่น `print:hidden`, `print:block`, `break-inside-avoid`, `break-after-page`
- จัด print header/footer, document metadata, customer block, totals block, และ signature area ให้เป็นระบบ
- รองรับการ export เป็น PDF ผ่าน browser print dialog ได้ก่อน โดยยังไม่เพิ่ม PDF engine ถ้าไม่จำเป็น

### Workstream F: AI assistant platform via vLLM API

เป้าหมาย:
- วาง AI layer ที่ช่วยสรุป วิเคราะห์ เตือน และแนะนำจากข้อมูลจริงในระบบ
- ใช้ `vLLM API` เป็น model serving layer สำหรับ inference
- เริ่มจาก use case ที่ให้มูลค่าเร็วและเสี่ยงต่ำ ก่อนขยับไป prediction และ action automation

หลักการ:
- deterministic data first, LLM second
- human-in-the-loop สำหรับสิ่งที่มีผลด้านงบ/การอนุมัติ/commit action
- auditability และ permission-aware access ต้องมีตั้งแต่ต้น
- prompt/retrieval ต้องจำกัด scope ตาม organization และ role เสมอ

สถาปัตยกรรมเบื้องต้น:
- App layer: Next.js app + route handlers
- AI service layer: helper/service สำหรับ prompt building, retrieval, normalization, risk scoring
- Model serving: `vLLM API`
- Optional retrieval/context layer: Prisma queries + normalized business summary payloads
- Logging layer: AI request log / output trace / feedback / error tracking

## 5. Demo Data Blueprint

ปัจจุบันมี:
- demo owner
- demo staff
- 1 organization
- customers บางส่วน
- 1 project หลัก
- survey appointments
- quotations
- project tasks
- transactions

สิ่งที่ต้องเพิ่ม:

### 5.1 Organization and people

- owner 1 คน
- manager 1 คน
- staff/field worker หลายคน
- membership role ที่ใช้ทดสอบ permission จริง

### 5.2 Customers

- ลูกค้าบุคคล
- ลูกค้านิติบุคคล
- ลูกค้าที่มี project แล้ว
- ลูกค้าที่มี survey แต่ยังไม่ convert

### 5.3 Projects

- project active
- project planning
- project completed
- อย่างน้อย 1 project ที่มี budget line ครบ

### 5.4 Quotations

- draft
- sent
- accepted
- rejected หรือ expired อย่างน้อย 1 รายการ

### 5.5 Survey appointments

- pending
- confirmed
- completed
- มีทั้งที่ผูก project และยังไม่ผูก project

### 5.6 Tasks and schedule

- task ที่ assigned แล้ว
- task ที่ overdue
- task ที่ done
- task ที่ผูกกับ schedule horizon ต่างกัน

### 5.7 Transactions

- income และ expense
- paid, pending, partially paid
- มีหลาย budget category
- มีรายการที่ผูก project และไม่ผูก project

### 5.8 Worker teams and wage planning

- worker team อย่างน้อย 2 ทีม
- member ที่เป็นรายวัน
- member ที่เป็นรายเดือน
- assignment ที่ active / planned / completed
- cost estimate ที่อ่านผลใน dashboard/report ได้

### 5.9 Work logs

- log ที่ pending
- log ที่ approved
- log ที่ rejected
- มี completion percent ต่างระดับ

## 5.10 Print document scope

เริ่มจากเอกสารที่มี business value สูงสุด:

1. quotation document
2. project summary / project brief
3. report summary สำหรับ budget vs actual

องค์ประกอบที่เอกสารควรมี:
- document title และเลขอ้างอิง
- organization header
- customer / project metadata
- content table ที่อ่านง่ายบนกระดาษ
- totals / status / note / sign-off area
- print-safe spacing และ page breaks

## 5.11 AI scope roadmap

### Phase A: High-value operational assistant

1. Project summary assistant
   - สรุปสถานะโครงการจาก tasks, schedule, transactions, quotations, worker assignments
   - ตัวอย่าง output:
     - โครงการนี้ติดอะไร
     - งานไหนเสี่ยง
     - งบหมวดไหนเริ่มน่าห่วง

2. Budget/risk summary assistant
   - สรุป planned vs actual
   - ระบุ budget category ที่เบี่ยงเบน
   - สร้าง narrative สำหรับ owner/manager

3. Smart alerts and digest
   - daily digest
   - weekly digest
   - budget threshold warning
   - overdue / stalled project warning
   - quotation expiry warning
   - pending approval / pending work log warning

4. Drafting assistant
   - ช่วยเขียน project note
   - ช่วยเขียน customer update
   - ช่วยเขียน report summary
   - ช่วยเขียนข้อความก่อนประชุม/ติดตามงาน

### Phase B: Predictive and decision-support assistant

1. Budget overrun risk
2. Schedule delay risk
3. Project health ranking
4. Quotation conversion / expiry insight
5. Workforce allocation suggestion
6. Wage impact estimation from daily/monthly compensation data

### Phase C: Action-oriented assistant

1. Chat with organization data
2. Create follow-up task from prompt
3. Generate executive summary from selected filters/date range
4. Explain audit log / approval queue in plain language

## 5.12 AI data sources

AI assistant ควรใช้ข้อมูลจากตาราง/flow ที่มีอยู่จริง:

- `Organization`, `Membership`
- `Customer`
- `Project`
- `ProjectTask`
- `Transaction`
- `BudgetCategory`, `ProjectBudgetLine`, `BudgetRevision`
- `Quotation`, `QuotationItem`
- `SurveyAppointment`
- `WorkerTeam`, `WorkerTeamMember`, `WorkerAssignment`, `WorkLog`
- `ApprovalRequest`
- `AuditLog`

แนวทางสำคัญ:
- ให้ query และคำนวณตัวเลขจริงใน server ก่อน
- ส่งเฉพาะ summary payload ที่จำเป็นเข้า `vLLM API`
- อย่าโยน raw database dump เข้า model โดยตรง

## 5.13 AI product surfaces

จุดที่ AI ควรไปอยู่ใน product:

1. Dashboard
   - daily briefing
   - risk summary
   - top alerts

2. Project detail
   - project summary
   - budget concern
   - next action suggestion

3. Reports
   - auto-generated narrative
   - anomaly explanation

4. Worker teams / work logs
   - manpower recommendation
   - productivity / attendance summary

5. Quotations
   - expiry watch
   - customer-ready follow-up draft

## 5.14 AI platform requirements

### Backend

- dedicated AI service helpers
- structured prompt builder
- strict organization scoping
- response schema validation
- timeout / retry / fallback behavior

### Security

- role-based access to AI endpoints
- no cross-organization context leakage
- mask or exclude sensitive fields when unnecessary
- log who asked what and when

### Auditability

- store prompt intent / context summary / response / model metadata
- distinguish generated text from system truth
- show “based on data as of …” where useful

### UX

- AI answers should cite data points from the system where possible
- warning vs estimate must be labeled clearly
- AI should suggest actions, not silently mutate business data

## 5.15 AI implementation assumptions (vLLM)

- `vLLM API` จะเป็น inference endpoint หลัก
- ระยะแรกใช้ API-compatible request/response shape เพื่อเปลี่ยน model ได้ง่าย
- model choice ยังไม่ล็อกในเอกสารนี้ แต่ควรเลือกตาม use case:
  - summary/drafting
  - risk explanation
  - retrieval-grounded Q&A
- business calculations เช่น budget usage, overrun %, overdue counts ควรคำนวณในแอปก่อนส่งให้ model สรุป

## 6. Recommended Execution Order

1. แก้ docs ให้ตรงของจริง
2. ขยาย demo seed ให้ครอบคลุม flow คนงานและรายงาน
3. เก็บ global search และ localization ที่เพี้ยน
4. เก็บ dashboard visual hierarchy
5. ทำ print-ready quotation view ให้เป็นแม่แบบ
6. เก็บ AI roadmap / architecture / guardrails ให้ครบ
7. ไล่ manager หลักทีละกลุ่ม:
   - customers
   - projects
   - quotations
   - transactions
   - members
   - worker teams / work logs
8. ปิดท้ายด้วย regression run และ update docs รอบสุดท้าย

## 7. UX/UI Readiness Verdict

คำตอบแบบใช้งานจริง:

- Functional readiness: ดีพอสำหรับเดิน flow หลัก
- Product polish readiness: ยังไม่จบ
- Demo readiness: พอได้บางส่วน แต่ยังไม่พร้อมโชว์เต็มระบบจนกว่าจะขยาย seed และเก็บ copy เพี้ยน
- Print readiness: มีฐานเริ่มต้นเฉพาะ quotation แต่ยังไม่ควรถือว่าพร้อมใช้งานระดับเอกสารทางธุรกิจ
- AI readiness: พร้อมในเชิงข้อมูลตั้งต้นหลายส่วน แต่ยังต้องมี service layer, guardrails, และ evaluation plan ก่อนเริ่ม implement จริง

ดังนั้นคำว่า "เรียบร้อย" ตอนนี้ยังตอบไม่ได้เต็มปาก

## 8. Definition of Done

งานรอบ refactor/demo data นี้ถือว่าเสร็จเมื่อ:

- docs 3 ไฟล์นี้ตรงกับ implementation
- `npm run seed:demo` สร้าง demo workspace ครบ flow หลัก
- หน้าที่มีข้อความเพี้ยนถูกแก้แล้ว
- global search ใช้งานได้โดย copy ไม่เสีย
- dashboard และ manager หลักมี visual consistency ดีขึ้นชัดเจน
- smoke test หลักผ่าน: auth, org, members, project, quotation, transaction, worker teams, work logs

## 9. Risks and Assumptions

ความเสี่ยง:
- ถ้าปรับ UI หลายหน้าในรอบเดียวโดยไม่แบ่งกลุ่ม อาจทำให้ regression ตามยาก
- ถ้าเพิ่ม demo data โดยไม่จัด role/relationship ให้ดี จะทำให้ report และ permission หลอกตา
- seed ปัจจุบันยังมีข้อความไทยเพี้ยน ถ้าไม่แก้จะทำให้ demo ดูไม่พร้อม
- ถ้าทำ print จากหน้าเว็บตรง ๆ โดยไม่จัด print layout แยก เอกสารจะดูไม่เสถียรบน A4/PDF
- ถ้ารีบเพิ่ม PDF library ก่อนตกผลึก print structure อาจเพิ่ม complexity เกินจำเป็น
- ถ้าปล่อยให้ LLM คิดตัวเลขงบเองโดยไม่มี deterministic calculation รอง จะเกิด hallucination ด้านการเงินได้ง่าย
- ถ้ายังไม่มี org-scoped retrieval ชัดเจน มีความเสี่ยงเรื่องข้อมูลหลุดข้ามองค์กร
- ถ้ายังไม่มี AI logging จะตามสาเหตุของคำแนะนำผิดได้ยาก

assumptions:
- ยังใช้ SQLite + Prisma ตามเดิม
- ยังไม่ทำ redesign ทั้งระบบ
- ยังไม่เปลี่ยน auth strategy
- ระยะแรกใช้ browser print + print CSS ก่อน แล้วค่อยประเมิน PDF engine หากมีความต้องการเอกสารที่ pixel-perfect
- AI ระยะแรกจะเริ่มจาก suggestion/read-only workflow ก่อน ไม่เริ่มจาก auto-write workflow
- `vLLM API` เป็น serving layer หลักในแผนนี้

## 10. Document Map

- [task.md](J:/devRepo/demoNextjs/demoproject/task.md): task board แบบหยิบไปทำงานต่อได้ทันที
- [project-plan.md](J:/devRepo/demoNextjs/demoproject/project-plan.md): master plan รอบ refactor/demo data
- [test-plan.md](J:/devRepo/demoNextjs/demoproject/test-plan.md): checklist ทดสอบและ regression หลังแก้
- [ai-plan.md](J:/devRepo/demoNextjs/demoproject/ai-plan.md): AI technical blueprint สำหรับ `vLLM API`, endpoint drafts, guardrails, logging, fallback, และ evaluation
