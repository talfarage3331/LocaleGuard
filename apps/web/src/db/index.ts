import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy init: importing this module must not require DATABASE_URL (e.g. at `next build`).
// The connection is created on first query only.
const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> }
let _db: PostgresJsDatabase<typeof schema> | null = null

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')
  const client = globalForDb.client ?? postgres(connectionString)
  if (process.env.NODE_ENV !== 'production') globalForDb.client = client
  _db = drizzle(client, { schema })
  return _db
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get: (_t, prop) => Reflect.get(getDb(), prop, getDb()),
})
export { schema }
