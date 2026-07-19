import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// CSRF/IDOR defense for the GitHub App install flow. On initiation we mint an
// HMAC-signed state (userId + nonce + exp), stash it in an httpOnly cookie, and
// pass the same value to GitHub as `?state=`. The callback then requires the URL
// state to (a) equal the cookie (double-submit), (b) carry a valid signature, and
// (c) be bound to the signed-in user — so a forged installation_id can't sync
// someone else's repos onto an attacker's account.

export const INSTALL_STATE_COOKIE = 'lg_install_state'
const MAX_AGE_S = 600 // 10 minutes — long enough to complete a GitHub install, short enough to expire.

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET not configured')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function createInstallState(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      nonce: randomBytes(16).toString('hex'),
      exp: Math.floor(Date.now() / 1000) + MAX_AGE_S,
    }),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyInstallState(
  state: string | null,
  cookieValue: string | undefined,
  userId: string,
): boolean {
  if (!state || !cookieValue) return false
  // Double-submit: the URL state must match the httpOnly cookie issued to this browser.
  if (!safeEqual(state, cookieValue)) return false

  const [payload, sig] = state.split('.')
  if (!payload || !sig) return false
  if (!safeEqual(sig, sign(payload))) return false

  let data: { userId?: unknown; exp?: unknown }
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return false
  }
  if (data.userId !== userId) return false
  if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return false
  return true
}
