# Issues / blockers during filter bar standardization

- LSP diagnostics could not be run in the current environment due to missing TypeScript language server. Build verification succeeded via Next.js build, but editor tooling may be unavailable.
- Minor UI alignment considerations when placing multiple filter controls inside DataPanel actions; resolved by placing filter bar inside panel content to mirror project-manager pattern.
- No data model changes required; avoided API changes.
- Added client-side CSV export feature across transactions and projects; no API changes needed, but ensure build verification passes after changes.
