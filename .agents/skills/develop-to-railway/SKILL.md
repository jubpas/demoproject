---
name: develop-to-railway
description: Use when developing, debugging, or preparing this Next.js + Prisma app for Railway deployment. Covers Railway/Nixpacks/Docker builds, Prisma 7, Tailwind CSS v4, environment variables, and pre-push verification.
---

# Develop to Railway

This skill captures the deployment workflow and failure patterns learned from this project's Railway deployment.

Use this skill when the user asks to:

- deploy this app to Railway
- fix Railway build/deploy errors
- prepare changes before pushing for Railway
- debug Prisma, Tailwind, Next.js, Dockerfile, or Nixpacks issues on Railway
- verify that local changes are safe for Railway deployment

## Project Context

This project uses:

- Next.js App Router
- Next.js 16.x with Turbopack build output
- Tailwind CSS v4
- Prisma 7.x
- Prisma Postgres on Railway/runtime
- SQLite may still exist locally, but deployment uses PostgreSQL
- Railway config-as-code via `railway.json`
- Optional Dockerfile path, but current `railway.json` may still select Nixpacks explicitly

Always read `AGENTS.md` first. For UI work, also read `DESIGN.md` before editing UI.

## Golden Rules

1. Do not commit secrets.
   - Never write a real `DATABASE_URL`, `NEXTAUTH_SECRET`, reset token, or service key into repo files.
   - Use placeholders in docs and examples.
2. Keep build tools available during build.
   - `@tailwindcss/postcss`, `tailwindcss`, `typescript`, and ESLint-related tools are build-time dependencies.
   - They may stay in `devDependencies`, but the build install step must include devDependencies.
3. Prisma 7 requires a modern Node version.
   - Use Node `>=22.12.0` or another Prisma-supported version.
   - Keep `.node-version`, `package.json#engines`, `nixpacks.toml`, and Docker base image aligned.
4. `prisma generate` must run before `next build`.
   - This project uses `npm run build` via `scripts/build.mjs`.
5. Railway runtime must still have a real PostgreSQL `DATABASE_URL`.
   - Build-time dummy URLs are only for generation/build fallback.
   - Runtime without a real `DATABASE_URL` will fail or connect incorrectly.

## Standard Investigation Workflow

When a Railway deploy fails:

1. Copy the exact failing log line.
2. Classify the failure:
   - dependency install
   - Node/npm engine
   - Prisma generation/config
   - TypeScript strictness
   - Tailwind/PostCSS CSS build
   - Next.js route/static data collection
   - runtime environment/healthcheck
3. Inspect only relevant files first:
   - `package.json`
   - `package-lock.json`
   - `railway.json`
   - `nixpacks.toml`
   - `Dockerfile`
   - `.node-version`
   - `.npmrc`
   - `prisma.config.ts`
   - `prisma/schema.prisma`
   - `src/lib/db.ts`
   - `postcss.config.mjs`
   - `src/app/globals.css`
4. Make the smallest scoped fix.
5. Run focused local verification.
6. Commit only relevant files; do not include `dev.db`, temp files, or generated scratch files.

## Known Railway Failure Patterns and Fixes

### 1. Prisma Node version error

Symptom:

```text
Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+.
```

Fix checklist:

- `package.json`:

```json
"engines": {
  "node": ">=22.12.0",
  "npm": ">=10"
}
```

- `.node-version` should pin a compatible version, e.g.:

```text
22.12.0
```

- `nixpacks.toml` should align with Node 22:

```toml
[phases.setup]
nixPkgs = ["nodejs_22", "npm-10_x"]
```

- Dockerfile, if used, should use a compatible base image:

```dockerfile
FROM node:22.12-alpine AS base
```

### 2. Prisma client missing or stale during Railway build

Symptom:

```text
Prisma client did not initialize yet
```

or TypeScript errors caused by missing generated Prisma types.

Fix:

- Ensure build runs Prisma generation before Next build.
- Current project should use:

```json
"build": "node scripts/build.mjs"
```

The build script should run:

```text
prisma generate
next build
```

### 3. `DATABASE_URL` missing during `prisma generate`

Symptom:

```text
PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
```

Root cause:

- Prisma 7 config can fail during `prisma generate` if `env('DATABASE_URL')` is required and Railway does not expose the variable during build.

Project fix pattern:

- `prisma.config.ts` may allow a dummy PostgreSQL URL for `prisma generate` only.
- `scripts/build.mjs` may set a dummy PostgreSQL `DATABASE_URL` if missing at build time.
- Do not use SQLite dummy URL when `schema.prisma` provider is PostgreSQL.

Important:

- The dummy URL is only for build/generation.
- Railway runtime still needs the real PostgreSQL `DATABASE_URL` in Variables.

