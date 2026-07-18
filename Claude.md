# CLAUDE.md

Guidance for Claude (and Claude Code) when working in the **LocaleGuard** repository.
Read this fully before making changes. When something here conflicts with what you infer from the code, prefer this file and flag the discrepancy.

---

## Project Guide

**Start here.** LocaleGuard is a **pnpm-workspaces monorepo**. Before touching anything:
1. Read **Overview** to know what the product is (and is not).
2. Use the **repo map** below to find where things live.
3. Follow **Core Commands** to build/test/verify — never report work done without running the verification gate.
4. Respect the **open-core boundary** and the **Database & Security Rules** — these are hard constraints, not suggestions.

### Repo map
```
localeguard/
├── packages/
│   ├── core/        @localeguard/core     (MIT, published)   ← the engine
│   ├── cli/         @localeguard/cli       (MIT, published)   ← `localeguard` command
│   └── action/      @localeguard/action    (MIT, published)   ← GitHub Action wrapper
├── apps/
│   └── web/         @localeguard/web       (PROPRIETARY, private) ← SaaS dashboard + API
├── fixtures/                                                   ← golden test catalogs
├── package.json                                                ← root scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── biome.json                                                  ← lint + format config
└── CLAUDE.md
```

| Location | What lives here / where to look |
|---|---|
| `packages/core/src/parsers/` | Input adapters (i18next JSON, FormatJS, `.po`, Rails/Django YAML). Each normalizes files into the shared `Catalog` type. **Add a new format here.** |
| `packages/core/src/rules/` | One file per check (`plural-completeness.ts`, `icu-validity.ts`, `placeholder-consistency.ts`, `byte-overflow.ts`, `missing-keys.ts`). Each rule is pure: `(catalogs, config) => Finding[]`. **Add a new check here.** |
| `packages/core/src/reporters/` | Output formatters: `console`, `json`, `sarif`, `html`. **SARIF is load-bearing** — it feeds GitHub Code Scanning. |
| `packages/core/src/types.ts` | Shared contract (`Catalog`, `Entry`, `Finding`, `PluralCat`). |
| `packages/core/src/engine.ts` | The pipeline: `parse → run rules → collect findings → report`. |
| `packages/cli/` | `commander` CLI + `cosmiconfig` config. Sets CI **exit codes**. Thin wrapper over `core`. |
| `packages/action/` | GitHub Action (`@actions/core`, `@actions/github`). Runs the CLI, uploads SARIF, posts PR comment. |
| `apps/web/` | **Proprietary SaaS.** The paid layer: history dashboards, multi-repo, hosted config, PR bot, billing. |
| `fixtures/` | Golden catalogs per language (`en, ru, pl, ar, ja, zh, cs, fr, de, he`) with known-good and known-bad cases. |

### Open-core boundary (hard rule)
`core`, `cli`, `action` are **MIT and drive adoption** — keep them fully functional standalone. All monetized logic (persistence, multi-repo, collaboration, billing) lives **only** in `apps/web`. Never move SaaS logic into an MIT package, and never make an MIT package depend on `apps/web`.

---

## Overview

LocaleGuard is a **CI-first tool that detects silent i18n *logic* bugs** in translation catalogs — the kind that pass English tests, break in complex languages, and only surface in production.

It is **not** a TMS (Lokalise/Crowdin/Phrase manage strings) and **not** a visual testing tool (Percy/Applitools test pixels). It fills the gap none of them cover: the **functional correctness of localized logic**.

**MVP wedge — what we check:**
1. **Plural completeness** — every plural key has exactly the CLDR plural categories its target language requires (`one/two/few/many/zero/other`). Missing `few`/`many`/`zero` = a silent fallback bug.
2. **ICU message validity** — valid, consistent ICU syntax across source and targets.
3. **Placeholder consistency** — every `{name}` / `{count}` / `%s` in source exists in every translation (and vice versa).
4. **Byte-overflow / truncation risk** — strings exceeding a configured byte length (VARCHAR/DB/API), multibyte-aware.
5. **Missing / orphan keys** — key diffs between source and targets.

**We deliberately do NOT build:** translation editing/management, visual/screenshot testing, money handling, sensitive-data storage, or web scraping.

