// Verify GitHub's `x-hub-signature-256` header: HMAC-SHA256 of the raw request
// body, keyed by GITHUB_WEBHOOK_SECRET. Uses Web Crypto (`crypto.subtle.verify`),
// which compares in constant time — never string-compare signatures yourself.
const encoder = new TextEncoder()

export async function verifyGithubSignature(
  body: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  // GitHub sends `sha256=<hex>`; reject anything that doesn't match that shape.
  if (!signatureHeader?.startsWith('sha256=')) return false
  const signature = hexToBytes(signatureHeader.slice('sha256='.length))
  if (!signature) return false

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(body))
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) return null
    bytes[i] = byte
  }
  return bytes
}
