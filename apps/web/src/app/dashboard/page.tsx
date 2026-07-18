import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton, SignOutButton } from '@/components/auth-buttons'

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
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

  return (
    <main className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between border-b border-border py-6">
        <span className="font-mono text-sm font-semibold">
          locale<span className="text-brand">guard</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{session.user?.name ?? session.user?.email}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Scan history</h1>
        <p className="mt-2 text-muted">
          Results uploaded by the LocaleGuard GitHub Action will appear here.
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-border bg-panel p-10 text-center">
          <p className="text-muted">No repositories connected yet.</p>
          <p className="mt-1 text-sm text-muted">
            Add the <code className="font-mono text-text">localeguard/action</code> to a workflow to
            start ingesting findings.
          </p>
        </div>
      </section>
    </main>
  )
}
