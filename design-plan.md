# Design Migration Plan

วันที่จัดทำ: 2026-05-01

## เป้าหมาย

ปรับ UI ของโปรเจกต์ให้สอดคล้องกับ `DESIGN.md` แบบ incremental โดยไม่รื้อ flow เดิม และไม่ทำให้ auth, organization, admin, dashboard, projects, tasks, customers, quotations, transactions และ reports regression

## Design Direction จาก DESIGN.md

- ใช้ dark technical aesthetic เป็นแกนหลัก
- ใช้สีหลัก `#0007cd` สำหรับ primary CTA, active state และ spotlight glow เท่านั้น
- ใช้พื้นหลังหลัก near-black `#0f0f0f`
- ใช้ card surface `#181818`, elevated surface `#222222`
- ลดการใช้ shadow หนัก เปลี่ยนเป็น brightness-step elevation
- CTA ใช้ radius 8px ไม่ใช้ pill/rounded ใหญ่เกินจำเป็น
- Card ใช้ radius 12-16px
- Typography ใช้ sans family เดียวทั้งระบบ โดย fallback เป็น font ที่มีอยู่ในโปรเจกต์ก่อน
- Code/terminal surface ใช้ mono font
- Responsive ต้องทำงานดีบน mobile, tablet, desktop

## สถานะปัจจุบันที่พบ

- `src/app/globals.css` ยังใช้ token เดิมแนว blue/red mesh และ glass effect
- หน้า auth มี dark/glass aesthetic อยู่แล้ว แต่ยังไม่ตรงกับ `DESIGN.md` เพราะใช้ gradient blue-red, radius ใหญ่ และ shadow หนัก
- organization/admin layout มี sidebar dark แต่ content area ยังเป็น light admin (`bg-slate-100`, `bg-white`)
- dashboard shared components ยังเป็น light theme:
- `src/components/dashboard/page-header.tsx`
- `src/components/dashboard/metric-card.tsx`
- `src/components/dashboard/data-panel.tsx`
- `src/components/dashboard/status-badge.tsx`
- business components หลายตัวใช้ class ซ้ำ เช่น `rounded-2xl`, `bg-white`, `bg-slate-50`, `border-slate-200`, `bg-blue-600`
- ควรเปลี่ยนจาก shared components ก่อน แล้วค่อยไล่หน้าเฉพาะทาง

## หลักการทำงาน

1. เปลี่ยนแบบ incremental ไม่ redesign ทั้งระบบในครั้งเดียว
2. เริ่มจาก design tokens และ shared dashboard components
3. รักษา layout, data flow, route protection และ authorization เดิม
4. ไม่เพิ่ม UI library
5. ไม่เพิ่ม dependency เว้นแต่จำเป็นจริง
6. ถ้าต้องใช้ font `abcDiatype` ให้ใช้ fallback ก่อน เพราะเป็น licensed font ตาม `DESIGN.md`
7. ใช้ Tailwind class เดิมเท่าที่ทำได้ และเพิ่ม utility class เฉพาะที่ช่วยลด drift
8. หลังจบแต่ละ phase ต้องรัน lint และตรวจ responsive

## Phase 1: Token Foundation

ไฟล์หลัก:
- `src/app/globals.css`
- `src/app/layout.tsx`

งาน:
- ปรับ CSS variables ให้ map กับ `DESIGN.md`:
- `--background: #0f0f0f`
- `--foreground: #ffffff`
- `--surface: #181818`
- `--surface-elevated: #222222`
- `--surface-strong: #2a2a2a`
- `--border: #222222`
- `--border-strong: #333333`
- `--primary: #0007cd`
- `--primary-active: #0005a3`
- `--primary-glow: #1a26ff`
- `--muted: #a8a8a8`
- `--muted-soft: #666666`
- `--success: #33d17a`
- `--error: #ff4d4d`
- ปรับ `body` background ให้เป็น near-black พร้อม subtle blue spotlight
- ลดหรือเลิกใช้ red mesh จาก `.bg-mesh`
- ปรับ `.glass-panel` และ `.glass-panel-strong` ให้เป็น surface-based มากกว่า glass/shadow-heavy
- ตรวจว่า font fallback ใน `layout.tsx` ยังปลอดภัยและไม่เพิ่ม external dependency

