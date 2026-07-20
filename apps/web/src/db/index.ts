import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy init: importing this module must not require DATABASE_URL (e.g. at `next build`).
// The connection is created on first query only.
//
// IMPORTANT (Cloudflare Workers): a TCP socket may only be used by the request that
// opened it, yet module scope persists across requests within an isolate. Caching the
// client at module scope reused the auth-callback's socket on the next /dashboard render
// and threw "Connection closed". So on the Worker we create a FRESH client per call and
// never cache it — Hyperdrive pools the real connections, so this is cheap. (We can't
// memoize per request either: the only per-request handle, ctx, is absent during RSC
// page renders, and the bindings object is shared across requests.)
// Local `next dev` has no Cloudflare context, so we fall back to DATABASE_URL and keep
// one persistent client on globalThis (single Node process — socket reuse is legal).
type Db = PostgresJsDatabase<typeof schema>
const globalForDb = globalThis as unknown as { devDb?: Db }

// prepare:false is required for Supabase's transaction pooler (pgBouncer, port 6543);
// harmless on the session pooler / direct connection.
const connect = (connectionString: string): Db =>
  drizzle(postgres(connectionString, { prepare: false }), { schema })

function getDb(): Db {
  // On Cloudflare the connection comes from the Hyperdrive binding (pooled, TCP at the
  // edge). ponytail: one client per call, not per request — a few extra Hyperdrive
  // connections per page load; pool them via ctx if that ever shows up as pressure.
  try {
    const hyperdrive = (getCloudflareContext().env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE
    if (hyperdrive?.connectionString) return connect(hyperdrive.connectionString)
  } catch {
    // Not in a Cloudflare request context (e.g. `next dev` without a bound Hyperdrive).
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  return (globalForDb.devDb ??= connect(process.env.DATABASE_URL))
}

export const db = new Proxy({} as Db, {
  get: (_t, prop) => {
    const d = getDb()
    return Reflect.get(d, prop, d)
  },
})
export { schema }
