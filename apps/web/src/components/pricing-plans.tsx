'use client'

import Link from 'next/link'
import { useState } from 'react'
import { startCheckout } from '@/app/pricing/actions'

export interface PlanView {
  id: string
  name: string
  monthly: number // dollars/month; 0 = free
  features: string[]
  highlight?: boolean
  buyable: boolean
  isCurrent: boolean
}

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

export function PricingPlans({ plans }: { plans: PlanView[] }) {
  const [yearly, setYearly] = useState(false)

  return (
    <>
      {/* billing toggle */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span className={yearly ? 'text-muted' : 'text-text'}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle annual billing"
          onClick={() => setYearly((v) => !v)}
          className={`relative h-7 w-12 rounded-full border border-border transition-colors ${
            yearly ? 'bg-brand' : 'bg-panel'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              yearly ? 'left-6' : 'left-1'
            }`}
          />
        </button>
        <span className={yearly ? 'text-text' : 'text-muted'}>
          Yearly
          <span className="ml-2 rounded-full bg-ok/15 px-2 py-0.5 text-xs font-medium text-ok">
            Save 25%
          </span>
        </span>
      </div>

      <div className="relative grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          // ponytail: yearly price is displayed illustratively (monthly × 12 × 0.75).
          // Checkout still uses the plan's existing monthly Stripe price id — wire a
          // STRIPE_PRICE_*_YEARLY id + pass it through when true annual billing is added.
          const yearlyTotal = Math.round(plan.monthly * 12 * 0.75)
          const shown =
            plan.monthly === 0 ? 0 : yearly ? Math.round(yearlyTotal / 12) : plan.monthly

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 glass ${
                plan.highlight
                  ? 'border-brand/60 shadow-[0_0_0_1px_var(--color-brand),0_24px_70px_-24px_rgba(99,102,241,0.5)]'
                  : 'border-border'
              }`}
            >
              {plan.highlight && (
                <>
                  <div
                    className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-brand/25 to-transparent blur-md"
                    aria-hidden="true"
                  />
                  <span className="animate-badge absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                    Most popular
                  </span>
                </>
              )}

              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">${shown}</span>
                <span className="text-sm text-muted">
                  {plan.monthly === 0 ? 'forever' : '/ mo'}
                </span>
              </div>
              {plan.monthly > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {yearly ? `$${yearlyTotal} billed annually` : 'billed monthly'}
                </p>
              )}

              <ul className="mt-7 flex flex-1 flex-col gap-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.isCurrent ? (
                  <div className="rounded-lg border border-border py-2.5 text-center text-sm text-muted">
                    Current plan
                  </div>
                ) : plan.buyable ? (
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg py-2.5 text-sm font-medium transition ${
                        plan.highlight
                          ? 'bg-brand text-white shadow-lg shadow-brand/30 hover:opacity-90'
                          : 'border border-border text-text hover:border-brand'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/dashboard"
                    className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-text transition hover:border-brand"
                  >
                    Get started
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
