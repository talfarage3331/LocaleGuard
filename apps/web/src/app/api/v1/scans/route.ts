import type { Finding } from '@localeguard/core'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { repositories, scanHistory } from '@/db/schema'
import { hashApiKey } from '@/lib/api-key'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 2_000_000 // 2 MB — CI payloads are small; reject anything larger.
const MAX_FINDINGS = 10_000

// CI-submitted data is untrusted: validate shape before it ever reaches the DB.
function parseFindings(raw: unknown): Finding[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_FINDINGS) return null
  const out: Finding[] = []
  for (const f of raw) {
    if (typeof f !== 'object' || f === null) return null
    const o = f as Record<string, unknown>
    if (
      typeof o.ruleId !== 'string' ||
      typeof o.locale !== 'string' ||
      typeof o.key !== 'string' ||
      typeof o.file !== 'string' ||
      typeof o.message !== 'string' ||
      (o.severity !== 'error' && o.severity !== 'warning' && o.severity !== 'info')
    ) {
      return null
    }
    out.push({
      ruleId: o.ruleId,
      severity: o.severity,
      locale: o.locale,
      key: o.key,
      file: o.file,
      message: o.message,
      line: typeof o.line === 'number' ? o.line : undefined,
      col: typeof o.col === 'number' ? o.col : undefined,
      fixHint: typeof o.fixHint === 'string' ? o.fixHint : undefined,
    })
  }
  return out
}

export async function POST(req: NextRequest) {
  const key = req.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const body = await req.text()
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let json: unknown
  try {
    json = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof json !== 'object' || json === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const payload = json as Record<string, unknown>
  const commitSha = payload.commitSha
  if (typeof commitSha !== 'string' || commitSha.length === 0 || commitSha.length > 64) {
    return NextResponse.json({ error: 'Invalid commitSha' }, { status: 400 })
  }
  const branch = typeof payload.branch === 'string' ? payload.branch.slice(0, 255) : null

  const findings = parseFindings(payload.findings)
  if (!findings) {
    return NextResponse.json({ error: 'Invalid findings' }, { status: 400 })
  }

  // Resolve the repo from the hashed key — constant lookup, plaintext never stored.
  const [repo] = await db
    .select({ id: repositories.id })
    .from(repositories)
    .where(eq(repositories.apiKeyHash, hashApiKey(key)))
    .limit(1)
  if (!repo) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const errorCount = findings.filter((f) => f.severity === 'error').length
  const warningCount = findings.filter((f) => f.severity === 'warning').length

  const [scan] = await db
    .insert(scanHistory)
    .values({ repositoryId: repo.id, commitSha, branch, errorCount, warningCount, findings })
    .returning({ id: scanHistory.id })

  return NextResponse.json({ id: scan?.id, errorCount, warningCount }, { status: 201 })
}
