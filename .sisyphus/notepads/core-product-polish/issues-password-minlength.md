Date: 2026-05-05

- Issue: Password reset flow required minimum length 6 while register required 8.
- Decision: Align reset-password minimum length to 8 to maintain consistent security policy across auth flows.
- Risk: None identified beyond minor message updates; backward compatibility unaffected since this is a UI/validation rule.
