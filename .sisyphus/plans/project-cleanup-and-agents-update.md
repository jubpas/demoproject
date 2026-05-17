# Project Cleanup & AGENTS.md Update

## TL;DR
> ทำความสะอาดโปรเจคสำหรับ development — ลบไฟล์ชั่วคราว, อัปเดตเอกสาร, fix code drift, และอัปเดต AGENTS.md ให้ตรงกับสถานะปัจจุบัน (Prisma Accelerate + PostgreSQL)

**Deliverables:**
- ลบไฟล์ชั่วคราวและไฟล์ที่ไม่จำเป็นออกจาก root
- อัปเดต `.env.example` ให้ตรงกับ PostgreSQL
- ลบ `dev.db` (SQLite database)
- Fix `scripts/reset-data.ts` ให้รองรับ PostgreSQL
- อัปเดต `AGENTS.md` ให้ตรงกับ implementation จริง
- จัดระเบียบ documentation files

**Estimated Effort:** Medium
**Parallel Execution:** YES - 3 waves
**Critical Path:** Clean files → Fix code drift → Update AGENTS.md

---

## Context

### Original Request
ผู้ใช้ต้องการให้ clean project for development และอัปเดต AGENTS.md เพื่อเป็นแนวทางการพัฒนาและ test + deploy ที่ถูกต้อง

### Interview Summary
- ใช้ Prisma Accelerate (PostgreSQL) สำหรับ local development
- Production ใช้ Railway + PostgreSQL
- มี Next.js App Router, Tailwind CSS v4, Prisma ORM
- มี testing setup ด้วย Vitest

### Research Findings
- โปรเจคมีไฟล์ชั่วคราวจำนวนมากใน root directory
- `.env.example` ยังอ้างอิง SQLite ซึ่งล้าสมัย
- `scripts/reset-data.ts` ใช้ SQLite-specific commands
- `AGENTS.md` ยังพูดถึง SQLite เป็นหลัก
- มี encoding issues ในบางไฟล์ภาษาไทย

### Metis Review
**Identified Gaps (addressed):**
- ต้องตรวจสอบว่า `.env.local` มี sensitive data หรือไม่ — มี API key จริง
- ต้องเช็กว่า `scripts/build.mjs` ใช้ URL ที่ถูกต้องสำหรับ production
- ต้องตรวจสอบว่า test setup ทำงานได้กับ PostgreSQL

---

## Work Objectives

### Core Objective
ทำความสะอาดโปรเจคสำหรับ development และอัปเดตเอกสารให้ตรงกับ implementation จริง

### Concrete Deliverables
- ลบไฟล์ชั่วคราวออกจาก root
- อัปเดต `.env.example` สำหรับ PostgreSQL
- ลบ `dev.db`
- Fix `scripts/reset-data.ts` สำหรับ PostgreSQL
- อัปเดต `AGENTS.md` ให้ครบถ้วน
- จัดระเบียบ documentation

### Definition of Done
- [ ] ไม่มีไฟล์ชั่วคราวใน root directory
- [ ] `.env.example` อัปเดตแล้ว
- [ ] `dev.db` ถูกลบ
- [ ] `scripts/reset-data.ts` รองรับ PostgreSQL
- [ ] `AGENTS.md` อัปเดตแล้ว
- [ ] `npm run lint` ผ่าน
- [ ] `npx next build` ผ่าน

### Must Have
- ไฟล์ชั่วคราวทั้งหมดถูกลบ
- เอกสารอัปเดตตรงกับ implementation
- โปรเจคยัง build ได้

### Must NOT Have (Guardrails)
- อย่าลบไฟล์ที่จำเป็นเช่น `DESIGN.md`, `package.json`, `next.config.ts`
- อย่าลบ `.git/` directory
- อย่าลบ `src/` directory
- อย่าลบ `prisma/` directory
- อย่าลบ `public/` directory

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after
- **Framework**: vitest

### QA Policy
- รัน `npm run lint` — ต้องไม่มี error
- รัน `npx next build` — ต้อง build สำเร็จ
- รัน `npx prisma generate` — ต้อง generate สำเร็จ

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - cleanup):
├── Task 1: ลบไฟล์ชั่วคราวใน root [quick]
├── Task 2: ลบ dev.db [quick]
├── Task 3: ลบไฟล์ชั่วคราวอื่นๆ [quick]
└── Task 4: อัปเดต .env.example [quick]

