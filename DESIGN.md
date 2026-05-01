---
version: alpha
name: ไซต์งานโปร
description: A multi-organization construction and project management product with a dark, technical product-app aesthetic. The interface uses a near-black canvas (`#0f0f0f`), subtle gray-tinted surfaces, compact developer-tool geometry, and a single deep-electric-blue voltage (`#0007cd`) reserved for primary actions, active navigation, and controlled spotlight moments. Product dashboards, CRUD forms, reports, schedules, audit trails, and admin screens are the primary surfaces; marketing-style terminal visuals are optional accents for auth, onboarding, and future public landing pages.

colors:
  primary: "#0007cd"
  primary-active: "#0005a3"
  primary-glow: "#1a26ff"
  ink: "#ffffff"
  body: "#a8a8a8"
  body-strong: "#ffffff"
  muted: "#888888"
  muted-soft: "#666666"
  hairline: "#222222"
  hairline-soft: "#1a1a1a"
  hairline-strong: "#333333"
  canvas: "#0f0f0f"
  canvas-deep: "#000000"
  surface-card: "#181818"
  surface-card-elevated: "#222222"
  surface-strong: "#2a2a2a"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  accent-cyan: "#00d4ff"
  accent-violet: "#7b3aed"
  semantic-error: "#ff4d4d"
  semantic-success: "#33d17a"

typography:
  display-mega:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 72px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -2.16px
  display-xl:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -1.68px
  display-lg:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 44px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -1.32px
  display-md:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.96px
  display-sm:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.5px
  title-md:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.88px
    textTransform: uppercase
  code:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "'abcDiatype', ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  top-nav-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-strong}"
    typography: "{typography.nav-link}"
    height: 64px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary-dark:
    backgroundColor: "{colors.surface-card-elevated}"
    textColor: "{colors.body-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 40px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.body-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 9px 17px
    height: 40px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.button}"
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-strong}"
    typography: "{typography.display-mega}"
    padding: 96px
  terminal-mockup-grid:
    backgroundColor: "{colors.canvas-deep}"
    textColor: "{colors.body-strong}"
    typography: "{typography.code}"
    rounded: "{rounded.xl}"
    padding: 32px
  terminal-pane:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 20px
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.title-md}"
    rounded: "{rounded.xl}"
    padding: 28px
  toolkit-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body-strong}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 20px
  toolkit-icon:
    backgroundColor: "{colors.surface-card-elevated}"
    rounded: "{rounded.md}"
    size: 40px
  spotlight-glow-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body-strong}"
    typography: "{typography.display-md}"
    rounded: "{rounded.xl}"
    padding: 48px
  code-block:
    backgroundColor: "{colors.canvas-deep}"
    textColor: "{colors.body}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 20px
  badge-pill:
    backgroundColor: "{colors.surface-card-elevated}"
    textColor: "{colors.body-strong}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body-strong}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 44px
  search-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body-strong}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  cta-band-spotlight:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-strong}"
    typography: "{typography.display-lg}"
    padding: 96px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  footer-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 64px 48px
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
---

## Overview

ไซต์งานโปร is a product-first application for managing multiple organizations, projects, field tasks, schedules, customers, quotations, transactions, reports, members, and super-admin operations. The interface should feel like serious operational software: dark, precise, compact, and calm under heavy data density.

