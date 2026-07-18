'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { planById, stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Kick off a hosted Stripe Checkout for the selected plan. Card entry stays on Stripe.
export async function startCheckout(formData: FormData) {
  const session = await auth()
  if (!session) redirect('/dashboard') // sign-in gate

  const planId = String(formData.get('plan') ?? '')
  const plan = planById(planId)
  if (!plan?.priceId) redirect('/pricing') // free tier / unconfigured price → nothing to buy

  const [user] = await db
    .select({ id: users.id, email: users.email, customerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
  if (!user) redirect('/dashboard')

  const checkout = await stripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    customer: user.customerId ?? undefined,
    customer_email: user.customerId ? undefined : (user.email ?? undefined),
    metadata: { userId: user.id, plan: plan.id },
    subscription_data: { metadata: { userId: user.id, plan: plan.id } },
    success_url: `${APP_URL}/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/pricing?checkout=cancelled`,
  })

  if (checkout.url) redirect(checkout.url)
  redirect('/pricing')
}
