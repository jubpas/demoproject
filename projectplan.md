# Project Plan: ระบบคนงาน เวลา ทำงาน โครงการ และรายงาน

อัปเดตล่าสุด: 2026-05-14
สถานะ: เริ่มลงมือทำ
Priority: High

---

## 1. วัตถุประสงค์

ปรับปรุงและสร้างระบบบริหารคนงาน เวลาทำงาน โครงการ และรายงาน ให้ครบ flow:

```
สร้างทีมคนงาน → มอบหมายงาน → บันทึกเวลา (check-in/out) → ดูรายงานต้นทุน
```

### หลักการสำคัญ

1. **แสดงทั้ง Estimated และ Actual** โดย Actual เด่นกว่า (ดูง่าย ตัวใหญ่กว่า)
2. **คำนวณต้นทุนจาก WorkerTeamMember.dailyWageInCents**
3. **แยกหน้า Labor Report** ออกจาก Reports page เดิม

---

## 2. สภาพระบบปัจจุบัน

### สิ่งที่สร้างไว้แล้ว

| ส่วน | Status |
|------|--------|
| WorkerTeam, WorkerTeamMember | ✅ Schema + UI + API |
| WorkerAssignment | ✅ Schema + UI + API |
| WorkLog | ✅ Schema + UI + API |
| Reports page | ⚠️ มี financial P&L แต่ไม่มี labor cost |
| Dashboard | ⚠️ ไม่มี worker metrics |

### Schema สำคัญ

```
WorkerTeamMember: compensationType, dailyWageInCents, monthlyWageInCents
WorkerAssignment: estimatedCostInCents, status (PLANNED/ACTIVE/COMPLETED/CANCELLED)
WorkLog: checkIn, checkOut, durationMinutes, completionPercent, status (PENDING/APPROVED/REJECTED)
```

---

## 3. Scope

### In Scope

1. ปรับปรุงหน้า **Worker Teams** — cost summary, assignment cards
2. ปรับปรุงหน้า **Work Logs** — ฟอร์ม 2 step, batch entry, filter
3. สร้างหน้า **Labor Report** ใหม่ — actual cost เด่น, estimated เปรียบเทียบ
4. ปรับปรุงหน้า **Dashboard** — worker metrics
5. แก้ **mojibake** ในข้อความภาษาไทย
6. เพิ่ม **sidebar link** ไป Labor Report

### Out of Scope

- Payroll/payout (จ่ายค่าแรง)
- QR check-in/out
- Notification/approval workflow
- Dark theme redesign
- Export PDF/Excel

---

## 4. Milestones

### M1: แก้ mojibake (เริ่มตรงนี้)
- แก้ข้อความไทยเพี้ยนใน `src/messages/th.ts`

### M2: ปรับปรุงหน้า Worker Teams
- เพิ่ม cost summary (estimated + actual)
- แสดง assignment cards บนหน้าทีม
- เพิ่ม filter โดยสถานะ

### M3: ปรับปรุงหน้า Work Logs
- ฟอร์ม 2 step (เลือก team/worker → กรอกเวลา)
- Batch quick-add
- Filter bar

### M4: สร้างหน้า Labor Report
- **Actual cost เด่น** — จาก WorkLog + dailyWageInCents
- **Estimated cost** — จาก WorkerAssignment.estimatedCostInCents
- ตารางแยกตาม Project และ Worker
- Filter date range + project

### M5: เพิ่ม Worker Metrics ใน Dashboard
- Active workers today, work logs this month, labor cost this month
- Recent work logs activity

### M6: Integration
- เพิ่ม sidebar link ไป Labor Report
- เชื่อม filter ระหว่างหน้า
- Lint + verification

---

## 5. Technical Approach

### Labor Cost Calculation

```
Actual Cost (เด่น):
  = sum(WorkLog.durationMinutes) → แปลงเป็นชั่วโมง → คูณ hourlyRate
  hourlyRate = dailyWageInCents / (100 * 8)  // สมมติ 8 ชม./วัน
  หรือ
  = sum(WorkLog.durationMinutes / 60 * hourlyRate)

Estimated Cost (เปรียบเทียบ):
  = sum(WorkerAssignment.estimatedCostInCents) where status = ACTIVE
```

### Data Flow

```
Server Component (page.tsx)
  ├── อ่านจาก Prisma
  ├── คำนวณ actual cost จาก WorkLog + WorkerTeamMember
  ├── คำนวณ estimated cost จาก WorkerAssignment
  ├── ส่ง props ไป Client Component
  └── ส่ง messages (copy)

Client Component (manager.tsx)
  ├── รับ data ผ่าน props
  ├── จัดการ form state
  ├── เรียก API via fetch
  └── แสดง UI
```

### New Page: Labor Report

```
src/app/[locale]/org/[orgSlug]/reports/labor/page.tsx
```

Sidebar path:
```
Reports
├── Financial (reports/page.tsx)
└── Labor Cost (reports/labor/page.tsx)  ← ใหม่
```

---

## 6. Success Criteria

### Functional
- [ ] หน้า Worker Teams แสดง cost summary
- [ ] หน้า Work Logs ฟอร์มใช้งานง่าย 2 step
- [ ] หน้า Labor Report แสดง actual cost เด่น, estimated เปรียบเทียบ
- [ ] Dashboard แสดง worker metrics
- [ ] ข้อความภาษาไทยถูกต้อง

### Technical
- [ ] Actual cost คำนวณจาก WorkLog + dailyWageInCents
- [ ] Estimated cost จาก WorkerAssignment.estimatedCostInCents
- [ ] Server Components อ่าน Prisma โดยตรง
- [ ] ไม่มี breaking change

### Verification
- [ ] Flow: สร้างทีม → member → assignment → work log → ดูรายงาน
- [ ] Filter ทำงานถูกต้อง
- [ ] `npm run lint` ผ่าน
- [ ] ไม่มี regression

---

## 7. Execution Order

```
M1 (mojibake) → M2 (worker teams) → M3 (work logs)
  → M5 (dashboard) → M4 (labor report) → M6 (integration)
```