**Deferred to phase 2 (do not start unless explicitly asked):** DB/schema scanner (`utf8mb3`, VARCHAR byte limits, collations), runtime assertion library (number/currency/date round-trip), Python/Ruby CLI wrappers.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Package manager | **pnpm** (workspaces) | Do **not** use npm/yarn. Lockfile is `pnpm-lock.yaml`. |
| Runtime | **Node 20+** | Ships CLDR via `Intl`; newer Node = newer CLDR. Don't pin below 20. |
| Language | **TypeScript** (ESM-first, strict) | |
| Plural source of truth | **`Intl.PluralRules`** (built-in) | The unfair advantage — never reimplement. |
| ICU parsing | `@formatjs/icu-messageformat-parser` | |
| PO / YAML parsing | `gettext-parser`, `yaml` | |
| Build | **tsup** (per package) | |
| Tests | **vitest** | golden-fixture snapshots |
| Typecheck | **tsc --noEmit** | |
| Lint + format | **biome** | single tool, config in `biome.json` |
| Versioning/publish (OSS) | **changesets** | |
| Web app | **Next.js (App Router)** on Vercel | |
| Database | **Postgres** (managed, e.g. Neon) + **Drizzle** ORM | |
| Auth | **Auth.js** (GitHub OAuth) | no passwords stored |
| Billing | **Merchant-of-Record** (Paddle / LemonSqueezy / Polar) via webhook | no card handling |
| Styling | **Tailwind** | |

---

## Core Commands

Run from repo root.

```bash
pnpm install                      # install all workspace deps

pnpm build                        # build every package (pnpm -r build → tsup)
pnpm test                         # run all vitest suites
pnpm typecheck                    # tsc --noEmit across the workspace
pnpm lint                         # biome check
pnpm format                       # biome format --write
pnpm check                        # AGGREGATE GATE: typecheck && lint && test && build

# scope to one package:
pnpm --filter @localeguard/core test
pnpm --filter @localeguard/core typecheck

# fastest feedback loop — run the CLI against fixtures:
pnpm cli -- check ./fixtures/i18next --source en --format i18next

# SaaS app locally:
pnpm dev:web                      # next dev in apps/web
pnpm --filter @localeguard/web db:generate   # Drizzle migration from schema
pnpm --filter @localeguard/web db:migrate    # apply migrations
```

### How to VERIFY changes — Definition of Done
Before claiming any task complete, **run `pnpm check` and confirm the output** — do not trust the diff. Specifically:
- **Typecheck** clean (no `any`-escapes to silence errors).
- **Tests** green. If you changed rule behavior, update the relevant **golden fixtures intentionally** — never bulk `--update` snapshots to turn red green; inspect each diff.
- **Build** succeeds (catches ESM/`exports` issues `tsc` misses).
- **CLI sanity**: run against fixtures and eyeball findings.
- **SARIF validity**: if you touched the SARIF reporter, confirm output is well-formed SARIF — malformed SARIF breaks GitHub Code Scanning silently.

If a script doesn't exist yet, add it to the root `package.json` rather than improvising an ad-hoc invocation.

---

## Code Style & Architecture Guidelines

### Architecture (the pipeline)
```
catalogs (files) ──▶ Parser ──▶ Rule[] ──▶ Finding[] ──▶ Reporter[]
```
- **Parsers** normalize any format into `Catalog`. They never emit findings.
- **Rules** are **pure functions** — `(catalogs: Catalog[], config) => Finding[]`. No I/O, no side effects, format-agnostic (consume `Catalog`, never raw files). This keeps them trivially testable.
- **Reporters** consume `Finding[]` only.

### Shared contract (`packages/core/src/types.ts`)
```ts
type PluralCat = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

interface Catalog { locale: string; source: string; entries: Record<string, Entry> }
interface Entry   { key: string; value: string; plurals?: Partial<Record<PluralCat, string>> }

interface Finding {
  ruleId: string;                              // e.g. 'plural-completeness'
  severity: 'error' | 'warning' | 'info';
  locale: string; key: string;
  file: string; line?: number; col?: number;   // required for SARIF / PR annotations
  message: string;
  fixHint?: string;
}
```

### Extension patterns
- **Add a rule:** `packages/core/src/rules/<name>.ts` exporting the pure signature above → register in the rule index → add **golden fixtures** (a good + a bad case) → wire default severity in config.
- **Add a parser:** `packages/core/src/parsers/<format>.ts` returning `Catalog[]` → add `--format <name>` → add a fixture dir in that format.
- **Add a reporter:** `packages/core/src/reporters/<name>.ts` consuming `Finding[]` → register under `--reporter <name>`.

