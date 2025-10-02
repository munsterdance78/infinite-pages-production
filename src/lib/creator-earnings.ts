import type { createClient } from '@/lib/supabase/client'
import { CREATOR_REVENUE_SHARE } from '@/lib/subscription-config'
import type { Database } from '@/lib/supabase/types'

export interface EarningsAllocation {
  creatorId: string
  storyId: string
  creditsSpent: number
  creatorEarnings: number
  usdEquivalent: number
  readerUserId: string
}

export interface CreatorEarningsAccumulation {
  id: string
  creator_id: string
  total_accumulated_usd: number
  last_payout_date: string | null
  last_payout_amount: number | null
  created_at: string
  updated_at: string
}

// Convert credits to USD (assuming 1 credit = $0.01 for calculations)
export const CREDITS_TO_USD_RATE = 0.01

export async function allocateCreatorEarnings(
  allocation: EarningsAllocation,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { creatorId, storyId, creditsSpent, readerUserId } = allocation

    // Calculate earnings (70% of credits spent)
    const creatorEarnings = Math.floor(creditsSpent * CREATOR_REVENUE_SHARE)
    const usdEquivalent = creatorEarnings * CREDITS_TO_USD_RATE

    // Start transaction
    const { data, error } = await (supabaseClient as any).rpc('allocate_creator_earnings', {
      p_creator_id: creatorId,
      p_story_id: storyId,
      p_reader_id: readerUserId,
      p_credits_spent: creditsSpent,
      p_creator_earnings: creatorEarnings,
      p_usd_equivalent: usdEquivalent
    })

    if (error) {
      console.error('Error allocating creator earnings:', error)
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Creator earnings allocation failed:', error)
    return { success: false, error: 'Failed to allocate creator earnings' }
  }
}

export async function getCreatorAccumulatedEarnings(
  creatorId: string,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ earnings: CreatorEarningsAccumulation | null; error?: string }> {
  try {
    const { data, error } = await supabaseClient
      .from('creator_earnings_accumulation')
      .select('*')
      .eq('creator_id', creatorId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { earnings: null, error: error.message }
    }

    return { earnings: data }

  } catch (error) {
    console.error('Error fetching creator earnings:', error)
    return { earnings: null, error: 'Failed to fetch creator earnings' }
  }
}

export async function initializeCreatorEarnings(
  creatorId: string,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabaseClient as any)
      .from('creator_earnings_accumulation')
      .upsert({
        creator_id: creatorId,
        total_accumulated_usd: 0.00,
        last_payout_date: null,
        last_payout_amount: null
      }, {
        onConflict: 'creator_id'
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Error initializing creator earnings:', error)
    return { success: false, error: 'Failed to initialize creator earnings' }
  }
}

export function calculateNextPayoutDate(): Date {
  const now = new Date()
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(nextYear, nextMonth, 1) // 1st of next month
}

export function canRequestPayout(accumulatedAmount: number, minimumPayout: number = 25.00): boolean {
  return accumulatedAmount >= minimumPayout
}

export function getPayoutEligibilityMessage(
  accumulatedAmount: number,
  minimumPayout: number = 25.00
): string {
  if (canRequestPayout(accumulatedAmount, minimumPayout)) {
    return `Ready for payout! You have $${accumulatedAmount.toFixed(2)} available.`
  } else {
    const remaining = minimumPayout - accumulatedAmount
    return `Need $${remaining.toFixed(2)} more to reach minimum payout of $${minimumPayout}.`
  }
}

export async function getCreatorEarningsHistory(
  creatorId: string,
  limit: number = 50,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ earnings: Array<{
  id: string
  creator_id: string
  story_id: string
  reader_id: string
  credits_spent: number
  creator_earnings: number
  usd_equivalent: number
  created_at: string
  stories?: { id: string; title: string }
  profiles?: { email: string }
}>; error?: string }> {
  try {
    const { data, error } = await supabaseClient
      .from('creator_earnings')
      .select(`
        *,
        stories (id, title),
        profiles!creator_earnings_reader_id_fkey (email)
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { earnings: [], error: error.message }
    }

    return { earnings: data || [] }

  } catch (error) {
    console.error('Error fetching creator earnings history:', error)
    return { earnings: [], error: 'Failed to fetch earnings history' }
  }
}

export async function getCreatorPayoutHistory(
  creatorId: string,
  limit: number = 20,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ payouts: Array<{
  id: string
  creator_id: string
  payout_amount: number
  payout_date: string
  payment_method: string
  status: string
  created_at: string
  monthly_payout_batches?: {
    batch_date: string
    processing_status: string
  }
}>; error?: string }> {
  try {
    const { data, error } = await supabaseClient
      .from('individual_payouts')
      .select(`
        *,
        monthly_payout_batches (batch_date, processing_status)
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { payouts: [], error: error.message }
    }

    return { payouts: data || [] }

  } catch (error) {
    console.error('Error fetching creator payout history:', error)
    return { payouts: [], error: 'Failed to fetch payout history' }
  }
}