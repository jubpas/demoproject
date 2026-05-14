# CI/CD Setup Guide — Railway + GitHub Actions

## 📊 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Git Push   │────▶│ GitHub CI/CD │────▶│ Railway  │
│  (main)     │     │  (Actions)   │     │  Auto    │
└─────────────┘     └──────────────┘     └──────────┘
                      1. Lint
                      2. Test
                      3. Build
                      4. Deploy
```

## 📁 ไฟล์ที่สร้างแล้ว

### 1. `.github/workflows/ci.yml` — CI Pipeline
ตรวจสอบโค้ดทุกครั้งที่ push หรือสร้าง PR:
- ✅ Install dependencies
- ✅ Prisma generate
- ✅ ESLint
- ✅ TypeScript type check
- ✅ Run tests (Vitest)
- ✅ Build

### 2. `.github/workflows/cd.yml` — CD (Deploy to Railway)
deploy อัตโนมัติเมื่อ push ไป branch `main`:
- ✅ Deploy ไป Railway อัตโนมัติ

### 3. `railway/railway.json` — Railway Configuration
- ✅ Build command
- ✅ Start command
- ✅ Health check

### 4. `.env.example` — Environment Template
- ✅ Database URL
- ✅ Auth secrets
- ✅ NextAuth URL

---

## 🚀 ขั้นตอนการตั้งค่า (Step by Step)

### ขั้นตอนที่ 1: Push code ขึ้น GitHub

```bash
git add .
git commit -m "chore: add CI/CD configuration"
git push origin main
```

### ขั้นตอนที่ 2: ตั้งค่า Railway

1. เข้า [railway.app](https://railway.app)
2. New Project → Import from GitHub
3. เลือก repository นี้
4. Railway จะ detect Next.js อัตโนมัติ

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables ใน Railway

ไปที่ **Railway Dashboard → Settings → Variables**

| Variable | ค่า |
|----------|-----|
| `DATABASE_URL` | `file:./dev.db` |
| `AUTH_SECRET` | `<generate-random-string>` |
| `NEXTAUTH_SECRET` | `<generate-random-string>` |
| `NEXTAUTH_URL` | `https://your-app-name.railway.app` |

**วิธี generate secret:**
```bash
# ใช้ PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# หรือใช้ https://generate-secret.now.sh/32
```

### ขั้นตอนที่ 4: ตั้งค่า GitHub Secrets

ไปที่ **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | ค่า |
|---|---|
| `RAILWAY_TOKEN` | Railway API token |
| `RAILWAY_SERVICE_ID` | Railway Service ID |

**วิธีหา:**
1. **Railway Token:** เข้า Railway Dashboard → Account Settings → API Tokens → Generate Token
2. **Service ID:** เข้า Railway Dashboard → Service Settings → Service ID (copy จาก URL หรือ settings)

### ขั้นตอนที่ 5: ทดสอบ

```
1. สร้าง PR → ดูว่า CI workflow ทำงาน
2. Merge ไป main → ดูว่า CD workflow deploy
```

---

## 📋 Flow ที่เกิดขึ้น

### เมื่อสร้าง/push PR:
```
1. GitHub Actions ทำงาน
2. npm ci
3. npx prisma generate
4. npm run lint
5. npx tsc --noEmit
6. npm run test:run
7. npm run build

ถ้าทุก step ผ่าน → PR merge ได้
ถ้ามี error → PR merge ไม่ได้
```

### เมื่อ merge ไป main:
```
1. GitHub Actions ทำงาน (เหมือน PR)
2. ถ้าผ่าน → Deploy ไป Railway
3. Railway:
   - Pull latest code
   - npm ci
   - npx prisma generate
   - npm run build
   - Restart app

✅ Live at https://your-app.railway.app
```

---

## ⚠️ หมายเหตุสำคัญ

### SQLite บน Railway
- Railway จัดการ SQLite file ให้เอง (persistent storage)
- ไม่ต้องตั้งค่าอะไรเพิ่ม
- Data จะไม่หายเมื่อ redeploy

### Environment Variables
- `.env` → ใช้ local (ไม่ push ขึ้น git)
- `.env.example` → template (push ขึ้น git ได้)
- Railway Secrets → production (set ใน Railway dashboard)

### Next.js on Railway
- Railway detect Next.js อัตโนมัติ
- ไม่ต้องสร้าง Dockerfile
- Auto-build พร้อม deploy

### Health Check
- ถ้าไม่มี `/health` endpoint Railway จะใช้ `/` แทน
- ไม่เป็นอันตราย ถ้าไม่มี health endpoint

---

## 🔧 Troubleshooting

### CI fails: "Module not found"
```bash
# ลบ node_modules แล้ว install ใหม่
rm -rf node_modules
npm ci
```

### CI fails: "Prisma generate error"
```bash
# ตรวจสอบ prisma/schema.prisma
npx prisma validate
```

### Railway deploy fails
```bash
# ดู logs ใน Railway Dashboard
# มักเป็นเพราะ:
# 1. Environment variables ไม่ครบ
# 2. Build command error
# 3. Database URL ไม่ถูกต้อง
```

### Test fails
```bash
# ตรวจสอบ test files
npm run test:run
```

---

## 📚 References

- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Next.js on Railway](https://railway.app/templates/nextjs)
- [Prisma Deploy](https://www.prisma.io/docs/concepts/database/travelers/deploy-to-production)
