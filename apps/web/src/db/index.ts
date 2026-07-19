import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy init: importing this module must not require DATABASE_URL (e.g. at `next build`).
// The connection is created on first query only.
const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> }
let _db: PostgresJsDatabase<typeof schema> | null = null

// On Cloudflare the Postgres connection comes from the Hyperdrive binding (pooled,
// TCP handled at the edge); locally there's no binding, so fall back to DATABASE_URL.
function resolveConnectionString(): string | undefined {
  try {
    const hyperdrive = (getCloudflareContext().env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE
    if (hyperdrive?.connectionString) return hyperdrive.connectionString
  } catch {
    // Not in a Cloudflare request context (e.g. `next dev` without a bound Hyperdrive).
  }
  return process.env.DATABASE_URL
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db
  const connectionString = resolveConnectionString()
  if (!connectionString) throw new Error('DATABASE_URL is not set')
  // prepare:false is required for Supabase's transaction pooler (pgBouncer, port 6543);
  // harmless on the session pooler / direct connection.
  const client = globalForDb.client ?? postgres(connectionString, { prepare: false })
  if (process.env.NODE_ENV !== 'production') globalForDb.client = client
  _db = drizzle(client, { schema })
  return _db
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get: (_t, prop) => Reflect.get(getDb(), prop, getDb()),
})
export { schema }
