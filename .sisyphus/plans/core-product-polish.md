# Work Plan: Core Product Polish & Missing Features

**Created:** 2026-05-05T07:48:00.000Z  
**Project:** ไซต์งานโปร (SiteNgan Pro)  
**Focus:** Complete missing features, fix known bugs, polish product flow, align UI incrementally

---

## Context

### Project Overview
Multi-organization construction project management system built on:
- Next.js 16.2.4 App Router
- Tailwind CSS v4
- Prisma 7.8 + SQLite (better-sqlite3)
- NextAuth v5 (beta)
- Vitest 4.1.5
- Locales: `/th/...` and `/en/...`
- Organization routes: `/[locale]/org/[orgSlug]/*`

### Current State
- **22 Prisma models** covering auth, org, subscription, business, budget, operations, governance
- **17 lib files** with server-only helpers for auth, org access, invites, password reset, subscriptions, budget, approvals, audit, tasks, uploads
- **Complete route structure** with locale routes, org routes, admin routes
- **Seed files**: demo-seed.mjs (working), tes001-seed.mjs (has bug - undefined `project` variable)
- **Test coverage**: Minimal (smoke + auth API + auth component tests only)

### Known Issues to Fix
1. Missing `/org/[orgSlug]/work-logs` page (API route exists, nav item exists, but no page.tsx)
2. Password policy mismatch: register requires 8 chars, reset-password requires 6 chars
3. Survey→Quotation conversion: no guard against converting same appointment twice
4. Quotation→Project conversion: no status check before conversion
5. tes001-seed.mjs bug: line 24 duplicates `passwordHash`, lines reference undefined `project` variable
6. No `SUPER_ADMIN_EMAILS` in `.env`
7. Mixed light/dark theme - content areas still use `bg-white`, `bg-slate-100`

