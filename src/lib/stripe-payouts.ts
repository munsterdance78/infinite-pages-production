import Stripe from 'stripe'
import type { createClient } from '@/lib/supabase/client'
// import type { Database } from '@/lib/supabase/types'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2023-10-16'
})

export interface StripePayoutResult {
  success: boolean
  transfer_id?: string
  error_message?: string
  net_amount?: number
  fee_amount?: number
}

export interface CreatorPayoutInfo {
  creator_id: string
  email: string
  amount_usd: number
  stripe_customer_id: string | null
}

// Stripe fee for transfers (actual fee may vary)
export const STRIPE_TRANSFER_FEE = 0.25

/**
 * Process a single creator payout via Stripe
 * Note: This implementation simulates transfers. In production, you would:
 * 1. Set up Stripe Connect for creators
 * 2. Use stripe.transfers.create() for actual transfers
 * 3. Handle webhooks for confirmation
 */
export async function processCreatorPayout(
  payoutInfo: CreatorPayoutInfo
): Promise<StripePayoutResult> {
  try {
    const { creator_id, email: _email, amount_usd, stripe_customer_id } = payoutInfo

    // Validate minimum amount after fees
    const netAmount = amount_usd - STRIPE_TRANSFER_FEE
    if (netAmount <= 0) {
      return {
        success: false,
        error_message: `Amount too small after processing fees. Minimum: $${STRIPE_TRANSFER_FEE + 0.01}`
      }
    }

    // Check if customer exists and is valid
    if (!stripe_customer_id) {
      return {
        success: false,
        error_message: 'No Stripe customer ID found. Creator must have active payment method.'
      }
    }

    // Retrieve customer to validate
    let customer: Stripe.Customer
    try {
      const customerData = await stripe.customers.retrieve(stripe_customer_id)
      if (customerData.deleted) {
        return {
          success: false,
          error_message: 'Stripe customer account has been deleted'
        }
      }
      const _customer = customerData as Stripe.Customer
    } catch (error) {
      return {
        success: false,
        error_message: 'Invalid or inaccessible Stripe customer'
      }
    }

    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripe_customer_id,
      type: 'card'
    })

    if (paymentMethods.data.length === 0) {
      return {
        success: false,
        error_message: 'No payment methods found for customer. Cannot process refund.'
      }
    }

    // In a real implementation with Stripe Connect:
    // 1. Creator would have a Stripe Connect account
    // 2. Use stripe.transfers.create() to send money to their account
    // 3. Handle transfer webhooks for status updates

    // For now, we'll simulate a successful transfer
    // In production, replace this with actual Stripe Connect transfer:
    /*
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100), // Convert to cents
      currency: 'usd',
      destination: creator_stripe_connect_account_id,
      metadata: {
        creator_id,
        payout_batch_id: 'batch_id_here'
      }
    })
    */

    // Simulated transfer result
    const simulatedTransferId = `tr_sim_${Date.now()}_${creator_id.slice(0, 8)}`

    return {
      success: true,
      transfer_id: simulatedTransferId,
      net_amount: netAmount,
      fee_amount: STRIPE_TRANSFER_FEE
    }

  } catch (error) {
    console.error('Stripe payout error:', error)
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown Stripe error'
    }
  }
}

/**
 * Batch process multiple creator payouts
 */
export async function processBatchPayouts(
  payouts: CreatorPayoutInfo[]
): Promise<{
  successful: number
  failed: number
  total_amount: number
  results: Array<{ creator_id: string; result: StripePayoutResult }>
}> {
  const results = []
  let successful = 0
  let failed = 0
  let totalAmount = 0

  for (const payout of payouts) {
    const result = await processCreatorPayout(payout)
    results.push({ creator_id: payout.creator_id, result })

    if (result.success) {
      successful++
      totalAmount += result.net_amount || 0
    } else {
      failed++
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return {
    successful,
    failed,
    total_amount: totalAmount,
    results
  }
}

/**
 * Refund a payment to the original payment method
 * This can be used as an alternative to transfers for small amounts
 */
export async function refundToOriginalPayment(
  paymentIntentId: string,
  amount: number,
  reason: string = 'Creator payout'
): Promise<StripePayoutResult> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        type: 'creator_payout',
        reason
      }
    })

    return {
      success: true,
      transfer_id: refund.id,
      net_amount: amount,
      fee_amount: 0 // Refunds don't have additional fees
    }

  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Refund failed'
    }
  }
}

/**
 * Setup Stripe Connect for a creator (future implementation)
 * This would be used in a full implementation
 */
export async function setupCreatorStripeConnect(
  creator_id: string,
  email: string,
  country: string = 'US'
): Promise<{ success: boolean; account_id?: string; error?: string }> {
  try {
    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      metadata: {
        creator_id
      }
    })

    // Create account link for onboarding
    const _accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env['NEXT_PUBLIC_APP_URL']}/creator/stripe/refresh`,
      return_url: `${process.env['NEXT_PUBLIC_APP_URL']}/creator/stripe/success`,
      type: 'account_onboarding'
    })

    return {
      success: true,
      account_id: account.id
      // In practice, you'd redirect the user to accountLink.url
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Stripe Connect account'
    }
  }
}

/**
 * Get payout methods available for a creator
 */
export async function getCreatorPayoutMethods(
  stripe_customer_id: string
): Promise<{
  success: boolean
  methods: Array<{
    id: string
    type: string
    last4?: string
    brand?: string
    exp_month?: number
    exp_year?: number
  }>
  error?: string
}> {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripe_customer_id,
      type: 'card'
    })

    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: String(pm.type),
      ...(pm.card?.last4 !== undefined && { last4: pm.card.last4 }),
      ...(pm.card?.brand !== undefined && { brand: pm.card.brand }),
      ...(pm.card?.exp_month !== undefined && { exp_month: pm.card.exp_month }),
      ...(pm.card?.exp_year !== undefined && { exp_year: pm.card.exp_year })
    }))

    return {
      success: true,
      methods
    }

  } catch (error) {
    return {
      success: false,
      methods: [],
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods'
    }
  }
}

/**
 * Validate creator eligibility for payouts
 */
export async function validateCreatorPayoutEligibility(
  creator_id: string,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{
  eligible: boolean
  reason?: string
  customer_id?: string
  email?: string
}> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('email, stripe_customer_id, subscription_tier, is_creator')
      .eq('id', creator_id)
      .single() as { data: { email: string, stripe_customer_id: string | null, subscription_tier: string, is_creator: boolean } | null, error: Error | null }

    if (error || !profile) {
      return { eligible: false, reason: 'Creator profile not found' }
    }

    if (!profile.is_creator) {
      return { eligible: false, reason: 'User is not a creator' }
    }

    if (profile.subscription_tier !== 'premium') {
      return { eligible: false, reason: 'Premium subscription required for payouts' }
    }

    if (!profile.stripe_customer_id) {
      return { eligible: false, reason: 'No Stripe customer ID found' }
    }

    return {
      eligible: true,
      customer_id: profile.stripe_customer_id,
      email: profile.email
    }

  } catch (error) {
    return {
      eligible: false,
      reason: 'Error validating creator eligibility'
    }
  }
}