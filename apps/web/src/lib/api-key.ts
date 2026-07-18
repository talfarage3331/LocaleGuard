import { createHash, randomBytes } from 'node:crypto'

// Per-repo CI ingestion keys. We store only the SHA-256 hash; the plaintext is shown once.
export function generateApiKey(): { key: string; hash: string } {
  const key = `lg_${randomBytes(24).toString('base64url')}`
  return { key, hash: hashApiKey(key) }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
