import { sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { repositories } from '@/db/schema'
import { getInstallationToken, listInstallationRepositories } from '@/lib/github-app'
import { INSTALL_STATE_COOKIE, verifyInstallState } from '@/lib/github-state'

export const runtime = 'nodejs'

// Reference the INSERT's proposed row in an ON CONFLICT update (Postgres `excluded`),
// so a re-sync updates from GitHub's payload rather than a hard-coded literal.
const excluded = (column: string) => sql.raw(`excluded.${column}`)

// GitHub redirects the user here after installing/configuring the App. We capture the
// installation_id, exchange the App JWT for an installation token, and sync the granted
// repositories (with their real private/public visibility) onto the signed-in user.
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const installationId = req.nextUrl.searchParams.get('installation_id')
  const setupAction = req.nextUrl.searchParams.get('setup_action')
  // `setup_action=request` means an org admin must approve first — nothing to sync yet.
  // No token exchange happens here, so there's no IDOR surface to gate.
  if (!installationId || setupAction === 'request') {
    return clearState(NextResponse.redirect(new URL('/dashboard', req.url)))
  }

  // IDOR gate: only proceed if this install was initiated by *this* user (signed state
  // round-tripped through the httpOnly cookie). Blocks syncing a forged installation_id.
  const state = req.nextUrl.searchParams.get('state')
  const cookieState = req.cookies.get(INSTALL_STATE_COOKIE)?.value
  if (!verifyInstallState(state, cookieState, userId)) {
    return clearState(NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.url)))
  }

  const token = await getInstallationToken(installationId)
  const repos = await listInstallationRepositories(token)

  if (repos.length > 0) {
    await db
      .insert(repositories)
      .values(
        repos.map((r) => ({
          ownerId: userId,
          githubRepoId: r.githubRepoId,
          fullName: r.fullName,
          installationId,
          isPrivate: r.isPrivate,
          defaultBranch: r.defaultBranch,
        })),
      )
      .onConflictDoUpdate({
        target: repositories.githubRepoId,
        // Keep visibility + metadata in sync with GitHub on every re-sync.
        set: {
          fullName: excluded('full_name'),
          installationId: excluded('installation_id'),
          isPrivate: excluded('is_private'),
          defaultBranch: excluded('default_branch'),
        },
      })
  }

  return clearState(NextResponse.redirect(new URL('/dashboard', req.url)))
}

// The state cookie is single-use — drop it on every terminal response.
function clearState(res: NextResponse): NextResponse {
  res.cookies.delete(INSTALL_STATE_COOKIE)
  return res
}
