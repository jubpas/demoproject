<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Agent Brief

ตอบและสื่อสารกับผู้ใช้เป็นภาษาไทยเป็นหลัก

โปรเจคนี้มีโครงสร้าง Next.js อยู่แล้ว และเป้าหมายระยะแรกคือทำระบบพื้นฐานให้ใช้งานได้จริงก่อน:

- Next.js App Router
- Tailwind CSS v4
- Prisma + SQLite
- หน้า `login` / `register` / `dashboard`
- ระบบยืนยันตัวตนแบบ email + password

## Current Project State

โครงสร้างที่มีอยู่แล้วและควรต่อยอด:

- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/proxy.ts`
- `prisma/schema.prisma`

ห้ามรื้อโครงสร้างใหม่ทั้งโปรเจคถ้าไม่จำเป็น ให้แก้ต่อจากของเดิมก่อน

## Primary Goal

เป้าหมายแรกของ agent คือทำ baseline auth flow ให้ครบและเสถียร:

1. ผู้ใช้สมัครสมาชิกได้
2. ผู้ใช้ล็อกอินด้วย email/password ได้
3. หน้า dashboard ถูกป้องกันสำหรับผู้ที่ยังไม่ล็อกอิน
4. ผู้ใช้ที่ล็อกอินแล้วถูก redirect ออกจาก `login` / `register`
5. UI พื้นฐานดูสะอาด ใช้งานง่าย และ responsive

## Important Issues Already Observed

ถ้าจะลงมือแก้ต่อ ให้ตรวจสอบและจัดการประเด็นเหล่านี้ก่อนหรือระหว่างทำงาน:
- จำลอง Json Data Mockup เสมอ
- `register` page ตอนนี้ยังไม่มี flow สร้างผู้ใช้จริง
- มีการ import auth packages ในโค้ด แต่ dependency ใน `package.json` ยังดูไม่ครบ
- runtime packages บางตัวถูกวางไว้ใน `devDependencies` ทั้งที่ถูกใช้ตอน runtime
- ข้อความภาษาไทยหลายจุดมีอาการ encoding เพี้ยน ควรแก้ให้เป็น UTF-8 ที่อ่านได้
- `layout.tsx`, `page.tsx`, และข้อความ metadata ยังเป็นค่าเริ่มต้นจาก create-next-app บางส่วน

## Implementation Preferences

- ใช้ App Router เป็นหลัก
- ใช้ Server Components เป็นค่าเริ่มต้น และใช้ Client Components เฉพาะจุดที่จำเป็น
- สำหรับ register flow ให้เลือกแนวทางที่เรียบง่ายและดูแลง่าย
  - ใช้ Route Handler หรือ Server Action อย่างใดอย่างหนึ่งให้ชัดเจน
  - ต้อง hash password ก่อนบันทึกเสมอ
  - ต้องเช็ก email ซ้ำและส่ง error message ที่ใช้งานได้จริง
- Tailwind ควรใช้สำหรับ layout และ form พื้นฐานแบบเรียบง่ายก่อน ยังไม่ต้องเพิ่ม UI library ถ้าไม่จำเป็น
- ถ้าเพิ่ม dependency ใหม่ ต้องอธิบายเหตุผลสั้น ๆ และเช็กว่าเป็น `dependencies` หรือ `devDependencies` ให้ถูกต้อง

## Guardrails

- อย่าเปลี่ยน stack หลัก ถ้ายังไม่จำเป็น
- อย่าเพิ่ม auth provider ที่เกิน scope ตอนนี้
- อย่าใช้ local state management library เพิ่ม ถ้าแค่ auth form พื้นฐานยังจัดการได้ด้วย React/Next ปกติ
- อย่าสร้าง abstraction มากเกินไปใน milestone แรก

## Minimum Done Criteria

งานถือว่าเสร็จสำหรับ milestone นี้เมื่อ:

- สมัครสมาชิกได้จริง
- ล็อกอินได้จริง
- ออกจากระบบได้
- route protection ใช้งานได้
- หน้า home/login/register/dashboard ใช้งานได้โดยไม่พัง
- `npm run lint` ผ่าน

## Suggested Order Of Work

1. ตรวจ dependency และ env ที่จำเป็นสำหรับ auth
2. ทำ registration flow ให้ครบ
3. ตรวจ login flow ให้ทำงานกับข้อมูลจาก Prisma จริง
4. ปรับ middleware / redirect behavior
5. เก็บ UI พื้นฐานด้วย Tailwind
6. แก้ข้อความไทยที่ encoding เพี้ยน
7. รัน lint และทดสอบ flow หลัก
