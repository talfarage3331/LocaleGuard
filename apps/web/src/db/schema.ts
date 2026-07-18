import type { Finding } from '@localeguard/core'
import { relations } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Only GitHub identity — no passwords, no PII beyond what GitHub OAuth returns.
// Billing columns hold Stripe *references* only — never card data (Stripe hosts checkout).
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: text('github_id').notNull().unique(),
  login: text('login').notNull(),
  name: text('name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'team'
  subscriptionStatus: text('subscription_status'), // Stripe status, null when never subscribed
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  githubRepoId: text('github_repo_id').notNull().unique(),
  fullName: text('full_name').notNull(), // "org/repo"
  defaultBranch: text('default_branch').notNull().default('main'),
  // SHA-256 of the per-repo CI ingestion key. Rotate by overwriting; scoped to this repo only.
  apiKeyHash: text('api_key_hash').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// One row per Action run: the engine findings uploaded from CI.
export const scanHistory = pgTable(
  'scan_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repositoryId: uuid('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    commitSha: text('commit_sha').notNull(),
    branch: text('branch'),
    errorCount: integer('error_count').notNull().default(0),
    warningCount: integer('warning_count').notNull().default(0),
    findings: jsonb('findings').$type<Finding[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('scan_history_repo_idx').on(t.repositoryId, t.createdAt)],
)

export const usersRelations = relations(users, ({ many }) => ({
  repositories: many(repositories),
}))

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  owner: one(users, { fields: [repositories.ownerId], references: [users.id] }),
  scans: many(scanHistory),
}))

export const scanHistoryRelations = relations(scanHistory, ({ one }) => ({
  repository: one(repositories, {
    fields: [scanHistory.repositoryId],
    references: [repositories.id],
  }),
}))