### 4. Adapter mismatch during Next build data collection

Symptom:

```text
The Driver Adapter `@prisma/adapter-better-sqlite3`, based on `sqlite`, is not compatible with the provider `postgres` specified in the Prisma schema.
```

Root cause:

- Build-time code imported `src/lib/db.ts` without `DATABASE_URL`.
- The code fell back to SQLite while schema provider was PostgreSQL.

Fix:

- Ensure build-time `DATABASE_URL` is at least a PostgreSQL-shaped dummy URL.
- Do not fallback to SQLite during PostgreSQL schema builds.

### 5. Tailwind v4 PostCSS plugin missing

Symptom:

```text
./src/app/globals.css
Error evaluating Node.js code
Error: Cannot find module '@tailwindcss/postcss'
```

Root cause:

- Build install skipped `devDependencies`.
- `@tailwindcss/postcss` is correctly a build-time dependency, usually in `devDependencies`.

Fix checklist:

- Keep `postcss.config.mjs` like:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- Keep Tailwind v4 import in CSS:

```css
@import "tailwindcss";
```

- In Dockerfile:
  - Do not set `NODE_ENV=production` in the base/deps/builder stage.
  - Install all dependencies in the builder deps stage with `npm ci`.
  - Create a separate `prod-deps` stage with `npm ci --omit=dev` only for runtime.

- In `railway.json` if using Nixpacks:

```json
"buildCommand": "rm -rf node_modules/.cache && npm ci --include=dev && npm run build"
```

### 6. Railway/NPM cache lock error

Symptom:

```text
EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'
```

Fix checklist:

- Add `.npmrc` with npm cache outside `node_modules`:

```text
cache=/tmp/.npm
```

- Clean Next/node module cache before install in Railway build command:

```text
rm -rf node_modules/.cache && npm ci --include=dev && npm run build
```

- Ask user to clear Railway build cache and redeploy.

### 7. Prisma generated client missing at runtime

Symptom:

```text
Healthcheck failure
Cannot find module '.prisma/client/default'
```

Root cause:

- `prisma generate` ran in the Docker `builder` stage.
- The Docker `runner` stage copied production `node_modules` from `prod-deps`.
- `prod-deps` never ran `prisma generate`, so `node_modules/.prisma/client` was missing at runtime.

Fix:

- After copying production `node_modules` into the runner, copy the generated Prisma client from the builder:

```dockerfile
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
```

- Keep this order: production `node_modules` first, generated Prisma client second.
- Do not solve this by installing all devDependencies in the runner image.

## Dockerfile Pattern

Recommended shape for this project:

```dockerfile
FROM node:22.12-alpine AS base
WORKDIR /app
ENV NPM_CONFIG_CACHE=/tmp/npm-cache
ENV npm_config_cache=/tmp/npm-cache

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next ./.next
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

Note: If the project uses Next standalone output later, adjust runner copy rules accordingly. Do not assume standalone output unless `next.config.ts` explicitly enables it.

## Pre-Push Verification Checklist

Before pushing a Railway/deploy fix:

1. Run local build:

```bash
npm run build
```

2. If Docker is available, test the builder target:

```bash
docker build --target builder -t demoproject-builder-test .
```

3. Check git status and exclude unrelated files:

```bash
git status --short
```

Never commit:

- `dev.db` unless explicitly requested
- `.env` with real secrets
- temporary search files
- `.sisyphus/run-continuation/*`
- throwaway scratch files such as `temp_*.tsx`

4. Commit only deployment-related files.

Common relevant files:

- `Dockerfile`
- `railway.json`
- `nixpacks.toml`
- `.node-version`
- `.npmrc`
- `package.json`
- `package-lock.json`
- `prisma.config.ts`
- `scripts/build.mjs`
- `src/lib/db.ts`

## Railway Dashboard Checklist

After pushing:

1. Clear Railway build cache if cache-related errors appeared.
2. Redeploy the latest commit.
3. Confirm Variables include runtime values:
   - `DATABASE_URL`
   - auth/session secrets used by the app
   - super admin bootstrap variables if needed
4. Watch for the next first failing line. Do not guess from old logs.

## Communication Template

When reporting back to the user, include:

- Root cause
- Files changed
- Verification run
- Commit hash if pushed
- Remaining Railway action, e.g. clear cache/redeploy/set variable

Example:

```text
แก้แล้วครับ

Root cause: Railway build ไม่ได้ลง devDependencies ทำให้ Next หา @tailwindcss/postcss ไม่เจอ
Changed: Dockerfile, railway.json
Verified: npm run build ผ่าน
Pushed: <commit>
Next: Clear Railway cache แล้ว Redeploy
```