Wave 2 (After Wave 1 - code fixes):
├── Task 5: Fix scripts/reset-data.ts สำหรับ PostgreSQL [quick]
├── Task 6: Fix scripts/build.mjs [quick]
└── Task 7: เช็ก encoding ในไฟล์ไทย [quick]

Wave 3 (After Wave 2 - documentation):
├── Task 8: อัปเดต AGENTS.md [writing]
├── Task 9: จัดระเบียบ documentation files [quick]
└── Task 10: ลบไฟล์ documentation เก่า [quick]

Wave FINAL (After ALL tasks):
├── Task F1: lint check [quick]
├── Task F2: build check [quick]
└── Task F3: prisma generate check [quick]
```

### Dependency Matrix
- **1-4**: Independent — can run in parallel
- **5-7**: Depends on Wave 1 (clean state)
- **8-10**: Depends on Wave 2 (code fixes)
- **F1-F3**: Depends on ALL tasks

### Agent Dispatch Summary
- **Wave 1**: 4 quick tasks
- **Wave 2**: 3 quick tasks
- **Wave 3**: 1 writing task + 2 quick tasks
- **FINAL**: 3 quick tasks

---

## TODOs

- [ ] 1. ลบไฟล์ชั่วคราวใน root directory

  **What to do**:
  - ลบ `callback_matches.txt`
  - ลบ `filelist.txt`
  - ลบ `projectplan.md`
  - ลบ `task.md`
  - ลบ `handoff.md`
  - ลบ `AUDIT-REPORT.md`

  **Must NOT do**:
  - อย่าลบ `.gitignore`, `package.json`, `package-lock.json`
  - อย่าลบ `DESIGN.md`, `AGENTS.md`
  - อย่าลบ `Dockerfile`, `nixpacks.toml`
  - อย่าลบ `.next/`, `node_modules/`

  **Recommended Agent Profile**:
  > Category: `quick` — simple file deletions
  > Skills: `[]` — no special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-4)
  - **Blocks**: None (can start immediately)
  - **Blocked By**: None

  **References**:
  - Root directory listing from exploration

  **Acceptance Criteria**:
  - [ ] `callback_matches.txt`不存在
  - [ ] `filelist.txt`不存在
  - [ ] `projectplan.md`不存在
  - [ ] `task.md`不存在
  - [ ] `handoff.md`不存在
  - [ ] `AUDIT-REPORT.md`不存在

  **QA Scenarios**:
  ```
  Scenario: Verify cleanup files are removed
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: Test-Path "callback_matches.txt"
      2. Run: Test-Path "filelist.txt"
      3. Run: Test-Path "projectplan.md"
      4. Run: Test-Path "task.md"
      5. Run: Test-Path "handoff.md"
      6. Run: Test-Path "AUDIT-REPORT.md"
    Expected Result: All commands return False
    Evidence: Console output showing all False
  ```

- [ ] 2. ลบไฟล์ dev.db (SQLite database)

  **What to do**:
  - ลบ `dev.db` — SQLite database ที่ล้าสมัย

  **Must NOT do**:
  - อย่าลบ `.env` หรือ `.env.local`

  **Recommended Agent Profile**:
  > Category: `quick` — simple file deletion
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - Root directory listing showing `dev.db` exists

  **Acceptance Criteria**:
  - [ ] `dev.db`不存在

  **QA Scenarios**:
  ```
  Scenario: Verify dev.db is removed
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: Test-Path "dev.db"
    Expected Result: Returns False
    Evidence: Console output showing False
  ```

- [ ] 3. ลบไฟล์ temp_dashboard.tsx

  **What to do**:
  - ลบ `temp_dashboard.tsx` — ไฟล์ชั่วคราว

  **Must NOT do**:
  - อย่าลบไฟล์อื่นใน root

  **Recommended Agent Profile**:
  > Category: `quick` — simple file deletion
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - Root directory listing showing `temp_dashboard.tsx` exists

  **Acceptance Criteria**:
  - [ ] `temp_dashboard.tsx`不存在

  **QA Scenarios**:
  ```
  Scenario: Verify temp_dashboard.tsx is removed
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: Test-Path "temp_dashboard.tsx"
    Expected Result: Returns False
    Evidence: Console output showing False
  ```

- [ ] 4. อัปเดต .env.example สำหรับ PostgreSQL

  **What to do**:
  - อัปเดต `.env.example` ให้ตรงกับ PostgreSQL (ไม่ใช่ SQLite)
  - ลบ comment เกี่ยวกับ SQLite
  - เพิ่ม comment เกี่ยวกับ Prisma Accelerate

  **Must NOT do**:
  - อย่าเปลี่ยนค่าจริงใน `.env` หรือ `.env.local`
  - อย่าเพิ่ม sensitive data ใน `.env.example`

  **Recommended Agent Profile**:
  > Category: `quick` — simple file edit
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - Current `.env.example` content
  - Current `.env` content (for reference)

  **Acceptance Criteria**:
  - [ ] `.env.example` ไม่มี reference ถึง SQLite
  - [ ] `.env.example` มี comment เกี่ยวกับ Prisma Accelerate
  - [ ] `.env.example` มีโครงสร้างที่ถูกต้อง

  **QA Scenarios**:
  ```
  Scenario: Verify .env.example is updated
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Read .env.example
      2. Check no "file:./dev.db" exists
      3. Check has PostgreSQL comment
    Expected Result: .env.example is updated correctly
    Evidence: File content showing PostgreSQL reference
  ```

- [ ] 5. Fix scripts/reset-data.ts สำหรับ PostgreSQL

  **What to do**:
  - เปลี่ยน `PRAGMA foreign_keys=OFF` เป็น PostgreSQL equivalent
  - เปลี่ยน `PRAGMA foreign_keys=ON` เป็น PostgreSQL equivalent
  - ตรวจสอบว่า table names ถูกต้องสำหรับ PostgreSQL

  **Must NOT do**:
  - อย่าเปลี่ยน logic ของการ reset
  - อย่าลบ table names

  **Recommended Agent Profile**:
  > Category: `quick` — simple code fix
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 1)
  - **Parallel Group**: Wave 2 (with Tasks 6-7)
  - **Blocks**: None
  - **Blocked By**: Wave 1

  **References**:
  - `scripts/reset-data.ts` — ไฟล์ที่ต้องแก้
  - PostgreSQL documentation สำหรับ PRAGMA equivalent

  **Acceptance Criteria**:
  - [ ] `PRAGMA foreign_keys=OFF` ถูกเปลี่ยนเป็น PostgreSQL equivalent
  - [ ] `PRAGMA foreign_keys=ON` ถูกเปลี่ยนเป็น PostgreSQL equivalent
  - [ ] Script ยังทำงานได้

  **QA Scenarios**:
  ```
  Scenario: Verify reset-data.ts syntax
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Read scripts/reset-data.ts
      2. Check no PRAGMA commands exist
      3. Check has PostgreSQL equivalent
    Expected Result: Script is updated for PostgreSQL
    Evidence: File content showing PostgreSQL commands
  ```

- [ ] 6. Fix scripts/build.mjs

  **What to do**:
  - ตรวจสอบว่า `build.mjs` ใช้ URL ที่ถูกต้อง
  - ลบ hardcoded URL ถ้าไม่จำเป็น

  **Must NOT do**:
  - อย่าเปลี่ยน logic ของ build

  **Recommended Agent Profile**:
  > Category: `quick` — simple code fix
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 1)
  - **Parallel Group**: Wave 2 (with Tasks 5, 7)
  - **Blocks**: None
  - **Blocked By**: Wave 1

  **References**:
  - `scripts/build.mjs` — ไฟล์ที่ต้องแก้
  - `.env.local` — สำหรับ reference

  **Acceptance Criteria**:
  - [ ] `build.mjs` ใช้ DATABASE_URL จาก environment
  - [ ] ไม่มี hardcoded URL

  **QA Scenarios**:
  ```
  Scenario: Verify build.mjs uses environment variable
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Read scripts/build.mjs
      2. Check uses process.env.DATABASE_URL
      3. Check no hardcoded URL
    Expected Result: build.mjs uses environment variable
    Evidence: File content showing process.env.DATABASE_URL
  ```

- [ ] 7. เช็ก encoding ในไฟล์ไทย

  **What to do**:
  - ตรวจสอบไฟล์ที่มีภาษาไทย
  - แก้ encoding issues ถ้ามี

  **Must NOT do**:
  - อย่าเปลี่ยน content ของไฟล์
  - อย่าลบไฟล์

  **Recommended Agent Profile**:
  > Category: `quick` — simple file check
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 1)
  - **Parallel Group**: Wave 2 (with Tasks 5-6)
  - **Blocks**: None
  - **Blocked By**: Wave 1

  **References**:
  - `src/lib/auth.ts` — มี comment ภาษาไทย
  - `src/messages/th.ts` — มี encoding issues

  **Acceptance Criteria**:
  - [ ] ไฟล์ภาษาไทยอ่านได้ถูกต้อง
  - [ ] ไม่มี encoding issues

  **QA Scenarios**:
  ```
  Scenario: Verify Thai text encoding
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Read src/lib/auth.ts
      2. Read src/messages/th.ts
      3. Check Thai text is readable
    Expected Result: Thai text is readable
    Evidence: File content showing correct Thai text
  ```

- [ ] 8. อัปเดต AGENTS.md

  **What to do**:
  - อัปเดต AGENTS.md ให้ตรงกับ implementation จริง
  - เปลี่ยน SQLite เป็น PostgreSQL
  - เพิ่ม section สำหรับ testing
  - เพิ่ม section สำหรับ deployment
  - เพิ่ม section สำหรับ development workflow
  - ลบ outdated information

  **Must NOT do**:
  - อย่าลบ section ที่ยังถูกต้อง
  - อย่าเปลี่ยน stack หลัก

  **Recommended Agent Profile**:
  > Category: `writing` — documentation update
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 2)
  - **Parallel Group**: Wave 3 (with Tasks 9-10)
  - **Blocks**: None
  - **Blocked By**: Wave 2

  **References**:
  - Current `AGENTS.md` content
  - Current project structure
  - Current `.env` content
  - Current `package.json` content

  **Acceptance Criteria**:
  - [ ] AGENTS.md อัปเดตแล้ว
  - [ ] ไม่มี SQLite reference
  - [ ] มี testing section
  - [ ] มี deployment section
  - [ ] มี development workflow section

  **QA Scenarios**:
  ```
  Scenario: Verify AGENTS.md is updated
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Read AGENTS.md
      2. Check no SQLite reference
      3. Check has testing section
      4. Check has deployment section
      5. Check has development workflow section
    Expected Result: AGENTS.md is updated correctly
    Evidence: File content showing all sections
  ```

- [ ] 9. จัดระเบียบ documentation files

  **What to do**:
  - ย้าย `CICD-GUIDE.md` ไป `docs/`
  - ย้าย `DEPLOYMENT-GUIDE.md` ไป `docs/`
  - สร้าง `docs/` directory ถ้ายังไม่มี

  **Must NOT do**:
  - อย่าลบ documentation files
  - อย่าเปลี่ยน content ของ files

  **Recommended Agent Profile**:
  > Category: `quick` — file organization
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 2)
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: None
  - **Blocked By**: Wave 2

  **References**:
  - Root directory listing
  - `CICD-GUIDE.md`
  - `DEPLOYMENT-GUIDE.md`

  **Acceptance Criteria**:
  - [ ] `docs/` directory exists
  - [ ] `CICD-GUIDE.md` อยู่ใน `docs/`
  - [ ] `DEPLOYMENT-GUIDE.md` อยู่ใน `docs/`

  **QA Scenarios**:
  ```
  Scenario: Verify documentation organization
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: Test-Path "docs"
      2. Run: Test-Path "docs/CICD-GUIDE.md"
      3. Run: Test-Path "docs/DEPLOYMENT-GUIDE.md"
    Expected Result: All paths exist
    Evidence: Console output showing all True
  ```

- [ ] 10. ลบไฟล์ documentation เก่า

  **What to do**:
  - ลบ `AGENTS.md` เก่า (ถ้ามี backup)
  - ลบไฟล์อื่นๆ ที่ไม่จำเป็น

  **Must NOT do**:
  - อย่าลบ `AGENTS.md` หลัก
  - อย่าลบไฟล์ที่จำเป็น

  **Recommended Agent Profile**:
  > Category: `quick` — simple file deletion
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 2)
  - **Parallel Group**: Wave 3 (with Tasks 8-9)
  - **Blocks**: None
  - **Blocked By**: Wave 2

  **References**:
  - Root directory listing

  **Acceptance Criteria**:
  - [ ] ไม่มีไฟล์ documentation เก่าใน root
  - [ ] `AGENTS.md` หลักยังอยู่

  **QA Scenarios**:
  ```
  Scenario: Verify old documentation files are removed
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: Test-Path "AGENTS.md.bak"
      2. Run: Test-Path "AGENTS.md.old"
    Expected Result: All commands return False
    Evidence: Console output showing all False
  ```

- [ ] F1. lint check

  **What to do**:
  - รัน `npm run lint`
  - ตรวจสอบว่าไม่มี error

  **Recommended Agent Profile**:
  > Category: `quick` — simple command run
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: FINAL (with Tasks F2-F3)
  - **Blocks**: None
  - **Blocked By**: ALL tasks

  **References**:
  - `package.json` — สำหรับ lint script

  **Acceptance Criteria**:
  - [ ] `npm run lint` ผ่าน

  **QA Scenarios**:
  ```
  Scenario: Verify lint passes
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: npm run lint
    Expected Result: No errors
    Evidence: Console output showing no errors
  ```

- [ ] F2. build check

  **What to do**:
  - รัน `npx next build`
  - ตรวจสอบว่า build สำเร็จ

  **Recommended Agent Profile**:
  > Category: `quick` — simple command run
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: FINAL (with Tasks F1, F3)
  - **Blocks**: None
  - **Blocked By**: ALL tasks

  **References**:
  - `package.json` — สำหรับ build script

  **Acceptance Criteria**:
  - [ ] `npx next build` ผ่าน

  **QA Scenarios**:
  ```
  Scenario: Verify build passes
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: npx next build
    Expected Result: Build succeeds
    Evidence: Console output showing build success
  ```

- [ ] F3. prisma generate check

  **What to do**:
  - รัน `npx prisma generate`
  - ตรวจสอบว่า generate สำเร็จ

  **Recommended Agent Profile**:
  > Category: `quick` — simple command run
  > Skills: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: FINAL (with Tasks F1-F2)
  - **Blocks**: None
  - **Blocked By**: ALL tasks

  **References**:
  - `prisma/schema.prisma` — สำหรับ generate

  **Acceptance Criteria**:
  - [ ] `npx prisma generate` ผ่าน

  **QA Scenarios**:
  ```
  Scenario: Verify prisma generate passes
    Tool: Bash (PowerShell)
    Preconditions: None
    Steps:
      1. Run: npx prisma generate
    Expected Result: Generate succeeds
    Evidence: Console output showing generate success
  ```

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `quick`
  Verify all tasks are completed. Check that all files are cleaned, all code is fixed, and all documentation is updated.

- [ ] F2. **Code Quality Review** — `quick`
  Run `npm run lint` and `npx next build`. Check for any issues.

- [ ] F3. **Scope Fidelity Check** — `quick`
  Verify that no unnecessary files were deleted and no necessary files were modified.

---

## Commit Strategy

- **1**: `cleanup: remove temporary files` — callback_matches.txt, filelist.txt, projectplan.md, task.md, handoff.md, AUDIT-REPORT.md, dev.db, temp_dashboard.tsx
- **2**: `cleanup: update .env.example for PostgreSQL`
- **3**: `fix: update reset-data.ts for PostgreSQL`
- **4**: `fix: update build.mjs`
- **5**: `docs: update AGENTS.md`
- **6**: `docs: organize documentation files`
- **7**: `chore: final verification`

---

## Success Criteria

### Verification Commands
```bash
npm run lint  # Expected: No errors
npx next build  # Expected: Build succeeds
npx prisma generate  # Expected: Generate succeeds
```

### Final Checklist
- [ ] All temporary files removed
- [ ] .env.example updated
- [ ] dev.db removed
- [ ] scripts/reset-data.ts fixed
- [ ] scripts/build.mjs fixed
- [ ] AGENTS.md updated
- [ ] Documentation organized
- [ ] All verification commands pass
