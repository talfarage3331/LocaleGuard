import { createVerify, generateKeyPairSync } from 'node:crypto'
import { afterEach, expect, test, vi } from 'vitest'
import { appJwt, getInstallationAccountId } from './github-app'
import { handleWebhookEvent } from './github-events'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

afterEach(() => {
  delete process.env.GITHUB_APP_ID
  delete process.env.GITHUB_PRIVATE_KEY
  vi.unstubAllGlobals()
})

test('appJwt signs a verifiable RS256 token with the app id as issuer', () => {
  process.env.GITHUB_APP_ID = '123456'
  process.env.GITHUB_PRIVATE_KEY = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()

  const [header, payload, signature] = appJwt().split('.') as [string, string, string]
  expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({
    alg: 'RS256',
    typ: 'JWT',
  })
  expect(JSON.parse(Buffer.from(payload, 'base64url').toString()).iss).toBe('123456')

  const verified = createVerify('RSA-SHA256')
    .update(`${header}.${payload}`)
    .verify(publicKey, Buffer.from(signature, 'base64url'))
  expect(verified).toBe(true)
})

test('appJwt accepts a base64-encoded private key', () => {
  process.env.GITHUB_APP_ID = '123456'
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
  process.env.GITHUB_PRIVATE_KEY = Buffer.from(pem).toString('base64')

  const [header, payload, signature] = appJwt().split('.') as [string, string, string]
  const verified = createVerify('RSA-SHA256')
    .update(`${header}.${payload}`)
    .verify(publicKey, Buffer.from(signature, 'base64url'))
  expect(verified).toBe(true)
})

test('appJwt throws when unconfigured', () => {
  expect(() => appJwt()).toThrow(/not configured/)
})

test('getInstallationAccountId returns the account id as a string, null on error', async () => {
  process.env.GITHUB_APP_ID = '123456'
  process.env.GITHUB_PRIVATE_KEY = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ account: { id: 777 } }), { status: 200 })),
  )
  expect(await getInstallationAccountId('42')).toBe('777')

  vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
  expect(await getInstallationAccountId('42')).toBeNull()
})

// A minimal chainable stub standing in for the Drizzle db: records the upsert values
// and returns a known owner for the installation lookup.
function fakeDb(ownerRows: { ownerId: string }[]) {
  const captured: { values?: unknown } = {}
  const db = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => ownerRows }) }) }),
    insert: () => ({
      values: (v: unknown) => {
        captured.values = v
        return { onConflictDoUpdate: async () => {} }
      },
    }),
    delete: () => ({ where: async () => {} }),
  }
  return { db: db as unknown as Parameters<typeof handleWebhookEvent>[2], captured }
}

test('installation_repositories.added parses the payload and upserts the granted repo', async () => {
  const { db, captured } = fakeDb([{ ownerId: 'user-1' }])
  await handleWebhookEvent(
    'installation_repositories',
    {
      action: 'added',
      installation: { id: 42 },
      repositories_added: [{ id: 999, full_name: 'acme/site', private: true }],
    },
    db,
  )
  expect(captured.values).toEqual([
    {
      ownerId: 'user-1',
      installationId: '42',
      githubRepoId: '999',
      fullName: 'acme/site',
      isPrivate: true,
    },
  ])
})

test('installation_repositories.added skips when the installation has no known owner', async () => {
  const { db, captured } = fakeDb([]) // no prior sync → unattributable
  await handleWebhookEvent(
    'installation_repositories',
    {
      action: 'added',
      installation: { id: 42 },
      repositories_added: [{ id: 999, full_name: 'acme/site', private: true }],
    },
    db,
  )
  expect(captured.values).toBeUndefined()
})
