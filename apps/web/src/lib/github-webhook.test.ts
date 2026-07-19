import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyGithubSignature } from './github-webhook'

const secret = 'test-webhook-secret'
const body = JSON.stringify({ zen: 'Keep it logically awesome.' })
const sign = (payload: string) =>
  `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`

describe('verifyGithubSignature', () => {
  it('accepts a signature GitHub would produce', async () => {
    expect(await verifyGithubSignature(body, sign(body), secret)).toBe(true)
  })

  it('rejects a tampered body', async () => {
    expect(await verifyGithubSignature(`${body} `, sign(body), secret)).toBe(false)
  })

  it('rejects the wrong secret', async () => {
    const wrong = `sha256=${createHmac('sha256', 'nope').update(body).digest('hex')}`
    expect(await verifyGithubSignature(body, wrong, secret)).toBe(false)
  })

  it('rejects a missing or malformed header', async () => {
    expect(await verifyGithubSignature(body, null, secret)).toBe(false)
    expect(await verifyGithubSignature(body, 'sha256=zz', secret)).toBe(false)
    expect(await verifyGithubSignature(body, 'not-prefixed', secret)).toBe(false)
  })
})