Acceptance:
- ทุกหน้าพื้นหลังไม่เพี้ยน
- auth pages ยังอ่านง่าย
- ไม่มี class/token ที่ทำให้สี contrast ต่ำชัดเจน

## Phase 2: Shared Dashboard Components

ไฟล์หลัก:
- `src/components/dashboard/page-header.tsx`
- `src/components/dashboard/metric-card.tsx`
- `src/components/dashboard/data-panel.tsx`
- `src/components/dashboard/status-badge.tsx`
- `src/components/dashboard/nav-link.tsx`

งาน:
- เปลี่ยน `PageHeader` เป็น dark elevated hero/card ตาม `feature-card` หรือ `spotlight-glow-card`
- เปลี่ยน `MetricCard` เป็น dark surface card ไม่มี shadow หนัก
- ปรับ `DataPanel` ให้ใช้ dark card, dark divider และ text hierarchy ตาม `DESIGN.md`
- ปรับ `StatusBadge` ให้เป็น dark badge pill โดยยังรักษา tone semantic
- ปรับ `NavLink` ให้ใช้ `#0007cd` สำหรับ active state และ surface hover
- ลด radius จาก `rounded-2xl/3xl` ไปสู่ `rounded-lg/xl` ตาม `DESIGN.md`

Acceptance:
- dashboard/admin/projects ที่ใช้ shared components เปลี่ยนภาพรวมทันที
- active nav ชัดเจน
- status badge อ่านออกทุก tone
- mobile layout ไม่แตก

## Phase 3: App Shell

ไฟล์หลัก:
- `src/app/[locale]/org/[orgSlug]/layout.tsx`
- `src/app/[locale]/admin/layout.tsx`

งาน:
- เปลี่ยน content area จาก `bg-slate-100` เป็น dark canvas
- ปรับ top context card ให้เป็น dark surface
- ปรับ sidebar ให้ใช้ token เดียวกับ `DESIGN.md`
- ปรับ sign out button ให้ยังเป็น destructive แต่ไม่หลุดโทน
- ตรวจ responsive sidebar บน mobile

Acceptance:
- organization layout และ admin layout ดูเป็นระบบเดียวกัน
- ไม่มี light panel ขนาดใหญ่หลงเหลือใน shell
- user/admin action ยังใช้งานได้เหมือนเดิม

## Phase 4: Auth And Onboarding Polish

ไฟล์หลัก:
- `src/components/auth/login-form.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/components/auth/onboarding-form.tsx`
- `src/components/auth/invite-acceptance.tsx`
- auth page wrappers ใน `src/app/[locale]/*`

งาน:
- ปรับ gradient CTA จาก blue-red เป็น solid `#0007cd`
- ลด radius และ shadow ให้ตรง `DESIGN.md`
- ปรับ input ให้เป็น `surface-card` + 8px radius
- เก็บ dark/auth split layout เดิมไว้
- เพิ่มกลิ่น terminal/technical เฉพาะ hero panel แบบไม่กระทบ form flow
- ตรวจ validation/error/success states

Acceptance:
- login/register/reset/invite/onboarding ยังใช้งานได้
- CTA สอดคล้องกันทุก auth flow
- ไม่มี red accent เป็น brand color ยกเว้น error state

## Phase 5: Business Pages And Managers

