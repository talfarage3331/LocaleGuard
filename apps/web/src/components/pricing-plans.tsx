'use client'

import Link from 'next/link'
import { useState } from 'react'
import { startCheckout } from '@/app/pricing/actions'
import type { PlanKind } from '@/lib/stripe'

export interface PlanView {
  id: string
  name: string
  kind: PlanKind
  tagline: string
  monthly: number // flat $/mo (0 = free)
  annual?: number // flat $/yr total when paid yearly
  seatPrice?: number // $/seat/mo billed annually
  minSeats?: number
  features: string[]
  badges?: string[]
  contactHref?: string
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
  const [yearly, setYearly] = useState(true)
  // Seat count for the Team tier's live cost preview (shared across renders).
  const teamMin = plans.find((p) => p.kind === 'seat')?.minSeats ?? 5
  const [seats, setSeats] = useState(teamMin)

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
            2 months free
          </span>
        </span>
      </div>

      <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} yearly={yearly} seats={seats} onSeats={setSeats} />
        ))}
      </div>
    </>
  )
}

function PlanCard({
  plan,
  yearly,
  seats,
  onSeats,
}: {
  plan: PlanView
  yearly: boolean
  seats: number
  onSeats: (n: number) => void
}) {
  return (
    <div
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
      <p className="mt-1 min-h-[2.5rem] text-sm text-muted">{plan.tagline}</p>

      <Price plan={plan} yearly={yearly} seats={seats} onSeats={onSeats} />

      <ul className="mt-7 flex flex-1 flex-col gap-3 text-sm">
        {plan.badges && (
          <li className="mb-1 flex flex-wrap gap-1.5">
            {plan.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
              >
                {b}
              </span>
            ))}
          </li>
        )}
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check />
            <span className="text-muted">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PlanAction plan={plan} yearly={yearly} seats={seats} />
      </div>
    </div>
  )
}

function Price({
  plan,
  yearly,
  seats,
  onSeats,
}: {
  plan: PlanView
  yearly: boolean
  seats: number
  onSeats: (n: number) => void
}) {
  if (plan.kind === 'contact') {
    return (
      <div className="mt-5">
        <span className="text-3xl font-semibold tracking-tight">Let&apos;s talk</span>
        <p className="mt-1 text-xs text-muted">Custom pricing & terms</p>
      </div>
    )
  }

  if (plan.kind === 'seat') {
    const min = plan.minSeats ?? 5
    const perSeat = plan.seatPrice ?? 12
    const monthly = seats * perSeat
    return (
      <div className="mt-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">${monthly}</span>
          <span className="text-sm text-muted">/ mo</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          ${perSeat}/seat · billed annually · ${monthly * 12}/yr
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Team size</span>
            <span className="tabular-nums text-text">{seats} seats</span>
          </div>
          <input
            type="range"
            min={min}
            max={50}
            value={seats}
            onChange={(e) => onSeats(Number(e.target.value))}
            aria-label="Number of seats"
            className="mt-2 w-full accent-brand"
          />
          <p className="mt-1 text-[11px] text-muted">
            Minimum {min} seats (${min * perSeat}/mo)
          </p>
        </div>
      </div>
    )
  }

  // flat: free or pro
  if (plan.monthly === 0) {
    return (
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">$0</span>
        <span className="text-sm text-muted">forever</span>
      </div>
    )
  }

  const annual = plan.annual ?? plan.monthly * 12
  const shownMonthly = yearly ? Math.round(annual / 12) : plan.monthly
  const savings = plan.monthly * 12 - annual
  return (
    <div className="mt-5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">${shownMonthly}</span>
        <span className="text-sm text-muted">/ mo</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {yearly ? (
          <>
            ${annual} billed yearly
            {savings > 0 && <span className="ml-1.5 font-medium text-ok">save ${savings}/yr</span>}
          </>
        ) : (
          'billed monthly'
        )}
      </p>
    </div>
  )
}

function PlanAction({ plan, yearly, seats }: { plan: PlanView; yearly: boolean; seats: number }) {
  if (plan.isCurrent) {
    return (
      <div className="rounded-lg border border-border py-2.5 text-center text-sm text-muted">
        Current plan
      </div>
    )
  }

  if (plan.kind === 'contact') {
    return (
      <a
        href={plan.contactHref ?? '#'}
        className="block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
      >
        Contact sales
      </a>
    )
  }

  if (!plan.buyable) {
    return (
      <Link
        href="/dashboard"
        className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-text transition hover:border-brand"
      >
        Get started
      </Link>
    )
  }

  // Team always bills annually; Pro follows the toggle.
  const cycle = plan.kind === 'seat' || yearly ? 'yearly' : 'monthly'
  return (
    <form action={startCheckout}>
      <input type="hidden" name="plan" value={plan.id} />
      <input type="hidden" name="cycle" value={cycle} />
      {plan.kind === 'seat' && <input type="hidden" name="seats" value={seats} />}
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
  )
}
