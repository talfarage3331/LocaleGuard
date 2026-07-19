# LocaleGuard Monetization & Product Strategy

## Core Product Framing
- **Solo-Dev Paradigm**: Keep the paying unit below the corporate card approval threshold (<$300/mo) to remove procurement friction, while making the tool deeply embedded in the CI workflow so it becomes impossible to rip out.
- **The Boundary Principle**: The core CLI engine and code checking are FREE. We monetize memory, collaboration, governance, organization features, and intelligence.

---

## 1. Ideal Customer Profile (ICP) & Value Pitch

### Who Uses vs. Who Pays
- **Daily Users**: Individual frontend/full-stack engineers who hit i18n bugs. They use the free CLI, act as the distribution channel, and advocate for the tool.
- **Economic Buyers (Champions)**: Tech Leads and Engineering Managers (EMs). They own CI quality, PR velocity, and production hotfix pain. They hold a budget of <$300/mo and can expense it without a committee.

### Target Segment
Product-led B2B SaaS companies (Series A–C), 15–150 engineers, shipping to 5+ locales, on a JS/TS stack with i18next or FormatJS, using GitHub Actions for CI.

### High-Cost Pains (ROI Pitch)
1. **Revenue Leakage**: Broken localized UIs suppress conversion in acquired foreign markets.
2. **Wasted Engineering Hours**: Teams burn 2–3 hours/week ($1,000–$1,700/mo value) tracing translation keys manually.
3. **Release Risk**: Production hotfixes due to translation errors trigger emergency rollbacks and on-call pain.
4. **Visibility Gap**: EMs lack visibility into multi-repo i18n health and need a clean dashboard metric.

---

## 2. Pricing Matrix & Feature Gates

### Primary Metrics
- **Primary Gate**: Seats (Scales with company size).
- **Secondary Gate**: Connected Private Repositories (Forces the Solo -> Team tier upgrade).
- **Metered Element**: AI-assisted fix suggestions (To manage variable API costs).

| Feature / Tier | Free ($0) | Pro ($29/mo flat | $290/yr) | Team ($12/seat/mo annual | $15 monthly) | Enterprise (Custom, $1,500/mo+) |
| :--- | :--- | :--- | :--- | :--- |
| **Seats** | 1 | Up to 5 | Unlimited | Unlimited |
| **Private Repos** | 1 | Up to 5 | Unlimited | Unlimited |
| **Public Repos** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Core Checks & Basic PRs** | Yes | Yes | Yes | Yes |
| **Cloud Dashboard History** | Basic | 90-Day | Unlimited + Advanced Analytics | Unlimited |
| **New-Only PR Blocking** | No | Yes | Yes | Yes |
| **Slack/Teams Alerts** | No | 1 Workspace | Unlimited + Weekly EM Digest | Unlimited |
| **Org-Wide Policy Rules** | No | No | Yes | Yes |
| **AI Fix Suggestions** | No | No | Metered Quota (500/mo) | Unlimited |
| **Enterprise Features** | No | No | No | SSO/SAML, SCIM, Audit logs, Self-Host |

---

## 3. Step-by-Step Technical Implementation Plan

### Phase 1: Database Schema Migration for Plan Tiers
- **Objective**: Extend the Drizzle ORM PostgreSQL schema to track accounts, active tiers, and usage limits.
- **Tasks**:
  1. Add a `plan` enum field (`free`, `pro`, `team`, `enterprise`) defaulting to `free` on the relevant user or workspace table.
  2. Add an `allowed_repos` integer field to map hard subscription thresholds (Free = 1, Pro = 5, Team/Enterprise = null).
  3. Ensure all changes strictly maintain system-wide type safety.
- **Constraint**: Strictly follow the project's migration laws in `CLAUDE.md`. Do NOT run `drizzle-kit push`. Generate SQL files via `db:generate` and let the user execute `db:migrate` locally.

### Phase 2: Ingestion API Quota Enforcement
- **Objective**: Lock the Paywall down at the ingestion API layer (`/api/v1/scans`) where GitHub Actions check in.
- **Tasks**:
  1. On incoming run, check the organization/user plan and query the DB for the count of unique private repositories already connected.
  2. If the plan is `free` and they attempt to ingest a 2nd unique private repository, block the scan and return a `403 Forbidden` response.
  3. Add a professional, clear error payload guiding the developer/manager to upgrade to Pro ($29/mo) to unlock up to 5 repositories.

### Phase 3: Premium Frontend UI Overhaul (Hero & Value Hooks)
- **Objective**: Elevate the web landing page into a top-tier DevTool SaaS interface using Next.js App Router and Tailwind CSS v4.
- **Tasks**:
  1. Implement a premium, dark-mode first design system with subtle glowing animated Aurora gradients and a faint background grid (`bg-grid-white/[0.02]`).
  2. Refactor the Hero text to target EM/Tech Lead pain points (ROI, hours saved, preventing broken localized UX).
  3. Build an interactive code/terminal preview block showcasing a mock GitHub PR comment decoration catching an i18n plural drift.
  4. Create a clean interactive grid highlighting core features (Zero-dependency check, New-Only blocking, Slack alerting).

### Phase 4: Stateful Interactive Pricing Grid
- **Objective**: Implement a high-converting, dynamic pricing interface mirroring the exact monetization model.
- **Tasks**:
  1. Create a 3-tier pricing structure component matching Free, Pro, Team, and Enterprise.
  2. Build a functional Monthly/Annual Toggle switch that dynamically updates the Pro tier flat rate ($29/mo vs $290/yr) and displays savings flags.
  3. Build a functional dynamic "Seat Slider" inside the Team tier column ($12/seat/mo annual) enforcing a visual minimum floor of 5 seats ($60/mo minimum), dynamically updating the total as the slider moves.
  4. Complete full type checks and ensure `pnpm check` outputs a fully green state.