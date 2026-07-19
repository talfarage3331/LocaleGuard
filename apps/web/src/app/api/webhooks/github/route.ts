import { type NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/lib/github-events'
import { verifyGithubSignature } from '@/lib/github-webhook'

export const runtime = 'nodejs'

// Verify every webhook signature before trusting a single byte of the body, then
// dispatch installation events to keep the `repositories` table synced in real time.
export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const body = await req.text() // raw body required for signature verification
  const valid = await verifyGithubSignature(body, req.headers.get('x-hub-signature-256'), secret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Unknown/irrelevant events (including `ping`) are safely ignored inside the handler.
  const event = req.headers.get('x-github-event')
  if (event) await handleWebhookEvent(event, payload)

  return NextResponse.json({ received: true })
}
