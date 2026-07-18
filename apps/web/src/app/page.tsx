import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton } from '@/components/auth-buttons'

const CHECKS = [
  {
    id: 'plural-completeness',
    title: 'Plural completeness',
    body: 'Every plural key carries exactly the CLDR categories its language needs — no silent one/other fallback in ru, pl, ar.',
  },
  {
    id: 'icu-validity',
    title: 'ICU message validity',
    body: 'Valid, consistent ICU syntax across source and every target locale.',
  },
  {
    id: 'placeholder-consistency',
    title: 'Placeholder consistency',
    body: 'Every {name}, {count} and %s in the source survives translation — and nothing extra sneaks in.',
  },
  {
    id: 'byte-overflow',
    title: 'Byte-overflow risk',
    body: 'Multibyte-aware length checks catch strings that blow past VARCHAR / API byte limits.',
  },
  {
    id: 'missing-keys',
    title: 'Missing / orphan keys',
    body: 'Key diffs between source and targets, surfaced as annotations right on the PR.',
  },
]

export default async function Home() {
  const session = await auth()

  return (
    <main className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-mono text-sm font-semibold tracking-tight">
          locale<span className="text-brand">guard</span>
        </span>
        {session ? (
          <Link href="/dashboard" className="text-sm text-muted transition hover:text-text">
            Dashboard →
          </Link>
        ) : (
          <SignInButton />
        )}
      </header>

      <section className="py-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-brand">
          CI-first i18n linting
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Catch the localization bugs that pass English tests and break in production.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          LocaleGuard reads your translation catalogs and fails the build on plural gaps, broken ICU
          messages, placeholder drift, and byte overflow — the silent logic bugs no TMS checks.
        </p>
        <div className="mt-8 flex items-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Open dashboard
            </Link>
          ) : (
            <SignInButton />
          )}
          <code className="rounded-lg border border-border bg-panel px-3 py-2 font-mono text-sm text-muted">
            npx @localeguard/cli check ./locales
          </code>
        </div>
      </section>

      <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKS.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-panel p-5">
            <h2 className="font-mono text-sm font-medium text-text">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
