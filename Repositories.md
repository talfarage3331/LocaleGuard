# Repository Connection Flow & Secure GitHub App Integration

This document outlines the implementation plan for securely connecting user repositories to LocaleGuard via a GitHub App, syncing their privacy status (`isPrivate`), and ensuring quota gates are correctly calculated.

---

## 🛠️ Tech Stack & Current Architecture Reference
- **Framework:** Next.js App Router (TypeScript)
- **Database:** PostgreSQL via Drizzle ORM
- **Target Schema Columns:** 
  - `repositories.isPrivate` (boolean, default false)
  - `repositories.installationId` (text/integer to associate the connection)
  - `users.plan` / `users.allowedRepos` (for quota checking)

---

## 🚀 Implementation Phases

### Phase 1: GitHub App Webhook & Configuration Setup
**Goal:** Establish secure configuration and webhook signature verification for incoming GitHub events.
1. **Environment Variables:** Define core secrets in `.env.local`:
   - `GITHUB_APP_ID`
   - `GITHUB_PRIVATE_KEY` (Base64 encoded string or raw PEM block)
   - `GITHUB_WEBHOOK_SECRET`
2. **Webhook Verification Utility:** Create a secure utility function using Web Crypto API (`crypto.subtle`) to verify the `x-hub-signature-256` header sent by GitHub against our `GITHUB_WEBHOOK_SECRET`.
3. **Route Handler:** Create the base webhook endpoint at `apps/web/app/api/webhooks/github/route.ts` that handles verification and returns `200 OK` for the initial ping.

---

### Phase 2: The GitHub App Redirect & Callback Handler
**Goal:** Handle user redirection back from GitHub, capture the `installation_id`, fetch a secure token, and do the initial repository sync.
1. **Callback Endpoint:** Create `apps/web/app/api/auth/github/callback/route.ts`.
2. **Payload Processing:** Capture the `installation_id` and `setup_action` query parameters sent by GitHub upon application installation.
3. **Token Exchange & App Client:** 
   - Generate a short-lived App JWT using `jsonwebtoken` signed with `GITHUB_PRIVATE_KEY`.
   - Exchange the JWT for an `Installation Access Token` from GitHub (`POST /app/installations/{installation_id}/access_tokens`).
4. **Initial Data Sync:**
   - Call GitHub API (`GET /installation/repositories`) to pull all repositories granted by the user.
   - Insert/Upsert the repositories into the Drizzle database, accurately setting the `isPrivate` flag based on GitHub's payload (`private: true/false`).
   - Map these repositories to the current session user/organization.

---

### Phase 3: Real-Time Sync via Webhook Events
**Goal:** Ensure that whenever a repo's privacy changes, or it gets added/removed from the GitHub dashboard, LocaleGuard stays synced in real-time.
1. **Extend Webhook Handler:** Update `apps/web/app/api/webhooks/github/route.ts` to parse and process incoming POST events.
2. **Handle `installation_repositories` Events:**
   - **`added`:** Loop through new repositories, query metadata, and upsert them with the correct `isPrivate` flag.
   - **`removed`:** Mark the repository as disconnected or delete it from our local database.
3. **Handle `installation` Events:**
   - **`deleted` / `suspend`:** Wipe or deactivate all repositories tied to that `installation_id` in our system to ensure absolute compliance with user configuration changes.

---

### Phase 4: Activating Frontend Integration & Quota Enforcement
**Goal:** Connect the UI dashboard to the setup flow and make the Phase 2 quota gate fully active.
1. **Connect Button:** Update the repository connection screen/button to point directly to the GitHub App installation URL (`https://github.com/apps/YOUR_APP_NAME/installations/new`).
2. **Validation Verification:** Ensure `pnpm check` passes across the workspace (typecheck, linting, and tests).
3. **End-to-End Test:** Confirm that when a new private repository is synced, the `scans/route.ts` quota gate successfully checks it against `users.allowedRepos` and triggers the 403 upgrade paywall if the limits are breached.