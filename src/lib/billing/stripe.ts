import Stripe from 'stripe'
import { env } from '@/types/environment'

/**
 * Server-side Stripe client
 * Uses exact environment variables from Vercel
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'Infinite Pages V3',
    version: '3.0.0'
  }
})

/**
 * Stripe configuration using exact Vercel environment variables
 */
export const stripeConfig = {
  // Price ID from your exact Vercel variable
  priceId: env.STRIPE_PRICE_ID,

  // Webhook secret for signature verification
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,

  // Connect client ID for creator onboarding
  connectClientId: env.STRIPE_CONNECT_CLIENT_ID,

  // Site URL for redirects
  siteUrl: env.SITE_URL,

  // Success and cancel URLs
  successUrl: `${env.SITE_URL}/billing/success`,
  cancelUrl: `${env.SITE_URL}/billing/cancel`,

  // Creator onboarding URLs
  creatorRefreshUrl: `${env.SITE_URL}/creator/stripe/refresh`,
  creatorReturnUrl: `${env.SITE_URL}/creator/stripe/success`
} as const

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession({
  customerId,
  priceId = stripeConfig.priceId,
  successUrl = stripeConfig.successUrl,
  cancelUrl = stripeConfig.cancelUrl,
  metadata = {}
}: {
  customerId?: string
  priceId?: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}) {
  const sessionParams: any = {
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata
  }

  if (customerId) {
    sessionParams.customer = customerId
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession({
  customerId,
  returnUrl = stripeConfig.siteUrl
}: {
  customerId: string
  returnUrl?: string
}) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    stripeConfig.webhookSecret
  )
}