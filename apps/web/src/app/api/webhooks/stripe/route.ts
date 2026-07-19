import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { db } from '@/db'
import { planEnum, users } from '@/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

// Paid tiers only — a webhook must never silently set an unknown plan.
const PAID_PLANS = planEnum.enumValues.filter((p) => p !== 'free')
function toPaidPlan(value: string | undefined): (typeof PAID_PLANS)[number] {
  return (PAID_PLANS as readonly string[]).includes(value ?? '')
    ? (value as (typeof PAID_PLANS)[number])
    : 'pro'
}

// Verify every webhook signature before trusting a single byte of the body.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get('stripe-signature')
  if (!secret || !sig) {
    return NextResponse.json({ error: 'Not configured' }, { status: 400 })
  }

  const body = await req.text() // raw body required for signature verification
  let event: Stripe.Event
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object
      const userId = s.metadata?.userId
      if (userId && s.customer) {
        await db
          .update(users)
          .set({
            stripeCustomerId: String(s.customer),
            stripeSubscriptionId: s.subscription ? String(s.subscription) : null,
            plan: toPaidPlan(s.metadata?.plan),
            subscriptionStatus: 'active',
          })
          .where(eq(users.id, userId))
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object
      await db
        .update(users)
        .set({
          subscriptionStatus: sub.status,
          stripeSubscriptionId: sub.id,
          // Downgrade to free once the subscription is no longer live.
          ...(sub.status === 'active' || sub.status === 'trialing' ? {} : { plan: 'free' }),
        })
        .where(eq(users.stripeCustomerId, String(sub.customer)))
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await db
        .update(users)
        .set({ plan: 'free', subscriptionStatus: 'canceled', stripeSubscriptionId: null })
        .where(eq(users.stripeCustomerId, String(sub.customer)))
      break
    }
  }

  return NextResponse.json({ received: true })
}
