import { desc, eq, inArray } from 'drizzle-orm'
import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton, SignOutButton } from '@/components/auth-buttons'
import { ScanSimulator } from '@/components/dashboard/scan-simulator-dynamic'
import { db } from '@/db'
import { repositories, scanHistory } from '@/db/schema'

export const metadata = { title: 'Dashboard — LocaleGuard' }

const RULE_LABELS: Record<string, string> = {
  'plural-completeness': 'Plural completeness',
  'icu-validity': 'ICU validity',
  'placeholder-consistency': 'Placeholder consistency',
  'byte-overflow': 'Byte overflow',
  'missing-keys': 'Missing / orphan keys',
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tone ?? 'text-text'}`}>{value}</p>
    </div>
  )
}

// Plain <a>, not next/link: /api/auth/github/install is a server redirect to github.com,
// so it needs a full-page navigation rather than an RSC prefetch.
function ConnectButton({ label = 'Connect GitHub' }: { label?: string }) {
  return (
    <a
      href="/api/auth/github/install"
      className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
    >
      {label}
    </a>
  )
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-semibold">Sign in to LocaleGuard</h1>
        <p className="text-muted">Connect GitHub to see scan history for your repositories.</p>
        <SignInButton />
        <Link href="/" className="text-sm text-muted transition hover:text-text">
          ← Back home
        </Link>
      </main>
    )
  }

  const repos = await db
    .select()
    .from(repositories)
    .where(eq(repositories.ownerId, session.user.id))

  const repoIds = repos.map((r) => r.id)
  const scans = repoIds.length
    ? await db
        .select()
        .from(scanHistory)
        .where(inArray(scanHistory.repositoryId, repoIds))
        .orderBy(desc(scanHistory.createdAt))
        .limit(50)
    : []

  const repoName = new Map(repos.map((r) => [r.id, r.fullName]))

  // Latest scan per repo → repo pass/fail status.
  const latestByRepo = new Map<string, (typeof scans)[number]>()
  for (const s of scans) if (!latestByRepo.has(s.repositoryId)) latestByRepo.set(s.repositoryId, s)
  const latest = [...latestByRepo.values()]
  const passing = latest.filter((s) => s.errorCount === 0).length
  const totalErrors = latest.reduce((n, s) => n + s.errorCount, 0)
  const totalWarnings = latest.reduce((n, s) => n + s.warningCount, 0)

  // Bug breakdown by rule across the recent window.
  const breakdown = new Map<string, number>()
  for (const s of scans)
    for (const f of s.findings) breakdown.set(f.ruleId, (breakdown.get(f.ruleId) ?? 0) + 1)
  const breakdownRows = [...breakdown.entries()].sort((a, b) => b[1] - a[1])
  const breakdownMax = Math.max(1, ...breakdownRows.map(([, n]) => n))

  // Pass/fail trend — oldest → newest, one bar per recent scan.
  const trend = [...scans].reverse().slice(-24)

  return (
    <main className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between border-b border-border py-6">
        <Link href="/" className="font-mono text-sm font-semibold">
          locale<span className="text-brand">guard</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="rounded-full border border-border px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-muted transition hover:text-text"
          >
            {session.user.plan} plan
          </Link>
          <span className="text-sm text-muted">{session.user.name ?? session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="pt-10">
        <ScanSimulator />
      </section>

      <section className="py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scan history</h1>
            <p className="mt-2 text-muted">Findings uploaded by the LocaleGuard GitHub Action.</p>
          </div>
          <div className="flex items-center gap-3">
            {session.user.plan === 'free' && (
              <Link
                href="/pricing"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-panel"
              >
                Upgrade to Pro
              </Link>
            )}
            <ConnectButton label={repos.length === 0 ? 'Connect GitHub' : 'Connect more'} />
          </div>
        </div>

        {error === 'invalid_state' && (
          <div className="mt-6 rounded-lg border border-err/40 bg-err/10 px-4 py-3 text-sm text-err">
            We couldn't verify that install request. Please start the connection again from this
            dashboard.
          </div>
        )}

        {repos.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-panel p-10 text-center">
            <p className="text-muted">No repositories connected yet.</p>
            <p className="mt-1 text-sm text-muted">
              Connect the GitHub App to sync your repositories, then add the{' '}
              <code className="font-mono text-text">localeguard/action</code> to a workflow to start
              ingesting findings into <code className="font-mono text-text">/api/v1/scans</code>.
            </p>
            <div className="mt-6 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-xl border border-border bg-panel p-5">
              <p className="text-sm text-muted">Connected repositories</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {repos.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm"
                  >
                    <span className="font-mono text-text">{r.fullName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        r.isPrivate ? 'bg-warn/15 text-warn' : 'bg-ok/15 text-ok'
                      }`}
                    >
                      {r.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <StatCard label="Repositories" value={repos.length} />
              <StatCard label="Passing" value={passing} tone="text-ok" />
              <StatCard
                label="Errors"
                value={totalErrors}
                tone={totalErrors ? 'text-err' : 'text-ok'}
              />
              <StatCard
                label="Warnings"
                value={totalWarnings}
                tone={totalWarnings ? 'text-warn' : 'text-text'}
              />
            </div>

            {trend.length > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-panel p-5">
                <p className="text-sm text-muted">Recent runs</p>
                <div
                  className="mt-4 flex h-16 items-end gap-1"
                  role="img"
                  aria-label="Pass/fail trend of recent scans"
                >
                  {trend.map((s) => (
                    <div
                      key={s.id}
                      title={`${repoName.get(s.repositoryId) ?? ''} · ${s.errorCount} errors`}
                      className={`flex-1 rounded-sm ${s.errorCount === 0 ? 'bg-ok/70' : 'bg-err/70'}`}
                      style={{ height: `${Math.min(100, 20 + s.errorCount * 12)}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {breakdownRows.length > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-panel p-5">
                <p className="text-sm text-muted">Findings by rule</p>
                <ul className="mt-4 space-y-3">
                  {breakdownRows.map(([ruleId, n]) => (
                    <li
                      key={ruleId}
                      className="grid grid-cols-[minmax(9rem,1fr)_3fr_auto] items-center gap-3 text-sm"
                    >
                      <span className="truncate text-muted">{RULE_LABELS[ruleId] ?? ruleId}</span>
                      <span className="h-2 rounded-full bg-canvas">
                        <span
                          className="block h-2 rounded-full bg-brand"
                          style={{ width: `${(n / breakdownMax) * 100}%` }}
                        />
                      </span>
                      <span className="tabular-nums text-text">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-panel text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Repository</th>
                    <th className="px-4 py-3 font-medium">Commit</th>
                    <th className="px-4 py-3 font-medium text-right">Errors</th>
                    <th className="px-4 py-3 font-medium text-right">Warnings</th>
                    <th className="px-4 py-3 font-medium text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.slice(0, 20).map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 text-text">{repoName.get(s.repositoryId)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {s.commitSha.slice(0, 7)}
                        {s.branch ? ` · ${s.branch}` : ''}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${s.errorCount ? 'text-err' : 'text-muted'}`}
                      >
                        {s.errorCount}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${s.warningCount ? 'text-warn' : 'text-muted'}`}
                      >
                        {s.warningCount}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">{timeAgo(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
