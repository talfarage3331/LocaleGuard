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
export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

// How a plan is priced — the card renders differently per kind:
//   flat    → fixed monthly, optional yearly toggle (free, pro)
//   seat    → per-seat/month billed annually, with a seat slider (team)
//   contact → no self-serve checkout, "Contact sales" (enterprise)
export type PlanKind = 'flat' | 'seat' | 'contact'

export interface Plan {
  id: PlanId
  name: string
  kind: PlanKind
  tagline: string
  monthly: number // flat $/mo (0 = free)
  annual?: number // flat $/yr total when paid yearly (pro: 290)
  seatPrice?: number // $/seat/mo billed annually (team: 12)
  minSeats?: number // team floor (5)
  priceId?: string // Stripe price id for the monthly/default cadence
  priceIdYearly?: string // Stripe price id for annual billing
  features: string[]
  badges?: string[] // enterprise compliance chips
  contactHref?: string
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    kind: 'flat',
    tagline: 'For a single project getting started.',
    monthly: 0,
    features: [
      'CLI + GitHub Action (MIT)',
      'All 5 i18n checks',
      'SARIF → Code Scanning',
      '1 private repository',
      'Basic scan dashboard',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    kind: 'flat',
    tagline: 'For teams shipping in many languages.',
    monthly: 29,
    annual: 290,
    priceId: process.env.STRIPE_PRICE_PRO,
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    highlight: true,
    features: [
      'Everything in Free',
      'Up to 5 private repositories',
      'New-only blocking (fail on new bugs)',
      'Rich PR decorations + hosted config',
      'Slack alerts',
      'Full scan history & trends',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    kind: 'seat',
    tagline: 'For orgs enforcing i18n quality at scale.',
    monthly: 0,
    seatPrice: 12,
    minSeats: 5,
    priceId: process.env.STRIPE_PRICE_TEAM_SEAT,
    features: [
      'Everything in Pro',
      'Unlimited repositories',
      'Org-wide policy enforcement',
      'AI fix suggestions quota',
      'Slack + Teams alerts',
      'Manager reporting dashboards',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    kind: 'contact',
    tagline: 'For security & compliance requirements.',
    monthly: 0,
    contactHref: 'mailto:sales@localeguard.dev?subject=LocaleGuard%20Enterprise',
    badges: ['SSO / SAML', 'SCIM', 'Audit logs'],
    features: [
      'Everything in Team',
      'Dedicated support & SLA',
      'Self-hosted / VPC option',
      'Custom contract & invoicing',
    ],
  },
]

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}
