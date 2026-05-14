# Task Board: ปรับปรุงระบบคนงาน เวลา ทำงาน เชื่อมโยงกับโครงการและรายงาน

อัปเดตล่าสุด: 2026-05-14
สถานะ: เริ่มงาน
Priority: High

---

## สรุป

แผนงานปรับปรุงระบบบริหารคนงาน เวลาทำงาน โครงการ และรายงาน ให้เชื่อมโยงครบ flow:
สร้างทีม → มอบหมายงาน → บันทึกเวลา → ดูรายงานต้นทุน

---

## Task List

### Milestone 1: ปรับปรุงหน้า Worker Teams (เสร็จแล้ว)

#### Task 1.1: เพิ่ม cost summary section
- **สถานะ:** done
- **Expected outcome:** หน้า Worker Teams แสดง total estimated cost, active assignments, total headcount
- **Dependencies:** ไม่มี
- **Verification:** เห็น metric cards ด้านบนของหน้า

**Steps:**
1. เพิ่ม query ใน `worker-teams/page.tsx` เพื่อ collect cost data ✅
2. ส่ง cost summary ไปยัง `worker-team-manager.tsx` ✅
3. เพิ่ม metric cards section ใน Client Component ✅

---

#### Task 1.2: แสดง assignment cards บนหน้าทีม
- **สถานะ:** done
- **Expected outcome:** แต่ละทีมเห็น assigned projects และ estimated cost
- **Dependencies:** Task 1.1
- **Verification:** คลิกดูทีมแล้วเห็น assignments

**Steps:**
1. เพิ่ม expandable section ในแต่ละทีม card ✅
2. แสดง assignment list พร้อม project name, dates, status, cost ✅
3. เพิ่ม link ไปยัง project page ✅

---

#### Task 1.3: เพิ่ม filter assignments by status
- **สถานะ:** done
- **Expected outcome:** กรอง assignments by ACTIVE/PLANNED/COMPLETED/CANCELLED
- **Dependencies:** Task 1.2
- **Verification:** filter ทำงานถูกต้อง

**Steps:**
1. เพิ่ม filter bar ใน `worker-team-manager.tsx` ✅
2. Filter assignments state ✅
3. อัปเดต cost summary ตาม filter ✅

---

#### Task 1.4: แก้ข้อความภาษาไทยใน Worker Teams
- **สถานะ:** done
- **Expected outcome:** ข้อความไทยใน worker-team-manager.tsx ถูกต้อง
- **Dependencies:** ไม่มี
- **Verification:** หน้าไม่มี text เพี้ยน

**Note:** ตรวจสอบแล้ว — ข้อความไทยใน workerTeam section ถูกต้องทั้งหมด ไม่มี mojibake

---

### Milestone 3: ปรับปรุงหน้า Work Logs

#### Task 3.1: ปรับฟอร์มเป็น 2 step
- **สถานะ:** done
- **Expected outcome:** Step 1: เลือก team/worker, Step 2: กรอก time/details
- **Dependencies:** Task 1.4
- **Verification:** ฟอร์มใช้งานง่ายขึ้น

**Steps:**
1. เพิ่ม step state ใน `work-log-manager.tsx` ✅
2. Step 1: dropdown เลือก team → เลือก worker ✅
3. Step 2: date, checkIn, checkOut, notes, completionPercent ✅
4. เพิ่ม summary section แสดงข้อมูลสรุปก่อน submit ✅
5. เพิ่ม step navigation (ถัดไป/ย้อนกลับ) ✅

---

#### Task 2.2: เพิ่ม batch quick-add
- **สถานะ:** pending
- **Expected outcome:** บันทึก work log หลายวันในครั้งเดียว
- **Dependencies:** Task 2.1
- **Verification:** เลือก date range แล้วบันทึกพร้อมกันได้

**Steps:**
1. เพิ่ม date range picker (start date → end date)
2. สร้าง form สำหรับ repeat entry
3. ส่ง multiple POST requests

---

#### Task 2.3: เพิ่ม filter bar
- **สถานะ:** pending
- **Expected outcome:** กรองตาม date range, project, team, status
- **Dependencies:** Task 2.2
- **Verification:** filter ทำงานถูกต้อง

**Steps:**
1. เพิ่ม filter bar ใน `work-logs/page.tsx` (server-side)
2. เพิ่ม filter ใน `work-log-manager.tsx` (client-side)
3. ใช้ search params สำหรับ URL-based filtering

---

#### Task 2.4: แก้ข้อความภาษาไทยใน Work Logs
- **สถานะ:** pending
- **Expected outcome:** ข้อความไทยใน work-log-manager.tsx ถูกต้อง
- **Dependencies:** Task 5.1

---

### Milestone 4: เพิ่ม Worker Metrics ใน Dashboard

#### Task 4.1: เพิ่ม worker metric cards
- **สถานะ:** pending
- **Expected outcome:** Dashboard แสดง active workers today, total work logs this month, total labor cost this month, avg hours/day
- **Dependencies:** Task 2.3 (มี work log data แล้ว)
- **Verification:** metric cards แสดงค่าถูกต้อง

