import { createSign } from 'node:crypto'

// GitHub App auth. A short-lived App JWT (RS256, signed with GITHUB_PRIVATE_KEY)
// is exchanged for an installation access token, which is then used to list the
// repositories an installation granted. Uses node:crypto — no extra JWT dependency.

const API = 'https://api.github.com'

export interface GithubRepo {
  githubRepoId: string
  fullName: string
  isPrivate: boolean
  defaultBranch: string
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

// Accepts a raw PEM block or a base64-encoded PEM, with either real or escaped (\n) newlines.
function normalizePrivateKey(raw: string): string {
  const pem = raw.includes('BEGIN') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return pem.replace(/\\n/g, '\n')
}

export function appJwt(): string {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_PRIVATE_KEY
  if (!appId || !privateKey) throw new Error('GITHUB_APP_ID / GITHUB_PRIVATE_KEY not configured')

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  // iat backdated 60s to tolerate clock skew; GitHub caps exp at 10 minutes.
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }))
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${payload}`)
    .sign(normalizePrivateKey(privateKey), 'base64url')
  return `${header}.${payload}.${signature}`
}

export async function getInstallationToken(installationId: string): Promise<string> {
  const res = await fetch(`${API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appJwt()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    throw new Error(`Installation token exchange failed: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { token: string }
  return json.token
}

// The GitHub account (user/org) that owns an installation. Lets the callback confirm
// the signed-in user actually owns an installation before syncing its repos — the IDOR
// defense for GitHub's update/reconfigure redirect, which carries no signed `state`.
export async function getInstallationAccountId(installationId: string): Promise<string | null> {
  const res = await fetch(`${API}/app/installations/${installationId}`, {
    headers: {
      Authorization: `Bearer ${appJwt()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) return null
  const json = (await res.json()) as { account?: { id?: number | string } | null }
  const id = json.account?.id
  return typeof id === 'number' || typeof id === 'string' ? String(id) : null
}

// Pull every repository the installation granted, following pagination.
export async function listInstallationRepositories(token: string): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/installation/repositories?per_page=100&page=${page}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!res.ok) {
      throw new Error(`Listing installation repositories failed: ${res.status} ${await res.text()}`)
    }
    const json = (await res.json()) as {
      repositories: Array<{
        id: number
        full_name: string
        private: boolean
        default_branch: string
      }>
    }
    for (const r of json.repositories) {
      repos.push({
        githubRepoId: String(r.id),
        fullName: r.full_name,
        isPrivate: r.private,
        defaultBranch: r.default_branch || 'main',
      })
    }
    if (json.repositories.length < 100) break
  }
  return repos
}
