Date: 2026-05-05

- Fixed password policy mismatch: reset-password minimum length updated from 6 to 8 to match register.
- Updated related messages:
  - src/messages/th.ts: passwordPlaceholder and passwordTooShort now reflect 8-character minimum.
  - src/messages/en.ts: passwordPlaceholder and passwordTooShort now reflect 8-character minimum.
- Updated code:
  - src/app/api/reset-password/route.ts: change length check from < 6 to < 8; update Thai/English error messages accordingly.
- Verification:
  - Built app with `npx next build` successfully after changes.
