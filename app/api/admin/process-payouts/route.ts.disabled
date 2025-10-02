import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/database/supabase'

// Admin authentication middleware - simplified version
async function requireAdminAuth(request: NextRequest) {
  const supabase = createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you can add proper admin checking here)
    // For now, we'll use a simple email check
    const adminEmails = process.env['ADMIN_EMAILS']?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return { user, supabase }
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}

const MINIMUM_PAYOUT_USD = 10.00

interface PayoutProcessingResult {
  success: boolean
  batch_id: string | null
  eligible_creators: number
  total_amount: number
  successful_transfers: number
  failed_transfers: number
  errors: string[]
}

// Helper function to safely access profiles data
function getProfileData(profiles: any) {
  if (Array.isArray(profiles)) {
    return profiles[0] || {}
  }
  return profiles || {}
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user, supabase } = authResult

    const body = await request.json()
    const { batch_date, dry_run = false, minimum_payout = MINIMUM_PAYOUT_USD } = body

    const processingDate = batch_date ? new Date(batch_date) : new Date()
    processingDate.setHours(0, 0, 0, 0) // Start of day

    console.log(`Processing payouts for ${processingDate.toISOString().split('T')[0]}${dry_run ? ' (DRY RUN)' : ''}`)

    // Check if we already processed payouts for this date
    const { data: existingBatch } = await supabase
      .from('monthly_payout_batches')
      .select('id, processing_status')
      .eq('batch_date', processingDate.toISOString().split('T')[0])
      .single()

    if (existingBatch && !dry_run) {
      return NextResponse.json({
        error: `Payouts already processed for ${processingDate.toISOString().split('T')[0]}`,
        existing_batch: existingBatch
      }, { status: 400 })
    }

    if (dry_run) {
      // Dry run - just calculate what would be paid
      const { data: eligibleCreators } = await supabase
        .from('creator_earnings_accumulation')
        .select(`
          creator_id,
          total_accumulated_usd,
          user_profiles!creator_earnings_accumulation_creator_id_fkey (email, stripe_customer_id)
        `)
        .gte('total_accumulated_usd', minimum_payout)

      const totalAmount = eligibleCreators?.reduce((sum, c) => sum + c.total_accumulated_usd, 0) || 0

      return NextResponse.json({
        dry_run: true,
        eligible_creators: eligibleCreators?.length || 0,
        total_amount: totalAmount,
        minimum_payout,
        processing_date: processingDate.toISOString().split('T')[0],
        creators: eligibleCreators?.map(c => {
          const profile = getProfileData(c.user_profiles)
          return {
            creator_id: c.creator_id,
            email: profile.email,
            amount: c.total_accumulated_usd,
            has_stripe_customer: !!profile.stripe_customer_id
          }
        })
      })
    }

    // Process actual payouts
    const result: PayoutProcessingResult = {
      success: true,
      batch_id: null,
      eligible_creators: 0,
      total_amount: 0,
      successful_transfers: 0,
      failed_transfers: 0,
      errors: []
    }

    // Create payout batch
    const { data: batchData, error: batchError } = await supabase
      .from('monthly_payout_batches')
      .insert({
        batch_date: processingDate.toISOString().split('T')[0],
        processing_status: 'processing',
        minimum_payout_usd: minimum_payout
      })
      .select()
      .single()

    if (batchError || !batchData) {
      return NextResponse.json({
        error: 'Failed to create payout batch',
        details: batchError
      }, { status: 500 })
    }

    const batch_id = batchData.id
    result.batch_id = batch_id

    // Get eligible creators
    const { data: eligibleCreators } = await supabase
      .from('creator_earnings_accumulation')
      .select(`
        creator_id,
        total_accumulated_usd,
        user_profiles!creator_earnings_accumulation_creator_id_fkey (
          email,
          stripe_customer_id
        )
      `)
      .gte('total_accumulated_usd', minimum_payout)

    if (!eligibleCreators || eligibleCreators.length === 0) {
      await supabase
        .from('monthly_payout_batches')
        .update({ processing_status: 'completed' })
        .eq('id', batch_id)

      return NextResponse.json({
        ...result,
        message: 'No creators eligible for payout this month'
      })
    }

    result.eligible_creators = eligibleCreators.length
    result.total_amount = eligibleCreators.reduce((sum, c) => sum + c.total_accumulated_usd, 0)

    // Create individual payout records
    const payoutRecords = eligibleCreators.map(creator => ({
      batch_id,
      creator_id: creator.creator_id,
      amount_usd: creator.total_accumulated_usd,
      status: 'pending' as const
    }))

    const { data: payouts, error: payoutInsertError } = await supabase
      .from('individual_payouts')
      .insert(payoutRecords)
      .select(`
        id,
        creator_id,
        amount_usd,
        user_profiles!individual_payouts_creator_id_fkey (
          stripe_customer_id,
          email
        )
      `)

    if (payoutInsertError || !payouts) {
      result.success = false
      result.errors.push('Failed to create individual payout records')
      return NextResponse.json(result, { status: 500 })
    }

    // Process Stripe transfers (simulated for now)
    for (const payout of payouts) {
      const profile = getProfileData(payout.user_profiles)
      try {
        const stripeCustomerId = profile.stripe_customer_id

        if (!stripeCustomerId) {
          result.failed_transfers++
          result.errors.push(`Creator ${profile.email} has no Stripe customer ID`)

          await supabase
            .from('individual_payouts')
            .update({
              status: 'failed',
              error_message: 'No Stripe customer ID found'
            })
            .eq('id', payout.id)

          continue
        }

        // Calculate transfer amount (subtract Stripe fee)
        const transferFee = 0.25 // $0.25 per transfer
        const transferAmount = Math.max(0, (payout.amount_usd - transferFee) * 100) // Convert to cents

        if (transferAmount <= 0) {
          result.failed_transfers++
          result.errors.push(`Creator ${profile.email} amount too small after fees`)

          await supabase
            .from('individual_payouts')
            .update({
              status: 'failed',
              error_message: 'Amount too small after processing fees'
            })
            .eq('id', payout.id)

          continue
        }

        // Simulated transfer (in production, use actual Stripe transfers)
        const simulatedTransferId = `tr_sim_${Date.now()}_${payout.id.slice(0, 8)}`

        await supabase
          .from('individual_payouts')
          .update({
            status: 'completed',
            stripe_transfer_id: simulatedTransferId
          })
          .eq('id', payout.id)

        // Reset creator earnings after successful payout
        await supabase
          .from('creator_earnings_accumulation')
          .update({ total_accumulated_usd: 0 })
          .eq('creator_id', payout.creator_id)

        result.successful_transfers++

        console.log(`Simulated transfer for creator ${profile.email}: $${payout.amount_usd}`)

      } catch (error) {
        result.failed_transfers++
        result.errors.push(`Creator ${profile.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)

        await supabase
          .from('individual_payouts')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', payout.id)
      }
    }

    // Update batch status
    const batchStatus = result.failed_transfers === 0 ? 'completed' : 'partially_completed'
    await supabase
      .from('monthly_payout_batches')
      .update({
        processing_status: batchStatus,
        total_creators_paid: result.successful_transfers
      })
      .eq('id', batch_id)

    result.success = result.successful_transfers > 0

    return NextResponse.json({
      ...result,
      message: `Processed ${result.successful_transfers} successful transfers, ${result.failed_transfers} failed`,
      batch_status: batchStatus,
      processing_date: processingDate.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Payout processing endpoint error:', error)
    return NextResponse.json({ error: 'Failed to process payouts' }, { status: 500 })
  }
}

// Get payout batch status
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user, supabase } = authResult

    // Get recent payout batches
    const { data: batches } = await supabase
      .from('monthly_payout_batches')
      .select(`
        *,
        individual_payouts (
          id,
          creator_id,
          amount_usd,
          status,
          error_message,
          user_profiles!individual_payouts_creator_id_fkey (email)
        )
      `)
      .order('batch_date', { ascending: false })
      .limit(12) // Last 12 months

    return NextResponse.json({
      recent_batches: batches?.map((batch: any) => ({
        ...batch,
        individual_payouts: batch.individual_payouts?.map((payout: any) => {
          const payoutProfile = getProfileData(payout.user_profiles)
          return {
            ...payout,
            creator_email: payoutProfile.email
          }
        })
      })) || []
    })

  } catch (error) {
    console.error('Payout batch status endpoint error:', error)
    return NextResponse.json({ error: 'Failed to fetch payout status' }, { status: 500 })
  }
}