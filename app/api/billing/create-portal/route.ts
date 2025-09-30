import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import { stripe } from '@/lib/billing/stripe'
import { env } from '@/types/environment'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult
  const { user, supabase } = authResult

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No customer found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${env.SITE_URL}/dashboard`
    })

    return NextResponse.json(
      { url: session.url },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
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