# Project Cleanup & AGENTS.md Update

## Context
- Project: Next.js 16.2.4 construction management app (ไซต์งานโปร)
- Database: Migrated from SQLite to PostgreSQL (Prisma Accelerate)
- Goal: Clean project for development and update AGENTS.md

## Key Issues Found

### Files to Remove
1. `temp_dashboard.tsx` - Temporary file
2. `callback_matches.txt` - Debug file
3. `filelist.txt` - Debug file
4. `handoff.md` - Handoff file (outdated)
5. `task.md` - Task file (outdated)
6. `projectplan.md` - Project plan file
7. `dev.db` - SQLite database file (should be removed)

### Files to Update
1. `.env.example` - Outdated (mentions SQLite for local dev)
2. `scripts/reset-data.ts` - Uses SQLite-specific PRAGMA commands
3. `AGENTS.md` - References SQLite, needs PostgreSQL update
4. `DEPLOYMENT-GUIDE.md` - Contains outdated SQLite references
5. `CICD-GUIDE.md` - Contains outdated content
6. `AUDIT-REPORT.md` - Lists missing items but needs update

### Code Issues
1. `src/app/layout.tsx` - Encoding issues in title (line 18)
2. `src/messages/th.ts` - Encoding issues (line 412)
3. `src/lib/auth.ts` - In-memory rate limiter with "replace with Redis" comment
4. `scripts/build.mjs` - Hardcoded PostgreSQL build database URL

### Missing Items (from AUDIT-REPORT.md)
- BudgetCategory API route
- ProjectBudgetLine API route
- BudgetRevision API route
- ProjectTask API route
- Attachment API route
- BudgetCategory UI page
- BudgetLines UI page
- BudgetRevisions UI page
- Tasks UI page
- Attachments UI page
