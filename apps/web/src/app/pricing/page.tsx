import Link from 'next/link'
import { auth } from '@/auth'
import { PLANS } from '@/lib/stripe'
import { startCheckout } from './actions'

export const metadata = { title: 'Pricing — LocaleGuard' }

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      className="mt-0.5 shrink-0 text-ok"
      aria-hidden="true"
    >
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default async function Pricing() {
  const session = await auth()
  const currentPlan = session?.user?.plan ?? 'free'

  return (
    <main className="mx-auto max-w-6xl px-6">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
          locale<span className="text-brand">guard</span>
        </Link>
        <Link
          href={session ? '/dashboard' : '/'}
          className="text-sm text-muted transition hover:text-text"
        >
          {session ? 'Dashboard →' : 'Home →'}
        </Link>
      </header>

      <section className="py-14 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">Pricing</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Start free. Upgrade when CI cares.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          The engine, CLI and Action are MIT and free forever. Pay only for hosted history,
          dashboards and the PR bot.
        </p>
      </section>

      <section className="grid items-start gap-6 pb-24 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const buyable = Boolean(plan.priceId) && !isCurrent
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.highlight
                  ? 'border-brand bg-panel shadow-[0_0_0_1px_var(--color-brand),0_20px_60px_-20px_rgba(99,102,241,0.35)]'
                  : 'border-border bg-panel'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {plan.price}
                </span>
                <span className="text-sm text-muted">/ {plan.cadence}</span>
              </div>

              <ul className="mt-7 flex flex-1 flex-col gap-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-text">
                    <Check />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrent ? (
                  <div className="rounded-lg border border-border py-2.5 text-center text-sm text-muted">
                    Current plan
                  </div>
                ) : buyable ? (
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg py-2.5 text-sm font-medium transition ${
                        plan.highlight
                          ? 'bg-brand text-white hover:opacity-90'
                          : 'border border-border text-text hover:border-brand'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  </form>
                ) : (
                  <Link
                    href={session ? '/dashboard' : '/'}
                    className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-text transition hover:border-brand"
                  >
                    Get started
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
