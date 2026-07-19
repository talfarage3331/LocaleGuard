import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton } from '@/components/auth-buttons'
import { FeatureCarousel } from '@/components/feature-carousel'
import { ProductSim } from '@/components/product-sim'
import { SiteHeader } from '@/components/site-header'

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
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6">
        {/* hero */}
        <section className="relative isolate grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div className="aurora" aria-hidden="true" />
          <div className="relative">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              CI-first i18n linting
            </p>
            <h1 className="max-w-2xl bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Catch the localization bugs that pass English tests and break in production.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              LocaleGuard reads your translation catalogs and fails the build on plural gaps, broken
              ICU messages, placeholder drift, and byte overflow — the silent logic bugs no TMS
              checks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
                >
                  Open dashboard
                </Link>
              ) : (
                <SignInButton />
              )}
              <code className="rounded-lg border border-border glass px-3 py-2.5 font-mono text-sm text-muted">
                npx @localeguard/cli check ./locales
              </code>
            </div>
          </div>

          <div className="relative">
            <ProductSim />
          </div>
        </section>

        {/* feature carousel */}
        <section className="pb-8" id="features">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">
              What it checks
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Five checks, one green build.</h2>
          </div>
          <FeatureCarousel />
        </section>

        {/* checks grid */}
        <section className="grid gap-4 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border glass p-5 transition hover:border-brand/40"
            >
              <h3 className="font-mono text-sm font-medium text-text">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  )
}
