## Problems / uncertainties
- Exact signature of requireOrganizationAccess in this codebase (params vs request-first) needs confirmation to avoid runtime type errors.
- If orgSlug does not map to an organization, we should return 404 instead of 500; current code returns 500 in catch block – consider adjusting with explicit checks.
- verify that Prisma models and fields exist exactly as referenced (AuditLog, Project, Customer, Quotation, ProjectTask) with the expected relations.
- Ensure the environment (SQLite) supports the selected Prisma operations at scale; consider performance implications for larger datasets.
