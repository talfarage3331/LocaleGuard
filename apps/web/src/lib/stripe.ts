import Stripe from 'stripe'

// Lazily constructed so build/typecheck don't require the secret to be present.
let _stripe: Stripe | null = null
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key)
  }
  return _stripe
}

// Plan catalog. Price ids come from env so the same code runs against test/live.
export type PlanId = 'free' | 'pro' | 'team'

export interface Plan {
  id: PlanId
  name: string
  price: string
  cadence: string
  priceId?: string // Stripe price id; undefined for the free tier
  features: string[]
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Open Source',
    price: '$0',
    cadence: 'forever',
    features: [
      'CLI + GitHub Action',
      'All 5 i18n checks',
      'SARIF → Code Scanning',
      'Single repo, no history',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    cadence: 'per month',
    priceId: process.env.STRIPE_PRICE_PRO,
    highlight: true,
    features: [
      'Everything in Open Source',
      'Hosted scan history',
      'Failure/success trends',
      'PR bot + hosted config',
      'Up to 10 repositories',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$79',
    cadence: 'per month',
    priceId: process.env.STRIPE_PRICE_TEAM,
    features: [
      'Everything in Pro',
      'Unlimited repositories',
      'Multi-repo dashboards',
      'Seat-based collaboration',
      'Priority support',
    ],
  },
]

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}
