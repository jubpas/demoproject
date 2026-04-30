<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Agent Brief

ตอบและสื่อสารกับผู้ใช้เป็นภาษาไทยเป็นหลัก

โปรเจคนี้มีโครงสร้าง Next.js อยู่แล้ว และปัจจุบันระบบขยับพ้น baseline auth มาเป็น application สำหรับบริหารงานหลายองค์กรแล้ว:

- Next.js App Router
- Tailwind CSS v4
- Prisma + SQLite
- locale routes แบบ `/th/...` และ `/en/...`
- organization-aware routes แบบ `/[locale]/org/[orgSlug]/*`
- ระบบยืนยันตัวตนแบบ email + password
- member management, invite links, super admin, และ subscription foundation ระดับต้น

## Current Project State

โครงสร้างที่มีอยู่แล้วและควรต่อยอด:

- `src/app/[locale]/login/page.tsx`
- `src/app/[locale]/register/page.tsx`
- `src/app/[locale]/forgot-password/page.tsx`
- `src/app/[locale]/reset-password/[token]/page.tsx`
- `src/app/[locale]/onboarding/create-organization/page.tsx`
- `src/app/[locale]/org/[orgSlug]/dashboard/page.tsx`
- `src/app/[locale]/org/[orgSlug]/members/page.tsx`
- `src/app/[locale]/org/[orgSlug]/settings/page.tsx`
- `src/app/[locale]/admin/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/register/route.ts`
- `src/app/api/forgot-password/route.ts`
- `src/app/api/reset-password/route.ts`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/proxy.ts`
- `prisma/schema.prisma`

ห้ามรื้อโครงสร้างใหม่ทั้งโปรเจคถ้าไม่จำเป็น ให้แก้ต่อจากของเดิมก่อน

## Foundation Completed

baseline ที่ทำเสร็จแล้วและต้องรักษาไม่ให้ regression:

1. ผู้ใช้สมัครสมาชิกได้
2. ผู้ใช้ล็อกอินด้วย email/password ได้
3. ผู้ใช้สร้าง organization แรกได้
4. route protection และ guest redirects ใช้งานได้
5. หน้า auth / onboarding / dashboard ใช้งานได้บน locale routes

## Current Priority

เป้าหมายปัจจุบันของ agent คือทำระบบที่มีอยู่ให้ครบ นิ่ง และใช้งานเป็น product ให้ได้ก่อน ส่วน production/deploy readiness ให้พักไว้จนกว่า core flow จะเรียบร้อย โดยลำดับความสำคัญคือ:

1. ทำ product flow หลักให้ครบและลื่น: dashboard, projects, tasks/schedule, customers, quotations, transactions, reports
2. ต่อยอด task/schedule polish, reporting, audit readability, filters/search, และ dashboard analytics
3. รักษา auth, invite, reset password, member management, และ super admin flow ให้เสถียรระหว่างเพิ่มฟีเจอร์
4. ปรับ UI ให้สอดคล้องกับ `DESIGN.md` โดยไม่รื้อทั้งระบบถ้าไม่จำเป็น
5. ปรับเอกสารให้ตรงกับ implementation จริงเสมอ

## Important Issues Already Observed

ถ้าจะลงมือแก้ต่อ ให้ตรวจสอบและจัดการประเด็นเหล่านี้ก่อนหรือระหว่างทำงาน:
- จำลอง Json Data Mockup เสมอ
- มี code/doc drift หลายจุด โดยเฉพาะ route structure และ current scope
- deploy production ยังมีความเสี่ยงจาก SQLite local file และการ track `dev.db`
- forgot-password flow ต้องระวัง mock reset link หลุดไปใน production
- super admin bootstrap ผ่าน `SUPER_ADMIN_EMAILS` ต้องระวังถ้ายังไม่มี email verification
- runtime packages ต้องอยู่ใน `dependencies` ให้ถูกต้องเสมอ
- ข้อความภาษาไทยหลายจุดมีอาการ encoding เพี้ยน ควรแก้ให้เป็น UTF-8 ที่อ่านได้
- metadata และบาง copy ยังต้องเก็บความเป็น product จริงมากกว่าค่าเริ่มต้น

## Implementation Preferences

- ใช้ App Router เป็นหลัก
- ใช้ Server Components เป็นค่าเริ่มต้น และใช้ Client Components เฉพาะจุดที่จำเป็น
- auth-related flow ให้เลือกแนวทางที่เรียบง่ายและดูแลง่าย
  - ใช้ Route Handler หรือ Server Action อย่างใดอย่างหนึ่งให้ชัดเจน
  - ต้อง hash password ก่อนบันทึกเสมอ
  - ต้องเช็ก email ซ้ำและส่ง error message ที่ใช้งานได้จริง
  - authorization จริงต้องตรวจใน server components / route handlers / server-side helpers ไม่พึ่ง proxy อย่างเดียว
- Tailwind ควรใช้สำหรับ layout และ form พื้นฐานแบบเรียบง่ายก่อน ยังไม่ต้องเพิ่ม UI library ถ้าไม่จำเป็น
- ถ้าเพิ่ม dependency ใหม่ ต้องอธิบายเหตุผลสั้น ๆ และเช็กว่าเป็น `dependencies` หรือ `devDependencies` ให้ถูกต้อง

## UI And Design Rules

- งาน UI / Frontend / layout / component polish ทุกครั้งต้องอ่านและใช้ `DESIGN.md` เป็น design source of truth ก่อนลงมือแก้
- `DESIGN.md` กำหนด visual direction, color tokens, typography, spacing, component tone, และ responsive behavior สำหรับงานออกแบบ
- โปรเจกต์ปัจจุบันยังมีหลายหน้าที่เป็น light admin dashboard อยู่ ให้ preserve โครงสร้างและ UX เดิมก่อน แล้วค่อยนำ principle จาก `DESIGN.md` มายกระดับแบบ incremental
- อย่าแปลงทั้งระบบเป็น dark theme หรือ redesign ใหญ่ทันที เว้นแต่ผู้ใช้สั่งชัดเจน
- ถ้าหน้าเดิมมี pattern ชัดเจน ให้ใช้ `DESIGN.md` เพื่อปรับ consistency, hierarchy, spacing, card tone, CTA, และ state styling โดยไม่ทำให้ flow เดิมพัง
- ถ้าเพิ่มหน้า UI ใหม่ ให้เริ่มจาก `DESIGN.md` ก่อน แล้ว map token เข้ากับ Tailwind class ที่มีอยู่โดยไม่เพิ่ม UI library ถ้าไม่จำเป็น

## Guardrails

- อย่าเปลี่ยน stack หลัก ถ้ายังไม่จำเป็น
- อย่าเพิ่ม auth provider ที่เกิน scope ตอนนี้
- อย่าใช้ local state management library เพิ่ม ถ้าแค่ auth form พื้นฐานยังจัดการได้ด้วย React/Next ปกติ
- อย่าสร้าง abstraction มากเกินไปใน milestone ปัจจุบัน
- ถ้าจะเตรียม deploy ให้เพื่อนเทส อย่าเปิด production link ก่อนเก็บเรื่อง reset password, database, และ secret configuration

## Minimum Done Criteria

งานถือว่าเสร็จสำหรับรอบที่โฟกัส deploy readiness เมื่อ:

- login/register/forgot-password/reset-password ยังทำงานได้
- invite flow และ member management flow ยังทำงานได้
- super admin routes และ organization routes ยังทำงานได้
- route protection ใช้งานได้ทั้ง guest routes, onboarding routes, และ org routes
- ไม่มี mock reset link leak ใน production mode
- database/configuration พร้อมสำหรับ environment ที่จะ deploy จริง
- `npm run lint` ผ่าน

## Suggested Order Of Work

1. อ่าน `DESIGN.md` ก่อนเริ่มงาน UI ทุกครั้ง และเลือก scope ที่เล็กพอจบได้ในรอบเดียว
2. เก็บ task/schedule polish, dashboard analytics, reporting, audit readability, filters/search ตามลำดับ priority ปัจจุบัน
3. ทดสอบ login/register/invite/reset-password/onboarding/super-admin flow ไม่ให้ regression ระหว่างเพิ่ม feature
4. แก้ข้อความไทยที่ encoding เพี้ยนและ sync เอกสารกับ repo
5. รัน lint/test/build ตามความเหมาะสมของงาน
6. ทำงานทุกครั้ง start-End บันทึกวันที่เวลาด้วยจะดีมาก
7. กลับมาเก็บ deploy readiness, database, secrets, และ production hardening หลัง core system เรียบร้อยกว่าเดิม

## Rules
- Complete one task group at a time.
- Do not make unrelated refactors.
- After each task group, summarize what changed, files touched, and any risks.
- If you find ambiguity, make the safest production-ready assumption and document it.
- Keep going until all tasks in the current plan are completed.
