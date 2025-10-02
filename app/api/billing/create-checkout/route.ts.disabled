import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import { stripe } from '@/lib/billing/stripe'
import { env } from '@/types/environment'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult
  const { user, supabase } = authResult

  if (!user?.email) {
    return NextResponse.json(
      { error: 'User email required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { tier, billing_period } = await request.json()

    // Validate tier
    if (!tier || !['basic', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Valid subscription tier required (basic or premium)' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate billing period
    if (!billing_period || !['monthly', 'yearly'].includes(billing_period)) {
      return NextResponse.json(
        { error: 'Valid billing period required (monthly or yearly)' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Determine price ID based on tier and billing period
    const priceId = billing_period === 'monthly'
      ? (tier === 'basic'
         ? env.STRIPE_BASIC_MONTHLY_PRICE_ID
         : env.STRIPE_PREMIUM_MONTHLY_PRICE_ID)
      : (tier === 'basic'
         ? env.STRIPE_BASIC_YEARLY_PRICE_ID
         : env.STRIPE_PREMIUM_YEARLY_PRICE_ID)

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe configuration error - price ID not found' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${env.SITE_URL}/dashboard?upgraded=true&tier=${tier}`,
      cancel_url: `${env.SITE_URL}/dashboard`,
      metadata: {
        userId: user.id,
        tier: tier,
        billing_period: billing_period
      }
    })

    return NextResponse.json(
      { url: session.url },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  })
}