import { type NextRequest, NextResponse } from 'next/server'
import { verifyGithubSignature } from '@/lib/github-webhook'

export const runtime = 'nodejs'

// Verify every webhook signature before trusting a single byte of the body.
// Phase 3 will branch on `x-github-event` to process installation events; for now
// verified requests (including the initial `ping`) are simply acknowledged.
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

  return NextResponse.json({ received: true })
}
