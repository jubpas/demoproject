# AI Plan: vLLM Assistant Blueprint

อัปเดตล่าสุด: 2026-05-06  
เจ้าของแผน: Codex  
สถานะ: Ready for future implementation

## 1. Objective

เอกสารนี้ใช้เป็น technical blueprint สำหรับเพิ่ม AI assistant เข้าไปในระบบบริหารองค์กรและโครงการ โดยกำหนดชัดเจนว่า:

1. AI ต้องผูกกับข้อมูลจริงในระบบ
2. `vLLM API` เป็น model serving layer หลัก
3. business calculation ต้องเกิดในแอปก่อน แล้วค่อยส่ง summary เข้า model
4. ทุก AI response ต้องมีขอบเขตตาม organization, role, และ audit ได้

เอกสารนี้ตั้งใจให้ทีมเปิดแล้วสามารถแยกงาน implement ได้ทันที โดยไม่ต้องตีความ roadmap ใหม่รอบหนึ่ง

## 2. Product Principles

- AI เป็น assistant ไม่ใช่ auto-operator
- AI ช่วยสรุป เตือน วิเคราะห์ และร่างข้อความก่อน
- AI ไม่ควรอนุมัติงบ อนุมัติคำขอ หรือแก้ข้อมูลธุรกิจเองโดยไม่มีคนยืนยัน
- ตัวเลขจริง เช่น budget usage, overdue count, labor cost, quotation total ต้องคำนวณใน server
- สิ่งที่ model ทำคืออธิบาย จัดลำดับความสำคัญ สร้าง narrative และตอบคำถามจาก context ที่คุมแล้ว

## 3. Scope by Phase

### Phase A: High-value operational assistant

1. Project summary assistant
2. Budget and risk summary assistant
3. Daily / weekly digest
4. Smart alerts
5. Drafting assistant สำหรับ note, follow-up, report summary

### Phase B: Predictive and decision support

1. Budget overrun risk
2. Schedule delay risk
3. Project health ranking
4. Quotation expiry / conversion insight
5. Workforce allocation suggestion
6. Wage impact estimation

### Phase C: Action-oriented assistant

1. Chat with organization data
2. Create follow-up task from prompt
3. Generate executive summary from filter/date range
4. Explain approval queue and audit logs

## 4. Suggested UI Entry Points

### Dashboard

- daily briefing card
- top risks card
- budget watch summary
- AI digest drawer or panel

### Project detail

- project summary block
- next-action suggestions
- budget concern explanation
- schedule risk summary

### Reports

- AI-generated narrative from current filters
- anomaly explanation
- executive summary export text

### Worker teams / work logs

- manpower recommendation
- wage impact explanation
- attendance / productivity summary

### Quotations

- expiry watch
- follow-up message draft
- customer-ready summary

## 5. Proposed Architecture

### 5.1 App layer

แนะนำให้เพิ่ม AI route handlers ภายใต้ org scope:

- `src/app/api/org/[orgSlug]/ai/project-summary/route.ts`
- `src/app/api/org/[orgSlug]/ai/budget-summary/route.ts`
- `src/app/api/org/[orgSlug]/ai/digest/route.ts`
- `src/app/api/org/[orgSlug]/ai/alerts/route.ts`
- `src/app/api/org/[orgSlug]/ai/draft/route.ts`
- `src/app/api/org/[orgSlug]/ai/chat/route.ts`

แนวทาง:

- แต่ละ endpoint รับ intent เดียวให้ชัด
- แยก read-only summary endpoints ออกจาก action endpoints
- ทุก endpoint ต้องเรียก auth helper และ organization membership check ก่อน query

### 5.2 AI service layer

แนะนำโครงสร้าง:

