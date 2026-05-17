# Railway Deployment Guide

## สิ่งที่พร้อมแล้ว ✅

- [x] `railway.json` - Railway config
- [x] `/api/health` endpoint สำหรับ health check
- [x] `db.ts` รองรับ PostgreSQL + SQLite fallback
- [x] `next.config.ts` พร้อม deploy
- [x] `prisma/schema.prisma` ใช้ PostgreSQL provider

## ขั้นตอน Deploy

### 1. สร้าง Railway Project

1. ไปที่ [railway.app](https://railway.app)
2. Login ด้วย GitHub
3. กด **New** → **Project** → **Empty Project**
4. ตั้งชื่อโปรเจค (เช่น `demoproject`)

### 2. สร้าง PostgreSQL Database

1. ใน Railway dashboard กด **New** → **Database** → **PostgreSQL**
2. รอให้ database สร้างเสร็จ (~1-2 นาที)
3. ไปที่ **Variables** tab ของ database
4. คัดลอกค่า `DATABASE_URL` (จะอยู่ประมาณ: `postgresql://...`)

### 3. สร้าง App Service

1. กด **New** → **Empty Service**
2. ตั้งชื่อ (เช่น `demoproject-app`)
3. เลือก **Deploy from GitHub repo** หรือ **Upload Code**

#### Option A: Deploy จาก GitHub (แนะนำ)

1. Connect GitHub repo ของคุณกับ Railway
2. กด **New** → **Repository** → เลือก repo นี้
3. Railway จะ detect Next.js อัตโนมัติ

#### Option B: Upload Code

1. กด **New** → **Upload Files**
2. Upload ไฟล์ทั้งหมด (ยกเว้น node_modules, .next)

### 4. ตั้งค่า Environment Variables

ไปที่ **Variables** tab ของ App Service แล้ว set:

| Variable | ค่า | คำอธิบาย |
|----------|-----|----------|
| `DATABASE_URL` | URL จาก PostgreSQL instance | ที่คัดลอกจาก step 2 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Secret สำหรับ authentication |
| `AUTH_SECRET` | เหมือน `NEXTAUTH_SECRET` | Secret สำหรับ next-auth |
| `NEXTAUTH_URL` | `https://demoproject-production-cebc.up.railway.app` | URL ของ app (เปลี่ยนตามชื่อจริง) |

**วิธี generate secret:**
```bash
openssl rand -base64 32
```

หรือใช้ online generator: [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

### 5. Deploy

#### ถ้าใช้ GitHub:
- Railway จะ deploy อัตโนมัติเมื่อ push lên main branch

#### ถ้า upload code:
- กด **Deploy** manual

### 6. Run Database Migration

หลัง deploy สำเร็จ ไปที่ **Shell** tab แล้วรัน:

```bash
npx prisma migrate deploy
```

หรือถ้ายังไม่มี migrations directory:

```bash
npx prisma migrate dev --name init
```

### 7. ตรวจสอบ Health

ไปที่ **Logs** tab เพื่อดู deployment logs

เมื่อ deploy สำเร็จ จะเห็น:
```
GET /api/health 200 OK
```

## ปัญหาที่พบบ่อย

### 1. Build Failed - Prisma generate

```bash
npx prisma generate
```

### 2. Database Connection Error

ตรวจสอบว่า:
- `DATABASE_URL` ถูกต้อง
- PostgreSQL instance ยัง active
- ไม่มี firewall block

### 3. Auth Cookie ไม่ทำงาน

ตรวจสอบว่า `NEXTAUTH_URL` ตรงกับ URL จริงของ Railway

## หลัง Deploy สำเร็จ

1. ทดสอบ login: `https://your-app.railway.app/login`
2. ทดสอบ health: `https://your-app.railway.app/api/health`
3. ตรวจสอบ logs ถ้ามีปัญหา

## Custom Domain (Optional)

1. ไปที่ **Settings** → **Domains**
2. เพิ่ม custom domain
3. ตั้งค่า DNS record ตามที่ Railway บอก

## CI/CD (Optional)

สร้าง `.github/workflows/railway.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/railway-action@v2
        with:
          service: ${{ vars.RAILWAY_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```
