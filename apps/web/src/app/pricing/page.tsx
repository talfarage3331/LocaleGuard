import { auth } from '@/auth'
import { type PlanView, PricingPlans } from '@/components/pricing-plans'
import { SiteHeader } from '@/components/site-header'
import { PLANS } from '@/lib/stripe'

export const metadata = { title: 'Pricing — LocaleGuard' }

export default async function Pricing() {
  const session = await auth()
  const currentPlan = session?.user?.plan ?? 'free'

  // Flatten server-only Plan (imports the Stripe SDK) into plain props so the
  // client toggle never bundles Stripe. Price ids stay on the server.
  const plans: PlanView[] = PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    tagline: p.tagline,
    monthly: p.monthly,
    annual: p.annual,
    seatPrice: p.seatPrice,
    minSeats: p.minSeats,
    features: p.features,
    badges: p.badges,
    contactHref: p.contactHref,
    highlight: p.highlight,
    isCurrent: p.id === currentPlan,
    buyable: Boolean(p.priceId) && p.id !== currentPlan,
  }))

  return (
    <>
      <SiteHeader />

      <main className="relative isolate mx-auto max-w-7xl px-6">
        <div className="aurora" aria-hidden="true" />

        <section className="relative py-16 text-center sm:py-20">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">Pricing</p>
          <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Start free. Upgrade when CI cares.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            The engine, CLI and Action are MIT and free forever. Pay only for hosted history,
            dashboards and the PR bot.
          </p>
        </section>

        <section className="relative pb-24">
          <PricingPlans plans={plans} />
        </section>
      </main>
    </>
  )
}
