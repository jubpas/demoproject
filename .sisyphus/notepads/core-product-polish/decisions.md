# Decisions – Filter Bar Standardization

- Decision: Use the same filter bar pattern as project-manager for customer-manager and worker-team-manager to ensure consistency and reduce cognitive load for users.
- Decision: Introduce two new filter states for customers: hasProjects (ALL / WITH_PROJECTS / WITHOUT_PROJECTS) and hasQuotations (ALL / WITH_QUOTATIONS / WITHOUT_QUOTATIONS).
- Decision: Place filter bar controls in the DataPanel content area, and show a compact count badge in the DataPanel header to reflect filtered items vs total.
- Decision: Do not touch API/data fetching routes; only adjust client filtering logic and UI structure.
- Decision: Minimal dependencies; reuse existing Tailwind classes and structure; no new libraries.