- `src/lib/ai/client.ts`
- `src/lib/ai/config.ts`
- `src/lib/ai/prompt-builders.ts`
- `src/lib/ai/context-builders.ts`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/logging.ts`
- `src/lib/ai/guards.ts`

บทบาท:

- `client.ts`: เรียก `vLLM API`
- `config.ts`: model name, timeout, retry, token limits
- `prompt-builders.ts`: prompt templates ตาม use case
- `context-builders.ts`: query + summarize Prisma data เป็น structured payload
- `schemas.ts`: validate response shape
- `logging.ts`: เก็บ prompt intent, context summary, output metadata
- `guards.ts`: role check, organization scope, feature flag

### 5.3 vLLM API layer

สมมติฐานหลัก:

- ใช้ `vLLM API` แบบ OpenAI-compatible request/response shape
- เก็บค่า config ใน env เช่น:
  - `VLLM_API_BASE_URL`
  - `VLLM_API_KEY`
  - `VLLM_MODEL_SUMMARY`
  - `VLLM_MODEL_ANALYSIS`
  - `VLLM_TIMEOUT_MS`

ข้อดีของแนวนี้:

- เปลี่ยน model ได้ง่าย
- แยก use case summary กับ analysis ได้
- ทำ fallback policy ได้โดยไม่กระทบ UI layer มาก

### 5.4 Retrieval and context strategy

แนวคิดสำคัญ:

- query จาก Prisma ตาม organization scope ก่อน
- aggregate เป็น summary payload
- ส่งเข้า model เฉพาะข้อมูลจำเป็น

ไม่ควรส่ง:

- raw rows ทั้งชุดโดยไม่กรอง
- ข้อมูลข้ามองค์กร
- field อ่อนไหวที่ไม่เกี่ยวกับคำถาม

รูปแบบ context ที่แนะนำ:

```json
{
  "organization": {
    "id": "org_123",
    "name": "Demo SitePro"
  },
  "asOf": "2026-05-06T09:00:00+07:00",
  "filters": {
    "projectId": "proj_123"
  },
  "metrics": {
    "budgetPlanned": 1200000,
    "budgetActual": 860000,
    "budgetUsagePct": 71.67,
    "overdueTasks": 3,
    "openApprovals": 2
  },
  "highlights": [
    "งานระบบไฟฟ้าล่าช้ากว่าแผน 5 วัน",
    "หมวด Labor ใช้ไปมากกว่าค่าเฉลี่ยโครงการก่อนหน้า"
  ]
}
```

## 6. Deterministic Calculation Boundary

สิ่งที่แอปต้องคำนวณเอง:

- budget planned / actual / variance / usage %
- overdue task counts
- quotation totals / expiry days
- worker assignment estimated cost
- wage daily vs monthly normalized values
- approval queue counts
- work log counts by status

สิ่งที่ LLM ช่วยทำ:

- สรุปความหมายของตัวเลข
- จัดลำดับสิ่งที่ควรโฟกัส
- เขียน digest / note / follow-up / executive summary
- อธิบายความเสี่ยงเป็นภาษาคน

## 7. Endpoint Drafts

### `POST /api/org/[orgSlug]/ai/project-summary`

Input:

```json
{
  "projectId": "proj_123",
  "locale": "th"
}
```

Output:

```json
{
  "summary": "โครงการอยู่ในช่วงดำเนินงาน...",
  "riskLevel": "medium",
  "focusPoints": [
    "ติดตามงานค้าง 3 งาน",
    "ตรวจหมวดค่าแรงที่ใช้เกินแผน"
  ],
  "metrics": {
    "budgetUsagePct": 71.67,
    "overdueTasks": 3
  }
}
```

### `POST /api/org/[orgSlug]/ai/budget-summary`

Input:

```json
{
  "projectId": "proj_123",
  "compareMode": "budget-vs-actual",
  "locale": "th"
}
```

### `POST /api/org/[orgSlug]/ai/digest`

Input:

```json
{
  "period": "daily",
  "locale": "th"
}
```

### `POST /api/org/[orgSlug]/ai/alerts`

Input:

```json
{
  "scope": "dashboard",
  "locale": "th"
}
```

### `POST /api/org/[orgSlug]/ai/draft`

Input:

```json
{
  "kind": "customer-follow-up",
  "projectId": "proj_123",
  "quotationId": "quo_123",
  "tone": "professional",
  "locale": "th"
}
```

### `POST /api/org/[orgSlug]/ai/chat`

Input:

```json
{
  "message": "สรุปโครงการนี้ให้หน่อย",
  "projectId": "proj_123",
  "locale": "th"
}
```

หมายเหตุ:

- `chat` ควรมาทีหลังสุด
- Phase แรกควรใช้ intent-specific endpoints ก่อน เพราะคุมคุณภาพและ permission ได้ง่ายกว่า

## 8. Prompt Pattern

แนะนำ prompt structure เดียวกันทุก endpoint:

1. system instruction
2. role and guardrails
3. organization-safe context
4. explicit output schema
5. locale/tone requirement

ตัวอย่างแนว system prompt:

```text
You are an operations assistant for a multi-organization project management system.
Use only the provided context.
Do not invent numbers.
Separate facts from estimates.
Respond in Thai when locale is th.
```

## 9. Response Validation

ทุก endpoint ควร parse response เป็น structured object ก่อนส่งกลับ UI

ตัวอย่าง fields ที่ควรมี:

- `summary`
- `riskLevel`
- `focusPoints`
- `recommendedActions`
- `citations`
- `disclaimer`

ถ้า parse ไม่ผ่าน:

- fallback เป็น error แบบ user-friendly
- log raw response ไว้ภายใน
- UI ไม่ควรพังทั้งหน้า

## 10. Security and Permissions

กฎขั้นต่ำ:

- ทุก AI endpoint ต้องตรวจ session
- ต้องตรวจ membership ของ `orgSlug`
- ต้อง respect role เช่น member บางคนอาจเห็นได้เฉพาะ project ที่เกี่ยวข้อง
- ห้ามใช้ context ของ organization อื่นใน prompt เดียวกัน
- ห้ามส่งข้อมูล PII หรือ financial detail ที่ไม่เกี่ยวกับ intent

แนะนำเพิ่ม feature flag:

- `aiAssistantEnabled`
- `aiChatEnabled`
- `aiPredictionEnabled`

## 11. Logging and Audit

แนะนำเก็บ log ระดับ application อย่างน้อย:

- user id
- organization id
- intent
- target entity ids
- timestamp
- model name
- latency
- prompt hash หรือ context summary
- response status

ถ้าภายหลังต้อง trace เชิงลึก ค่อยเพิ่ม Prisma model เช่น `AiInteractionLog`

แนวคิดสำคัญ:

- แยก generated text ออกจาก system truth
- แสดง `based on data as of ...`
- log เฉพาะ summary payload ไม่ควร log sensitive raw payload มากเกินจำเป็น

## 12. UX Guidance

ข้อความ AI ควรมี 3 ชั้น:

1. summary สั้น
2. facts / metrics ที่รองรับ
3. suggested next actions

ป้ายกำกับที่ควรมี:

- `AI summary`
- `Estimate`
- `Based on current data`
- `Needs review`

AI output ที่เป็น prediction ต้องติดป้ายว่าเป็น estimate เสมอ

## 13. Failure and Fallback Rules

กรณี `vLLM API` ล่มหรือช้า:

- timeout แล้วตอบข้อความ fallback
- UI แสดงว่าขณะนี้ AI ไม่พร้อม แต่ข้อมูลหลักในหน้าใช้งานต่อได้
- dashboard หรือ detail page ต้องไม่ถูก block เพราะ AI

ลำดับ fallback:

1. retry 1 ครั้งสำหรับ transient error
2. ถ้ายัง fail ให้ return friendly error
3. log เพื่อดูภายหลัง

## 14. Suggested Implementation Order

1. สร้าง `src/lib/ai/config.ts` และ `client.ts`
2. สร้าง `context-builders.ts` สำหรับ dashboard/project summary
3. ทำ `project-summary` endpoint
4. ทำ `budget-summary` endpoint
5. ทำ `digest` endpoint
6. ผูก UI แบบ read-only ใน dashboard และ project detail
7. เพิ่ม `draft` endpoint
8. เพิ่ม prediction endpoints
9. ค่อยเปิด `chat` endpoint

## 15. Test and Evaluation Checklist

### Functional

- response schema parse ได้
- timeout/fallback ทำงาน
- locale `th` / `en` ตอบถูกภาษา
- org scope ไม่รั่ว

### Quality

- summary อ้างอิง metric จริง
- ไม่มั่วตัวเลข
- แยก fact กับ estimate
- recommended actions ใช้งานได้จริง

### Security

- user ข้าม org เรียกไม่ได้
- role ต่ำเห็นข้อมูลเกินสิทธิ์ไม่ได้
- logs ไม่มี raw sensitive payload เกินจำเป็น

## 16. Open Decisions for Later

- จะใช้ Prisma model สำหรับ `AiInteractionLog` ตั้งแต่ Phase A หรือเก็บ app log ก่อน
- จะมี AI settings per organization หรือยัง
- จะรองรับ streaming response หรือไม่
- จะมี per-feature model selection หรือ model เดียวก่อน
- จะมี user feedback เช่น thumbs up/down สำหรับ AI output หรือไม่

## 17. Definition of Ready

เริ่ม implement AI ได้เมื่อ:

- demo data พร้อมสำหรับ summary/risk use cases
- deterministic metric helpers พร้อม
- permission scope ชัด
- env สำหรับ `vLLM API` พร้อม
- UI จุดแรกถูกเลือกแล้วอย่างน้อย 1 จุด เช่น dashboard หรือ project detail

## 18. Related Documents

- [project-plan.md](J:/devRepo/demoNextjs/demoproject/project-plan.md)
- [task.md](J:/devRepo/demoNextjs/demoproject/task.md)
- [test-plan.md](J:/devRepo/demoNextjs/demoproject/test-plan.md)
