import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createInstallState, INSTALL_STATE_COOKIE } from '@/lib/github-state'

export const runtime = 'nodejs'

// Entry point for the GitHub App install. Mints a session-bound signed state,
// sets it as an httpOnly cookie, and redirects to GitHub with the same value —
// the callback validates the round-trip. The Phase 4 "Connect" button links here.
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const slug = process.env.GITHUB_APP_SLUG
  if (!slug) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const state = createInstallState(userId)
  const res = NextResponse.redirect(
    `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`,
  )
  res.cookies.set(INSTALL_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // survives the top-level GET redirect back from github.com
    path: '/',
    maxAge: 600,
  })
  return res
}