The base canvas is near-black `{colors.canvas}` (#0f0f0f) with white display text and soft gray body text. A single voltage of **deep electric blue** (`{colors.primary}` — #0007cd) carries primary CTAs, active navigation, important focus states, and rare atmospheric spotlight glows.

Typography should use the repository's available sans font as the implementation default. abcDiatype remains the brand reference only when a licensed font file is available. Code-like, audit, ID, CLI, or terminal surfaces should use the repository mono font or JetBrains Mono when available.

The page rhythm is monolithic and product-oriented: dark canvas top to bottom, with depth from brightness-step surface elevation rather than heavy shadows. The four-pane terminal-style mockup remains a visual accent for auth/onboarding/landing surfaces, not a required pattern for every in-product dashboard.

**Key Characteristics:**
- Single accent: `{colors.primary}` (#0007cd) for primary CTAs, active nav, focus accents, and spotlight glows.
- Single sans family in implementation; use current repo font unless licensed abcDiatype is added.
- Dark monolithic canvas: `{colors.canvas}` runs top to bottom; depth from `{colors.surface-card}` and `{colors.surface-card-elevated}` brightness steps.
- Product-first surfaces: dashboards, forms, filters, lists, reports, task boards, schedules, and admin CRUD must be clearer than decorative.
- Terminal-inspired visuals: optional accents for auth, onboarding, and future public landing pages.
- Compact developer-tool geometry: CTAs sit at `{rounded.md}` (8px), cards at `{rounded.lg}` or `{rounded.xl}`.
- Spotlight-glow atmospheric backdrop: use sparingly behind hero/auth/summary areas, not behind every card.

## Colors

### Brand & Accent
- **Sitework Blue** (`{colors.primary}` — #0007cd): Primary CTAs, active navigation, wordmark/accent marks, spotlight glow center.
- **Sitework Blue Active** (`{colors.primary-active}` — #0005a3): Press state.
- **Spotlight Glow Tone** (`{colors.primary-glow}` — #1a26ff): Brighter blue used inside radial atmospheric glows.
- **Accent Cyan** (`{colors.accent-cyan}` — #00d4ff): Sparingly on data-flow visualizations.
- **Accent Violet** (`{colors.accent-violet}` — #7b3aed): Inside specific product illustrations only.

### Surface
- **Canvas** (`{colors.canvas}` — #0f0f0f): Page floor — near-black.
- **Canvas Deep** (`{colors.canvas-deep}` — #000000): Pure black for terminal mockup grids and code blocks.
- **Surface Card** (`{colors.surface-card}` — #181818): Default content card.
- **Surface Card Elevated** (`{colors.surface-card-elevated}` — #222222): Terminal panes, secondary buttons.
- **Surface Strong** (`{colors.surface-strong}` — #2a2a2a): Dropdown menus.

### Hairlines
- **Hairline** (`{colors.hairline}` — #222222): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #1a1a1a): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #333333): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #ffffff): Display headlines.
- **Body** (`{colors.body}` — #a8a8a8): Default running-text — soft gray.
- **Body Strong** (`{colors.body-strong}` — #ffffff): Same as ink.
- **Muted** (`{colors.muted}` — #888888): Sub-titles, breadcrumbs.
- **Muted Soft** (`{colors.muted-soft}` — #666666): Disabled text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on blue CTAs.

### Semantic
- **Success** (`{colors.semantic-success}` — #33d17a): "Online", "active" indicators.
- **Error** (`{colors.semantic-error}` — #ff4d4d): Validation errors.

## Typography

### Font Family
The system runs **abcDiatype** (Lineto) across every text role. Code blocks switch to **JetBrains Mono**. Fallback: `ui-sans-serif, system-ui, sans-serif`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 72px | 500 | 1.05 | -2.16px | Homepage hero h1 |
| `{typography.display-xl}` | 56px | 500 | 1.05 | -1.68px | Subsidiary heroes |
| `{typography.display-lg}` | 44px | 500 | 1.1 | -1.32px | Section heads |
| `{typography.display-md}` | 32px | 500 | 1.15 | -0.96px | Sub-section heads |
| `{typography.display-sm}` | 24px | 500 | 1.25 | -0.5px | Card group titles |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Component titles |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Toolkit card titles |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body |
| `{typography.caption}` | 13px | 400 | 1.4 | 0 | Photo captions |
| `{typography.caption-uppercase}` | 11px | 600 | 1.4 | 0.88px | Section labels, badge pills |
| `{typography.code}` | 13px | 400 | 1.5 | 0 | Code blocks — JetBrains Mono |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | CTA pill labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu |

### Principles
- **Display weight stays at 500.** Confident but not display-bold.
- **One sans family across every role.** Use the repo's current sans font unless licensed abcDiatype is added.
- **Mono on every code/audit surface.** Use the repo's mono font or JetBrains Mono when available.

### Note on Font Substitutes
abcDiatype is a Lineto licensed typeface. For this repository, keep the current Next font implementation as the default unless a licensed abcDiatype file is added. If the project intentionally changes font later, **Inter** at weight 500 with letter-spacing -1.5% is the open-source substitute. Do not add a new font dependency only for visual parity without checking performance and licensing.

## Repository Token Mapping

Implementation should map these design tokens into `src/app/globals.css` before broad component migration:

| Design Token | CSS Variable | Value |
|---|---|---|
| `{colors.canvas}` | `--background` | `#0f0f0f` |
| `{colors.ink}` | `--foreground` | `#ffffff` |
| `{colors.surface-card}` | `--surface` | `#181818` |
| `{colors.surface-card-elevated}` | `--surface-elevated` | `#222222` |
| `{colors.surface-strong}` | `--surface-strong` | `#2a2a2a` |
| `{colors.hairline}` | `--border` | `#222222` |
| `{colors.hairline-strong}` | `--border-strong` | `#333333` |
| `{colors.primary}` | `--primary` | `#0007cd` |
| `{colors.primary-active}` | `--primary-active` | `#0005a3` |
| `{colors.primary-glow}` | `--primary-glow` | `#1a26ff` |
| `{colors.body}` | `--muted` | `#a8a8a8` |
| `{colors.muted-soft}` | `--muted-soft` | `#666666` |
| `{colors.semantic-success}` | `--success` | `#33d17a` |
| `{colors.semantic-error}` | `--error` | `#ff4d4d` |

Tailwind classes may use arbitrary values or CSS variables during migration, but shared components should gradually converge on the variables above to avoid hardcoded color drift.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) for major bands.

### Grid & Container
- Max content width: ~1200px.
- Editorial body: 12-column grid.
- Terminal mockup grid: 2×2 equal-size panes.
- Toolkit grid: 4-up at desktop, 2-up tablet, 1-up mobile.
- Footer: 5-column at desktop.

### Whitespace Philosophy
The dark canvas creates its own depth — whitespace can stay tight without feeling crowded. 96px between bands; 24px between cards inside a band.

## Elevation & Depth

The system uses **brightness-step elevation**: surfaces step up in brightness instead of casting drop shadows. Combined with subtle radial blue glows, this creates a focused dark-mode atmosphere.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#0f0f0f) | Body bands, footer |
| Recessed | `{colors.canvas-deep}` (#000000) | Terminal mockup grid background, code blocks |
| Card | `{colors.surface-card}` (#181818) | Default content cards |
| Card elevated | `{colors.surface-card-elevated}` (#222222) | Terminal panes, secondary buttons |
| Atmospheric glow | Radial gradient using `{colors.primary-glow}` | Hero spotlight backdrop |

### Decorative Depth
- **Spotlight glow backdrops** — radial blue gradient centered behind hero content.
- **Terminal-pane brightness ladder** — 2×2 mockup uses canvas-deep outer + surface-card-elevated panes.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | CTA buttons, form inputs |
| `{rounded.lg}` | 12px | Toolkit cards, code blocks, terminal panes |
| `{rounded.xl}` | 16px | Feature cards, terminal mockup grids |
| `{rounded.pill}` | 9999px | Section-label badges |
| `{rounded.full}` | 9999px | Avatar plates (rare) |

Compact developer-ergonomic radii — 8px CTAs, 12-16px cards. Signals "developer tool" rather than "consumer brand."

## Components

### Product App Shell

The primary application surface is the authenticated app shell, not a marketing top nav. Organization routes use `/[locale]/org/[orgSlug]/*`; super-admin routes use `/[locale]/admin/*`.

**Organization sidebar** — Background `{colors.canvas}`, border `{colors.hairline}`, active nav `{colors.primary}`, inactive text `{colors.body}`, hover surface `{colors.surface-card-elevated}`. Sidebar should remain compact and scannable because it contains many operational routes.

**Admin sidebar** — Same shell language as organization sidebar, with copy and context making the elevated privilege clear. Do not introduce a separate admin theme.

**Content canvas** — Use `{colors.canvas}` or a very close dark app background. Avoid large `bg-white` or `bg-slate-100` regions after migration.

**Context bar** — Use `{colors.surface-card}` with `{colors.hairline}` border for organization/user context. Keep it functional and low emphasis.

### Navigation

**`nav-link`** — 14px / 500 text. Active state uses `{colors.primary}` background and `{colors.on-primary}` text. Inactive state uses `{colors.body}` text and elevated-surface hover. Radius should be `{rounded.md}` or `{rounded.lg}` depending on density.

**`top-nav-dark`** — Optional future marketing/public navigation only. Background `{colors.canvas}`, text `{colors.body-strong}`, height 64px. Do not use marketing navigation patterns inside the authenticated org/admin app.

### Buttons

**`button-primary`** — The signature Sitework Blue CTA. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (14px / 500), padding 10px × 18px, height 40px, rounded `{rounded.md}` (8px).

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-secondary-dark`** — Surface-elevated secondary. Background `{colors.surface-card-elevated}`, text `{colors.body-strong}`.

**`button-outline`** — Transparent with 1px hairline-strong border.

**`button-tertiary-text`** — Inline text link.

### Hero & Atmospheric

**`hero-band`** — Guest, auth, onboarding, or future public homepage hero. Background `{colors.canvas}`, full-width display headline in `{typography.display-mega}` (72px / 500), subhead, two CTAs, and a spotlight-glow backdrop. For authenticated dashboards, prefer compact `page-header` and metric/data panels over large marketing heroes.

**`terminal-mockup-grid`** — The brand's strongest visual signature. 2×2 grid of dark code/output panels inside a `{rounded.xl}` (16px) container. Background `{colors.canvas-deep}`, padding 32px, gap 16px.

**`terminal-pane`** — Individual code/output panel inside the mockup grid. Background `{colors.surface-card}`, text `{colors.body}` in `{typography.code}`, rounded `{rounded.lg}` (12px), padding 20px.

**`spotlight-glow-card`** — Large feature card with centered display headline and a radial blue glow behind it. Background `{colors.surface-card}`, text `{colors.body-strong}` in `{typography.display-md}`, rounded `{rounded.xl}`, padding 48px.

### Cards

**`feature-card`** — 3-up benefit grid. Background `{colors.surface-card}`, text `{colors.body}`, type `{typography.title-md}`, rounded `{rounded.xl}`, padding 28px.

**`toolkit-card`** — 4-up toolkit grid (Slack, GitHub, Stripe, Notion, Linear, etc.). Background `{colors.surface-card}`, text `{colors.body-strong}`, type `{typography.title-sm}`, rounded `{rounded.lg}`, padding 20px. 40px square `{component.toolkit-icon}` top, toolkit name, one-line description.

**`toolkit-icon`** — Square icon plate. Background `{colors.surface-card-elevated}`, rounded `{rounded.md}`, 40px size.

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.lg}`, padding 24px.

**`page-header`** — Product page header for dashboard/admin/business routes. Background `{colors.surface-card}`, border `{colors.hairline}`, title `{colors.ink}`, description `{colors.body}`, eyebrow `{colors.primary}` or `{colors.muted}`. Use compact spacing and optional action slots. Do not use drop-shadow tiers.

**`metric-card`** — Dashboard metric surface. Background `{colors.surface-card}`, border `{colors.hairline}`, large value `{colors.ink}`, label as a small badge or muted caption. Semantic tone may tint the label or left accent, but the card background should stay dark.

**`data-panel`** — Standard container for lists, charts, forms, reports, and admin modules. Background `{colors.surface-card}`, header divider `{colors.hairline}`, title `{colors.ink}`, description `{colors.body}`, body content `{colors.body}`. Nested rows use `{colors.surface-card-elevated}` or transparent bordered rows.

**`list-row`** — For projects, customers, tasks, appointments, quotations, transactions, audit rows, and organization rows. Use elevated dark surface, 1px hairline border, 12px radius, and clear primary/secondary text hierarchy. Hover may lift by brightness step only.

### Code

**`code-block`** — Inline code/terminal block. Background `{colors.canvas-deep}`, text `{colors.body}` in `{typography.code}`, rounded `{rounded.lg}`, padding 20px.

### Forms

**`text-input`** — Background `{colors.surface-card}`, text `{colors.body-strong}`, rounded `{rounded.md}` (8px), padding 12px × 16px, height 44px.

**`search-input`** — Compact search field. Same surface and radius, smaller padding, 40px height.

**`filter-bar`** — Use dark elevated surface or transparent layout with compact controls. Search/select/date inputs should align to 40px height where possible. Clear-filter actions use secondary/outline treatment, not primary blue.

**`form-label`** — 14px / 500, `{colors.body}` or `{colors.body-strong}` depending on density. Avoid dark text classes on dark surfaces.

**`validation-state`** — Errors use `{colors.semantic-error}` with a dark translucent background and strong contrast. Success uses `{colors.semantic-success}`. Warnings use the product semantic warning color guidance below.

### Tags & Badges

**`badge-pill`** — Small uppercase pill. Background `{colors.surface-card-elevated}`, text `{colors.body-strong}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 10px.

**`status-badge`** — Product status badge for workflow states. Keep the badge compact and legible on dark surfaces. Use semantic color for text/ring/accent only; avoid filling large areas with bright colors.

### Product Semantic States

Use semantic colors to communicate workflow state without creating new brand colors:

| State | Use | Treatment |
|---|---|---|
| Success | active, completed, paid, approved | `{colors.semantic-success}` text/ring/accent on dark surface |
| Error | destructive, failed, overdue critical | `{colors.semantic-error}` text/ring/accent on dark surface |
| Warning | pending, waiting approval, overdue soft | amber text/ring/accent on dark surface; keep amber secondary to blue |
| Neutral | draft, archived, cancelled, no data | `{colors.muted}` text with `{colors.surface-card-elevated}` badge |
| Brand | primary create/save actions and active nav | `{colors.primary}` fill, not general status decoration |

Warning is allowed for operational clarity even though it is not a brand accent. It should never compete with primary blue CTAs.

### Product Data Surfaces

Reports, audit logs, schedules, budget lines, and transaction histories should prioritize readability:

- Use compact rows with clear separation rather than heavy card shadows.
- Keep numeric values right-aligned where table-like layouts exist.
- Use mono font for IDs, codes, timestamps, diffs, and audit metadata when it improves scanning.
- Use empty states that explain the next productive action.
- Keep action buttons grouped and predictable: primary for create/save, secondary for view/cancel, destructive for delete/archive.

### CTA / Footer

**`cta-band-spotlight`** — Pre-footer band. Background `{colors.canvas}` with centered radial spotlight glow. Display headline + single primary CTA pill. 96px padding.

**`footer-dark`** — Closing footer. Background `{colors.canvas}`, text `{colors.body}`. 5-column link list. 64×48px padding.

**`footer-link`** — Background transparent, text `{colors.body}`, type `{typography.body-sm}`.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` for primary CTAs, active navigation, wordmark/accent marks, and spotlight glows.
- Use `{rounded.md}` (8px) for every CTA — not full pills.
- Use brightness-step ladder for elevation; avoid drop shadows.
- Pair guest/auth/landing heroes with a centered radial blue spotlight glow.
- Render code, CLI commands, IDs, timestamps, and audit diffs in mono via `{typography.code}`.
- Use the 2×2 terminal-mockup grid as an optional future public homepage/auth visual anchor.

### Don't
- Don't introduce a secondary brand color. Cyan and violet are illustrative-only.
- Don't use full pills on CTAs.
- Don't drop display weight to 400.
- Don't add drop shadow tiers.
- Don't use canvas-deep (#000000) outside terminal/code surfaces.
- Don't extract a CTA color from a third-party widget (cookie consent, OneTrust). The brand's CTA color is what appears on actual page CTAs.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Product shell stacks; sidebar navigation wraps/scrolls; forms become 1-column; hero h1 72→36px where hero exists. |
| Tablet | 640–1024px | Product forms can use 2 columns; dense lists remain single column when readability requires it. |
| Desktop | 1024–1280px | Full sidebar + content shell; dashboard grids and data panels can use 2-4 columns depending on density. |
| Wide | > 1280px | Content caps at 1200px. |

### Touch Targets
- Primary CTA at 40px height — at WCAG AA, padded for AAA.
- Search input at 40px.

### Collapsing Strategy
- Organization/admin navigation must remain reachable on mobile via stacked, scrollable, or future drawer navigation.
- Terminal mockup 2×2 grid collapses to a single pane on mobile when used.
- Product grids collapse from 4-up → 2-up → 1-up based on content density, not decoration.
- Hero spotlight glow stays at every breakpoint.

## Iteration Guide

1. Focus on a single component at a time.
2. CTAs default to `{rounded.md}` (8px). Cards use `{rounded.lg}` or `{rounded.xl}`.
3. Variants live as separate entries inside `components:`.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover, focus, disabled, and loading states should be documented when a component is migrated.
6. Keep display at 500, body at 400/600, and mono on code/audit surfaces.
7. Sitework Blue stays scarce and action-oriented.

## Known Gaps

- abcDiatype is licensed; keep the repo's current font unless a licensed font file is added or a deliberate font migration is planned.
- Product table/list density still needs implementation examples after the first dark-theme migration.
- Form validation, loading, disabled, and destructive states need final screenshots from the actual app.
- Audit readability, report filters, task/schedule density, and transaction rows need product-specific polish beyond this alpha guide.
- Thai/English copy length can affect layout and should be checked on every migrated page.