ไฟล์หลัก:
- `src/components/org/project-manager.tsx`
- `src/components/org/customer-manager.tsx`
- `src/components/org/survey-appointment-manager.tsx`
- `src/components/org/quotation-manager.tsx`
- `src/components/org/transaction-manager.tsx`
- `src/components/org/member-manager.tsx`
- `src/components/org/project-task-manager.tsx`
- `src/components/org/project-budget-manager.tsx`
- reports pages ใต้ `src/app/[locale]/org/[orgSlug]/reports`

งาน:
- ไล่เปลี่ยน form inputs, filter bars, empty states, list rows, edit panels ให้เป็น dark surface
- ปรับ primary buttons เป็น `#0007cd`
- ปรับ secondary buttons เป็น elevated surface
- ปรับ destructive buttons ให้ใช้ semantic error แบบไม่กลายเป็น brand color
- ลด radius ให้อยู่ใน scale 8/12/16px
- ทำทีละกลุ่ม feature เพื่อลด regression

Acceptance:
- projects/customers/tasks/schedule/quotations/transactions/reports อ่านง่ายบน dark theme
- filter/search ยังคงใช้งานได้
- empty state ชัดเจน
- form focus state มองเห็นได้

## Phase 6: Homepage Or Redirect Surface

ไฟล์ที่เกี่ยวข้อง:
- `src/app/[locale]/page.tsx`
- routes ที่เป็น guest/landing ถ้ามีเพิ่มในอนาคต

งาน:
- ปัจจุบัน locale home redirect ไป flow ตาม auth context จึงยังไม่ต้องสร้าง marketing homepage
- หากต้องมี landing page ภายหลัง ให้ใช้ `terminal-mockup-grid` เป็น hero anchor ตาม `DESIGN.md`

Acceptance:
- ไม่มี regression กับ redirect logic ปัจจุบัน
- ไม่เพิ่ม landing page ถ้า product flow ยังเป็น priority หลัก

## Phase 7: QA And Verification

คำสั่งตรวจ:
- `npm run lint`
- `npm run build` ถ้า scope เปลี่ยน layout/theme หลายจุด
- ตรวจ manual responsive บน mobile/tablet/desktop

Flow ที่ต้อง smoke test:
- login
- register
- forgot password
- reset password
- invite acceptance
- onboarding create organization
- org dashboard
- projects
- tasks/schedule
- customers
- quotations
- transactions
- reports
- member management
- super admin

## ความเสี่ยง

- การเปลี่ยน dark theme ทั้ง app อาจทำให้บาง text ใช้ `text-slate-900` บน dark surface แล้ว contrast ต่ำ
- business components มี inline class จำนวนมาก อาจต้องไล่แก้หลายรอบ
- auth pages มี aesthetic ใกล้เคียง dark อยู่แล้ว แต่สีและ radius ยังไม่ตรง `DESIGN.md`
- `abcDiatype` เป็น licensed font จึงควรใช้ fallback ก่อน เว้นแต่มีไฟล์ font จริง
- ถ้าเปลี่ยน shared components มากเกินไปในครั้งเดียว อาจกระทบหลายหน้า ควรทำพร้อมตรวจ smoke test

## ลำดับแนะนำ

1. ทำ Phase 1 และ Phase 2 ก่อน เพราะเป็น foundation และ shared components
2. ทำ Phase 3 เพื่อให้ shell ทั้ง org/admin เข้าธีม
3. ทำ Phase 4 เพื่อให้ auth flow ตรง brand โดยไม่แตะ logic
4. ทำ Phase 5 ทีละ feature group
5. ปิดท้ายด้วย Phase 7 ทุกครั้งหลังจบกลุ่มงาน

## Definition Of Done

- UI ใช้ token และ visual language จาก `DESIGN.md`
- ไม่มี light admin surface หลักหลงเหลือในหน้าที่ migrate แล้ว
- CTA ใช้สีหลักเดียว `#0007cd`
- radius และ elevation สอดคล้องกับ `DESIGN.md`
- auth และ organization flow ไม่ regression
- responsive ไม่แตก
- `npm run lint` ผ่าน