### Design Direction
- DESIGN.md specifies dark theme (#0f0f0f canvas, #0007cd primary)
- design-plan.md has 7-phase migration plan
- AGENTS.md says: preserve light admin dashboard, incremental alignment only
- CTA: #0007cd + radius 8px, brightness-step elevation (no drop shadows)

---

## TODOs

### Phase 1: Missing Features & Critical Fixes

- [x] **T1: Create Work Logs page** (`/org/[orgSlug]/work-logs/page.tsx`)
  - Server component with client interaction for CRUD
  - Display work logs filtered by organization
  - Support filters: project, team, status, date range
  - Actions: create, approve, reject work logs
  - Follow existing patterns from worker-teams page
  - Verify: page loads, CRUD operations work, filters apply

- [x] **T2: Fix password policy mismatch**
  - Align reset-password minimum length to 8 characters (match register)
  - Update validation message to be consistent
  - Verify: both register and reset-password require 8+ chars with same error message

- [x] **T3: Add Survey→Quotation conversion guard**
  - Check if survey appointment already has a linked quotation before allowing conversion
  - Add error message if already converted
  - Verify: attempting to convert same appointment twice shows error

- [x] **T4: Add Quotation→Project conversion guard**
  - Check quotation status before allowing conversion (only DRAFT or SENT should be convertible)
  - Add error message if status is invalid
  - Verify: converting ACCEPTED/REJECTED/EXPIRED quotation shows error

- [x] **T5: Fix tes001-seed.mjs bugs**
  - Fix duplicate `passwordHash` declaration (line 24)
  - Fix undefined `project` variable references (lines 162-166, 173, 187, 206, 233, 247, 266, 280, 294) → should be `projectA` or `projectB`
  - Verify: `node prisma/tes001-seed.mjs` runs without errors

### Phase 2: Dashboard & Analytics Polish

- [x] **T6: Enhance dashboard metric cards**
  - Add trend indicators (up/down arrows) for key metrics
  - Add period-over-period comparison (this month vs last month)
  - Verify: dashboard shows trends correctly with mock data

- [x] **T7: Add project health visualization**
  - Visual progress bars for project completion
  - Color-coded status indicators (on-track, at-risk, overdue)
  - Verify: project health section renders correctly

- [x] **T8: Improve recent activity feed**
  - Group activities by date
  - Add entity type icons (project, task, transaction, quotation)
  - Add "load more" pagination
  - Verify: activity feed groups correctly, pagination works

### Phase 3: Filters, Search & UX Polish

- [x] **T9: Add global search within organization**
  - Search across projects, customers, quotations, tasks
  - Keyboard shortcut (Ctrl+K / Cmd+K)
  - Results grouped by entity type
  - Verify: search returns results across all entity types

- [x] **T10: Improve table filters across all list pages**
  - Standardize filter bar pattern across projects, customers, transactions, quotations
  - Add clear-all-filters button
  - Add filter count badge
  - Verify: filters work consistently across all list pages

- [x] **T11: Add export functionality**
  - Export transactions to CSV
  - Export project reports to CSV
  - Verify: CSV downloads correctly with proper headers and data

### Phase 4: UI Alignment (Incremental - DESIGN.md)

- [x] **T12: Update CSS tokens in globals.css**
  - Add DESIGN.md color tokens as CSS variables
  - Map: --background, --foreground, --surface, --surface-elevated, --surface-strong, --border, --border-strong, --primary, --primary-active, --primary-glow, --muted, --muted-soft, --success, --error
  - Keep existing tokens for backward compatibility
  - Verify: build passes, no visual regression on existing pages

- [x] **T13: Polish auth pages with DESIGN.md tokens**
  - Update login, register, forgot-password, reset-password pages
  - Use new CSS variables instead of hardcoded colors
  - Add radial blue spotlight glow backdrop
  - Verify: auth pages load correctly, forms work, responsive on mobile

- [x] **T14: Polish organization layout shell**
  - Update sidebar nav with DESIGN.md tokens (active nav = primary, hover = surface-card-elevated)
  - Update content area to use dark surface tokens
  - Verify: sidebar navigation works, content area renders correctly, responsive

- [x] **T15: Polish shared dashboard components**
  - Update page-header.tsx, metric-card.tsx, data-panel.tsx, status-badge.tsx
  - Use DESIGN.md tokens for backgrounds, borders, text colors
  - Verify: dashboard renders correctly with new component styles

### Phase 5: Test Coverage & Quality

- [x] **T16: Add unit tests for lib business logic**
  - Test `project-tasks.ts`: status parsers, priority parsers, completion sync, overdue detection
  - Test `invites.ts`: token creation, expiry, validation
  - Test `password-reset.ts`: token lifecycle, single-use enforcement
  - Test `subscription.ts`: seat limit enforcement, assertSeatAvailable
  - Verify: all tests pass, coverage > 60% for lib/ files

- [x] **T17: Add API route tests**
  - Test customer CRUD endpoints
  - Test project CRUD endpoints
  - Test transaction CRUD endpoints
  - Test authorization guards (org access, role checks)
  - Verify: all API tests pass

- [ ] **T18: Run full lint and build verification**
  - `npm run lint` passes with zero errors
  - `npm run build` passes
  - `npm run test:run` passes all tests
  - Verify: clean CI-ready state

### Phase 6: Documentation & Cleanup

- [ ] **T19: Clean up empty/obsolete files**
  - Remove or populate `task.new.md` (currently empty)
  - Sync `task.md` with actual implementation state
  - Update `test-plan.md` to remove resolved blockers
  - Verify: documentation matches codebase

- [ ] **T20: Add SUPER_ADMIN_EMAILS to .env.example**
  - Document the super admin bootstrap process
  - Add comment explaining the format
  - Verify: .env.example has all required variables documented

---

## Final Verification Wave

- [ ] **F1: Code Quality Review** - Oracle agent reviews all changes for architecture consistency, no anti-patterns, proper error handling
- [ ] **F2: Security Review** - Review auth flows, authorization guards, input validation, token handling
- [ ] **F3: Hands-on QA** - Playwright browser testing of critical flows: login → org → dashboard → work-logs → reports
- [ ] **F4: Build & Test Gate** - `npm run lint` + `npm run build` + `npm run test:run` all pass with zero errors

---

## Dependencies & Parallelization

### Parallel Groups (can run simultaneously)
- **Group A**: T1 (work-logs page), T2 (password policy), T3 (survey guard), T4 (quotation guard), T5 (seed fix)
- **Group B**: T6 (dashboard metrics), T7 (project health), T8 (activity feed)
- **Group C**: T9 (global search), T10 (table filters), T11 (export)
- **Group D**: T12 (CSS tokens), T13 (auth pages), T14 (org layout), T15 (dashboard components)
- **Group E**: T16 (lib tests), T17 (API tests)
- **Group F**: T18 (lint/build), T19 (docs), T20 (env example)

### Sequential Dependencies
- Group D requires Group A (no direct dependency, but UI changes should come after bug fixes)
- Group E requires Group A (tests need stable code)
- Group F requires all previous groups
- Final Wave requires all phases complete

---

## Notepad Convention

Append findings to:
- `.sisyphus/notepads/core-product-polish/learnings.md` - patterns, conventions discovered
- `.sisyphus/notepads/core-product-polish/decisions.md` - architectural choices made
- `.sisyphus/notepads/core-product-polish/issues.md` - problems, gotchas, blockers
- `.sisyphus/notepads/core-product-polish/problems.md` - unresolved issues needing attention