**Steps:**
1. เพิ่ม Prisma queries ใน `dashboard/page.tsx`:
   - count work logs today with distinct workers
   - count work logs this month
   - sum labor cost this month (จาก assignment estimated cost)
   - avg duration from work logs
2. เพิ่ม metric cards section
3. ส่ง messages ไปยัง UI

---

#### Task 4.2: เพิ่ม recent work logs activity
- **สถานะ:** pending
- **Expected outcome:** Dashboard แสดง work logs ล่าสุด 5 รายการ
- **Dependencies:** Task 4.1
- **Verification:** เห็น recent work logs ใน dashboard

**Steps:**
1. เพิ่ม query สำหรับ work logs ล่าสุด
2. แสดงใน RecentActivity section หรือสร้าง section ใหม่
3. แสดง worker name, project, date, duration, status

---

#### Task 4.3: เพิ่ม link ไปยัง Worker pages
- **สถานะ:** pending
- **Expected outcome:** จาก dashboard คลิกไป Worker Teams / Work Logs ได้
- **Dependencies:** Task 4.2

---

#### Task 4.4: แก้ข้อความภาษาไทยใน Dashboard
- **สถานะ:** pending
- **Expected outcome:** ข้อความไทยใน dashboard ถูกต้อง

---

### Milestone 3: เพิ่ม Labor Cost Report

#### Task 3.1: เพิ่ม Labor Cost Summary section
- **สถานะ:** pending
- **Expected outcome:** Reports page มี section Labor Cost Summary ด้านบน
- **Dependencies:** Task 4.1 (มี query patterns แล้ว)
- **Verification:** เห็น metric cards ด้านบนของ Reports

**Steps:**
1. เพิ่ม Prisma queries สำหรับ labor cost:
   - total labor cost (sum estimatedCostInCents จาก active assignments)
   - avg cost per day
   - active workers count
   - total work logs count
2. เพิ่ม metric cards ใน reports page
3. เพิ่ม section divider

---

#### Task 3.2: ตาราง Labor Cost by Project
- **สถานะ:** pending
- **Expected outcome:** ตารางแสดงต้นทุนแรงงานแยกตามโครงการ
- **Dependencies:** Task 3.1
- **Verification:** ตารางแสดงข้อมูลถูกต้อง

**Steps:**
1. Query: sum estimatedCostInCents จาก WorkerAssignment group by project
2. Query: sum work log data group by project
3. แสดง both estimated vs actual
4. เชื่อม filter กับ date range และ project filter ที่มีอยู่แล้ว

---

#### Task 3.3: ตาราง Labor Cost by Worker
- **สถานะ:** pending
- **Expected outcome:** ตารางแสดงต้นทุนแรงงานแยกตามคนงาน
- **Dependencies:** Task 3.2
- **Verification:** ตารางแสดงข้อมูลถูกต้อง

**Steps:**
1. Query: sum estimatedCostInCents group by worker
2. Query: sum work log data group by worker
3. แสดง total hours, total cost, avg hours/day
4. แสดง worker name + email

---

#### Task 3.4: เชื่อม filter กับ Labor Cost
- **สถานะ:** pending
- **Expected outcome:** filter date range และ project ใช้ได้กับ labor cost section
- **Dependencies:** Task 3.3
- **Verification:** filter ทำงานกับทุก section

---

#### Task 3.5: แก้ข้อความภาษาไทยใน Reports
- **สถานะ:** pending
- **Expected outcome:** ข้อความไทยใน reports ถูกต้อง

---

## Execution Order

```
5.1 → 1.1 → 1.2 → 1.3 → 1.4 → 5.2 → 2.1 → 2.2 → 2.3 → 2.4
       → 4.1 → 4.2 → 4.3 → 4.4 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5
```

---

## Verification Checklist (ทำหลังจบทุก task)

- [ ] ทดสอบ flow: สร้างทีม → เพิ่ม member → สร้าง assignment → บันทึก work log
- [ ] ทดสอบ filter ในหน้า Work Logs
- [ ] ทดสอบ filter ในหน้า Reports
- [ ] Dashboard metrics แสดงค่าถูกต้อง
- [ ] Labor cost report แสดงข้อมูลครบ
- [ ] ข้อความภาษาไทยไม่มี mojibake
- [ ] `npm run lint` ผ่าน
- [ ] ไม่มี regression กับหน้าอื่น (projects, customers, transactions, etc.)

---

## Notes

- ใช้ mock data เสมอ (ไม่มี real payment integration)
- คำนวณ labor cost จาก WorkerAssignment.estimatedCostInCents เป็นหลัก
- WorkLog ไม่มี wage field โดยตรง → คำนวณจาก WorkerTeamMember.dailyWageInCents ถ้าต้องการ actual cost
- แสดง note "ประมาณการ" สำหรับ estimated cost
- preserve structure เดิมของทุกหน้าก่อนแก้ไข
