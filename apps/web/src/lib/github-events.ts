import { and, eq, inArray, sql } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { repositories } from '@/db/schema'

// Real-time sync from GitHub App webhooks. All payloads are untrusted — every field
// is narrowed before it touches the DB. `database` is injectable for testing.
type Database = typeof defaultDb

const excluded = (column: string) => sql.raw(`excluded.${column}`)

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null
}

interface ParsedRepo {
  githubRepoId: string
  fullName: string
  isPrivate: boolean
}

// Pull {id, full_name, private} out of an untrusted repo array; skip malformed entries.
function parseRepos(raw: unknown): ParsedRepo[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedRepo[] = []
  for (const item of raw) {
    const o = asRecord(item)
    if (!o) continue
    const id = o.id
    if ((typeof id !== 'number' && typeof id !== 'string') || typeof o.full_name !== 'string') {
      continue
    }
    out.push({ githubRepoId: String(id), fullName: o.full_name, isPrivate: o.private === true })
  }
  return out
}

export async function handleWebhookEvent(
  event: string,
  payload: unknown,
  database: Database = defaultDb,
): Promise<void> {
  const body = asRecord(payload)
  if (!body) return
  const installation = asRecord(body.installation)
  const rawId = installation?.id
  if (typeof rawId !== 'number' && typeof rawId !== 'string') return
  const installationId = String(rawId)
  const action = typeof body.action === 'string' ? body.action : ''

  if (event === 'installation_repositories') {
    if (action === 'added') {
      const repos = parseRepos(body.repositories_added)
      if (repos.length === 0) return
      // Attribute to the owner recorded when this installation was first synced (Phase 2 callback).
      const [existing] = await database
        .select({ ownerId: repositories.ownerId })
        .from(repositories)
        .where(eq(repositories.installationId, installationId))
        .limit(1)
      // ponytail: unattributable if the callback sync hasn't run yet; skip rather than guess an owner.
      if (!existing) return
      await database
        .insert(repositories)
        .values(repos.map((r) => ({ ownerId: existing.ownerId, installationId, ...r })))
        .onConflictDoUpdate({
          target: repositories.githubRepoId,
          set: {
            fullName: excluded('full_name'),
            isPrivate: excluded('is_private'),
            installationId: excluded('installation_id'),
          },
        })
    } else if (action === 'removed') {
      const repos = parseRepos(body.repositories_removed)
      if (repos.length === 0) return
      await database.delete(repositories).where(
        and(
          eq(repositories.installationId, installationId),
          inArray(
            repositories.githubRepoId,
            repos.map((r) => r.githubRepoId),
          ),
        ),
      )
    }
    return
  }

  // Whole-installation teardown: user uninstalled or suspended the App.
  if (event === 'installation' && (action === 'deleted' || action === 'suspend')) {
    await database.delete(repositories).where(eq(repositories.installationId, installationId))
  }
}
