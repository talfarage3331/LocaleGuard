import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy init: importing this module must not require DATABASE_URL (e.g. at `next build`).
// The connection is created on first query only.
//
// IMPORTANT (Cloudflare Workers): a TCP socket may only be used by the request that
// opened it, yet module scope persists across requests within an isolate. So the DB
// client must NOT be cached at module scope in the Worker — a socket opened in the auth
// callback and reused by the next /dashboard render throws "Connection closed"
// ("cannot perform I/O on behalf of a different request"). We memoize per request,
// keyed on the request's ExecutionContext; Hyperdrive pools the real connections so a
// fresh client per request is cheap. Local `next dev` has no Cloudflare context, so we
// fall back to DATABASE_URL and keep one persistent client on globalThis.
type Db = PostgresJsDatabase<typeof schema>
const perScope = new WeakMap<object, Db>()

// On Cloudflare the Postgres connection comes from the Hyperdrive binding (pooled,
// TCP handled at the edge); locally there's no binding, so fall back to DATABASE_URL.
// `scope` is the memoization key: the per-request ctx on Workers, globalThis in dev.
function resolveConnection(): { scope: object; connectionString: string } {
  try {
    const { env, ctx } = getCloudflareContext()
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE
    if (hyperdrive?.connectionString) return { scope: ctx, connectionString: hyperdrive.connectionString }
  } catch {
    // Not in a Cloudflare request context (e.g. `next dev` without a bound Hyperdrive).
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  return { scope: globalThis, connectionString: process.env.DATABASE_URL }
}

function getDb(): Db {
  const { scope, connectionString } = resolveConnection()
  const cached = perScope.get(scope)
  if (cached) return cached
  // prepare:false is required for Supabase's transaction pooler (pgBouncer, port 6543);
  // harmless on the session pooler / direct connection.
  const db = drizzle(postgres(connectionString, { prepare: false }), { schema })
  perScope.set(scope, db)
  return db
}

export const db = new Proxy({} as Db, {
  get: (_t, prop) => {
    const d = getDb()
    return Reflect.get(d, prop, d)
  },
})
export { schema }