### Style rules
- **ESM-first**; verify `exports` maps after build-config changes (`pnpm build` catches this).
- **`strict` TypeScript.** No `any` to silence the compiler; use `unknown` + narrowing.
- **Byte vs char:** use `Buffer.byteLength(str, 'utf8')`, never `str.length`, for byte checks — that distinction is the product.
- **Naming:** files kebab-case; `ruleId`s kebab-case and stable (they appear in configs and SARIF — renaming is a breaking change).
- **Every rule change ships with fixtures.** No behavior change without a golden test proving it.
- **Errors:** rules should degrade gracefully on malformed input (emit a `Finding`, don't throw and kill the run).
- Keep the MIT packages dependency-light; think twice before adding a runtime dep to `core`.

### Architectural invariants — do NOT violate
1. **Never hand-roll CLDR/plural rules.** Always derive required categories from `new Intl.PluralRules(locale).resolvedOptions().pluralCategories`. Reimplementing it introduces exactly the bugs we sell against.
2. **No scrapers, no fragile third-party APIs.** Only GitHub's first-party API and the billing MoR webhook are allowed external calls.
3. **CI exit codes are an API:** `0` clean · `1` errors found · `2` config error. Don't change casually.
4. Respect the **open-core boundary** (see Project Guide).

---

## Database & Security Rules

### Database (`apps/web` only)
- **Postgres via Drizzle.** Schema is the source of truth; generate migrations with `db:generate`, apply with `db:migrate`.
- **Never hand-edit generated migrations.** Change the schema and regenerate.
- Store only what the SaaS needs: findings history, repo/org metadata, subscription status. **No translation *content* of sensitive nature, no PII beyond GitHub identity.**
- `core`/`cli`/`action` have **no database** and must never gain one — they operate on files and stdout only.

### Security posture (keep the surface minimal)
- **Auth = GitHub OAuth (Auth.js).** No password storage, no custom credential handling.
- **No fintech / no card handling.** Subscriptions flow through a **Merchant-of-Record** via signed webhook only. Never store/process card data, never compute taxes. Verify the `BILLING_WEBHOOK_SECRET` signature on every webhook.
- **No sensitive/regulated data** (health, financial, government). This is a deliberate scope constraint that keeps the project solo-maintainable and out of HIPAA/heavy-GDPR territory.
- **Secrets** live in env vars, never in code or committed files:
  `DATABASE_URL`, `GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET`, `AUTH_SECRET`, `BILLING_WEBHOOK_SECRET`.
  Keep them in `.env.local` (gitignored).
- **API keys** (per-repo, for CI ingestion) are hashed at rest; scope them to a single repo; support rotation.
- Validate/limit uploaded SARIF/finding payloads (size + shape) before persisting — treat CI-submitted data as untrusted input.
- `apps/web` may depend on `@localeguard/core`; the MIT packages may **never** depend on `apps/web`.

---

## Current Focus & Todo

**Current phase: Week 1–3 — ship the open-core engine + CLI + Action (no SaaS yet).**
The immediate goal is a genuinely useful free tool that finds real bugs in real repos, published to npm, ready for a Show HN / DevHunt launch.

### Todo (in order)
- [ ] Scaffold monorepo: pnpm workspaces, `tsconfig.base.json`, `biome.json`, root scripts incl. `pnpm check`.
- [ ] `core`: `types.ts`, `engine.ts`, i18next JSON parser, `console` reporter.
- [ ] **`plural-completeness` rule over `Intl.PluralRules`** (the wedge) + golden fixtures for `ru/pl/ar/ja`.
- [ ] `icu-validity`, `placeholder-consistency`, `missing-keys`, `byte-overflow` rules + fixtures.
- [ ] `sarif` reporter (+ validate output) and `json`/`html` reporters.
- [ ] `cli`: `commander` + `cosmiconfig` + CI exit codes.
- [ ] `action`: run CLI, upload SARIF, PR comment summary; publish to GitHub Marketplace.
- [ ] Parsers: FormatJS, `.po`, Rails/Django YAML.
- [ ] Publish `@localeguard/core` + `@localeguard/cli` to npm via changesets; docs.
- [ ] **Launch:** Show HN + DevHunt + npm.

### Next (Week 4–6, only after OSS traction)
- [ ] `apps/web`: Next.js + GitHub OAuth + Postgres/Drizzle + ingest Action results → free dashboard.
- [ ] Pro features + MoR billing → $19 tier live; Team/Business tiers.

### Pivot / kill thresholds (know these — they change priorities)
- **Week 4:** <500 npm downloads/wk or <50 stars → revisit messaging before building SaaS.
- **Day 60:** <10 paying customers → **pivot to the DB scanner (phase-2 Angle B)**, where the pain (`Incorrect string value`) is sharper.
- **Month 3:** OSS→Pro conversion <1% → try per-project pricing or fold into an existing linter instead of a standalone product.

---

## Language note
This file and all code, comments, commit messages, and identifiers are in **English**. (Product research/marketing docs elsewhere in the project are in Hebrew by request; the codebase is English.)