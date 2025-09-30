import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/billing/stripe'
import { createServiceRoleClient } from '@/lib/database/supabase'
import { env } from '@/types/environment'
import { SUBSCRIPTION_LIMITS } from '@/lib/utils/constants'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata?.['userId']) return

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const supabase = createServiceRoleClient()

  // Determine tier from metadata, default to premium for backward compatibility
  const tier = session.metadata?.['tier'] || 'premium'
  const subscriptionLimits = SUBSCRIPTION_LIMITS[tier as 'basic' | 'premium']
  const creditsToGrant = subscriptionLimits.MONTHLY_CREDITS

  console.log(`[Webhook] Checkout completed for user ${session.metadata?.['userId']}, tier: ${tier}, credits: ${creditsToGrant}`)

  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      tokens_remaining: creditsToGrant,
      stripe_subscription_id: subscription.id
    })
    .eq('id', session.metadata?.['userId'])

  // Log the subscription event
  await supabase
    .from('subscription_logs')
    .insert({
      user_id: session.metadata?.['userId'],
      event_type: 'subscription_created',
      subscription_tier: tier,
      credits_granted: creditsToGrant,
      stripe_session_id: session.id,
      stripe_subscription_id: subscription.id
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if ('metadata' in customer && customer.metadata?.['userId']) {
    const supabase = createServiceRoleClient()

    console.log(`[Webhook] Subscription updated for user ${customer.metadata?.['userId']}, status: ${subscription.status}`)

    await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', customer.metadata?.['userId'])

    // Log the subscription event
    await supabase
      .from('subscription_logs')
      .insert({
        user_id: customer.metadata?.['userId'],
        event_type: 'subscription_updated',
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id
      })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if ('metadata' in customer && customer.metadata?.['userId']) {
    const supabase = createServiceRoleClient()
    const basicLimits = SUBSCRIPTION_LIMITS.basic

    console.log(`[Webhook] Subscription cancelled for user ${customer.metadata?.['userId']}`)

    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'basic',
        subscription_status: 'cancelled',
        current_period_end: null,
        tokens_remaining: basicLimits.MONTHLY_CREDITS, // Revert to basic tier credits
        stripe_subscription_id: null
      })
      .eq('id', customer.metadata?.['userId'])

    // Log the subscription event
    await supabase
      .from('subscription_logs')
      .insert({
        user_id: customer.metadata?.['userId'],
        event_type: 'subscription_cancelled',
        subscription_tier: 'basic',
        credits_granted: basicLimits.MONTHLY_CREDITS,
        stripe_subscription_id: subscription.id
      })
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if ('metadata' in customer && customer.metadata?.['userId']) {
    const supabase = createServiceRoleClient()

    // Get current profile to determine tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', customer.metadata?.['userId'])
      .single()

    if (profile) {
      const tier = profile.subscription_tier as 'basic' | 'premium'
      const subscriptionLimits = SUBSCRIPTION_LIMITS[tier]

      console.log(`[Webhook] Payment succeeded for user ${customer.metadata?.['userId']}, refreshing ${subscriptionLimits.MONTHLY_CREDITS} credits`)

      // Refresh monthly credits
      await supabase
        .from('profiles')
        .update({
          tokens_remaining: subscriptionLimits.MONTHLY_CREDITS,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', customer.metadata?.['userId'])

      // Log the payment event
      await supabase
        .from('subscription_logs')
        .insert({
          user_id: customer.metadata?.['userId'],
          event_type: 'payment_succeeded',
          subscription_tier: tier,
          credits_granted: subscriptionLimits.MONTHLY_CREDITS,
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: subscription.id
        })
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if ('metadata' in customer && customer.metadata?.['userId']) {
    const supabase = createServiceRoleClient()

    console.log(`[Webhook] Payment failed for user ${customer.metadata?.['userId']}`)

    // Log the payment failure
    await supabase
      .from('subscription_logs')
      .insert({
        user_id: customer.metadata?.['userId'],
        event_type: 'payment_failed',
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscription.id
      })

    // Optionally notify user or take action based on payment failure
    // This could include sending an email, updating subscription status, etc.
  }
}