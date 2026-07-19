import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton } from '@/components/auth-buttons'
import { ScanSimulator } from '@/components/dashboard/scan-simulator-dynamic'
import { FeatureCarousel } from '@/components/feature-carousel'
import { PrComment } from '@/components/pr-comment'
import { SiteHeader } from '@/components/site-header'

const AUDIENCE = [
  {
    who: 'Developers',
    body: 'You write the code and the English tests pass — but pl/ru/ar plurals fall back silently and a German string overruns a fixed badge. LocaleGuard runs in CI and fails the build before that reaches production.',
  },
  {
    who: 'Product managers',
    body: "You own the launch, not the ICU syntax. Get a plain PR comment that says exactly which locale is broken and why, so a release isn't blocked by a bug nobody can see in English.",
  },
  {
    who: 'Solo founders',
    body: 'No QA team, no localization engineer. One GitHub Action watches every locale on every PR, so shipping to ten languages costs you the same review effort as shipping to one.',
  },
]

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
          <div
            className="grid-bg absolute inset-x-[-50vw] -top-24 bottom-0 -z-10"
            aria-hidden="true"
          />
          <div className="aurora" aria-hidden="true" />
          <div className="relative">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              CI-first i18n linting
            </p>
            <h1 className="max-w-2xl bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Stop shipping broken localized UIs that quietly cost you revenue.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              LocaleGuard reads your translation catalogs in CI and blocks the merge on plural gaps,
              broken ICU messages, placeholder drift, and byte overflow — the silent logic bugs no
              TMS catches and no English test ever sees.
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

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6">
              {[
                {
                  stat: '$1,000–1,700/mo',
                  label: 'engineering hours saved vs. tracing keys by hand',
                },
                { stat: '5 checks', label: 'silent i18n logic bugs, blocked before merge' },
                { stat: '10 locales', label: 'CLDR plural rules enforced, ru · pl · ar · ja' },
              ].map((m) => (
                <div key={m.label} className="max-w-[13rem]">
                  <dt className="bg-gradient-to-r from-white to-white/70 bg-clip-text font-mono text-lg font-semibold tracking-tight text-transparent">
                    {m.stat}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-muted">{m.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <PrComment />
          </div>
        </section>

        {/* feature carousel */}
        <section className="pb-8" id="features">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">
              Built for the workflow
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">From red PR to green build.</h2>
          </div>
          <FeatureCarousel />
        </section>

        {/* interactive scan simulator — client-side demo, no login needed */}
        <section className="py-12" id="demo">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">
              See it catch a real bug
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Watch a byte-overflow break in front of you.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              A real German promo string that fits in English but spills past a fixed-width badge in
              de-DE. Run the scan, then apply the fix — no sign-in required.
            </p>
          </div>
          <div className="mx-auto max-w-2xl">
            <ScanSimulator />
          </div>
        </section>

        {/* who it's for */}
        <section className="py-16">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">
              Who it's for
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              One check, every role that ships to more than one language.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.who} className="rounded-xl border border-border glass p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                  {a.who}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a.body}</p>
              </div>
            ))}
          </div>
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
