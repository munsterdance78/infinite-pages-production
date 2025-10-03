import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/database/supabase'
import { ESTIMATED_CREDIT_COSTS } from '@/lib/utils/constants'
import type { Database } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

// Type definitions for admin auth
type SupabaseClient = ReturnType<typeof createServiceRoleClient>
type AdminAuthResult = NextResponse | { user: User; supabase: SupabaseClient }
type AdminAuthSuccess = { user: User; supabase: SupabaseClient }

// Type guard for admin auth
function isAdminAuthSuccess(result: AdminAuthResult): result is AdminAuthSuccess {
  return !(result instanceof NextResponse)
}

// Admin authentication middleware - simplified version
async function requireAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  const supabase = createServiceRoleClient()

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

// Subscription tier configuration
const SUBSCRIPTION_TIERS = {
  basic: {
    credits_per_month: 1332,
    price_usd: 7.99
  },
  premium: {
    credits_per_month: 2497,
    price_usd: 14.99
  }
} as const

type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

function calculateProportionalCredits(
  tier: SubscriptionTier,
  storiesRead: number,
  totalActiveUsers: number
): number {
  const baseCredits = SUBSCRIPTION_TIERS[tier].credits_per_month

  // Base credits guaranteed
  const totalCredits = baseCredits

  // Bonus credits based on reading activity
  const activityBonus = Math.floor(storiesRead * 50) // 50 credits per story read

  // Community engagement bonus
  const engagementBonus = totalActiveUsers > 100 ? Math.floor(baseCredits * 0.1) : 0

  return totalCredits + activityBonus + engagementBonus
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (!isAdminAuthSuccess(authResult)) return authResult

    // Explicitly type the destructured variables
    const { user, supabase }: { user: User; supabase: SupabaseClient } = authResult

    const body = await request.json()
    const { month, year, dryRun = false } = body

    // Calculate the month we're distributing for
    const distributionMonth = month || new Date().getMonth()
    const distributionYear = year || new Date().getFullYear()
    const startOfMonth = new Date(distributionYear, distributionMonth, 1)
    const endOfMonth = new Date(distributionYear, distributionMonth + 1, 0)

    console.log(`Processing credit distribution for ${distributionYear}-${distributionMonth + 1}`)

    // Get all active subscribers for the month
    type UserProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'subscription_tier' | 'subscription_status' | 'credits_balance' | 'credits_earned_total'>
    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        subscription_tier,
        subscription_status,
        credits_balance,
        credits_earned_total
      `)
      .in('subscription_status', ['active', 'trialing'])
      .not('subscription_tier', 'is', null)

    const activeSubscribers = data as UserProfile[] | null

    if (!activeSubscribers || activeSubscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 404 })
    }

    console.log(`Found ${activeSubscribers.length} active subscribers`)

    // Get story reading activity for the month for all users
    type StoryRead = Pick<Database['public']['Tables']['story_reads']['Row'], 'reader_id' | 'story_id' | 'unlocked_at'>
    const { data: readingData } = await supabase
      .from('story_reads')
      .select('reader_id, story_id, unlocked_at')
      .gte('unlocked_at', startOfMonth.toISOString())
      .lte('unlocked_at', endOfMonth.toISOString())

    const readingActivity = readingData as StoryRead[] | null

    // Calculate reading activity per user
    const userReadingStats = new Map<string, { storiesRead: number; uniqueStories: Set<string> }>()
    if (readingActivity) {
      for (const read of readingActivity) {
        const userId = read.reader_id
        const existing = userReadingStats.get(userId) || { storiesRead: 0, uniqueStories: new Set<string>() }
        existing.uniqueStories.add(read.story_id)
        existing.storiesRead = existing.uniqueStories.size
        userReadingStats.set(userId, existing)
      }
    }

    const totalActiveUsers = activeSubscribers.length
    const distributionResults = []

    // Process each subscriber
    for (const subscriber of activeSubscribers) {
      const userActivity = userReadingStats.get(subscriber.id)
      const storiesReadThisMonth = userActivity?.storiesRead || 0

      // Calculate proportional credits
      const creditsToDistribute = calculateProportionalCredits(
        subscriber.subscription_tier as SubscriptionTier,
        storiesReadThisMonth,
        totalActiveUsers
      )

      const result = {
        userId: subscriber.id,
        subscriptionTier: subscriber.subscription_tier,
        storiesReadThisMonth,
        baseCredits: SUBSCRIPTION_TIERS[subscriber.subscription_tier as SubscriptionTier].credits_per_month,
        bonusCredits: creditsToDistribute - SUBSCRIPTION_TIERS[subscriber.subscription_tier as SubscriptionTier].credits_per_month,
        totalCreditsDistributed: creditsToDistribute,
        distributionMonth: `${distributionYear}-${String(distributionMonth + 1).padStart(2, '0')}`
      }

      distributionResults.push(result)

      if (!dryRun) {
        // Add credits to user's balance
        const updateData = {
          credits_balance: (subscriber.credits_balance || 0) + creditsToDistribute,
          credits_earned_total: (subscriber.credits_earned_total || 0) + creditsToDistribute
        }
        const { error: updateError } = await ((supabase as any)
          .from('profiles')
          .update(updateData)
          .eq('id', subscriber.id))

        if (updateError) {
          console.error(`Failed to update credits for user ${subscriber.id}:`, updateError)
          continue
        }

        // Record the credit transaction
        const { error: transactionError } = await ((supabase as any)
          .from('credit_transactions')
          .insert({
            user_id: subscriber.id,
            amount: creditsToDistribute,
            transaction_type: 'monthly_distribution',
            description: `Monthly credit distribution for ${distributionYear}-${String(distributionMonth + 1).padStart(2, '0')}`,
            metadata: {
              distribution_month: result.distributionMonth,
              subscription_tier: subscriber.subscription_tier,
              stories_read: storiesReadThisMonth,
              base_credits: result.baseCredits,
              bonus_credits: result.bonusCredits
            }
          }))

        if (transactionError) {
          console.error(`Failed to record transaction for user ${subscriber.id}:`, transactionError)
        }
      }
    }

    // Calculate summary statistics
    const totalCreditsDistributed = distributionResults.reduce((sum, r) => sum + r.totalCreditsDistributed, 0)
    const totalBonusCredits = distributionResults.reduce((sum, r) => sum + r.bonusCredits, 0)
    const averageCreditsPerUser = distributionResults.length > 0 ? totalCreditsDistributed / distributionResults.length : 0

    const summary = {
      distributionMonth: `${distributionYear}-${String(distributionMonth + 1).padStart(2, '0')}`,
      totalUsersProcessed: distributionResults.length,
      totalCreditsDistributed,
      totalBonusCredits,
      averageCreditsPerUser: Math.round(averageCreditsPerUser),
      dryRun,
      breakdown: {
        byTier: distributionResults.reduce((acc, r) => {
          const tier = r.subscriptionTier
          if (!acc[tier]) {
            acc[tier] = { users: 0, credits: 0, bonusCredits: 0 }
          }
          acc[tier].users++
          acc[tier].credits += r.totalCreditsDistributed
          acc[tier].bonusCredits += r.bonusCredits
          return acc
        }, {} as Record<string, { users: number; credits: number; bonusCredits: number }>)
      }
    }

    console.log('Credit distribution complete:', summary)

    return NextResponse.json({
      success: true,
      summary,
      details: distributionResults.slice(0, 100), // Limit response size
      message: dryRun
        ? 'Dry run completed - no credits were actually distributed'
        : 'Credits distributed successfully'
    })

  } catch (error) {
    console.error('Credit distribution endpoint error:', error)
    return NextResponse.json({ error: 'Failed to distribute credits' }, { status: 500 })
  }
}

// Get distribution history
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (!isAdminAuthSuccess(authResult)) return authResult
    const { user, supabase }: { user: User; supabase: SupabaseClient } = authResult

    // Get recent distribution transactions
    const { data: distributions } = await ((supabase as any)
      .from('credit_transactions')
      .select(`
        created_at,
        amount,
        metadata
      `)
      .eq('transaction_type', 'monthly_distribution')
      .order('created_at', { ascending: false })
      .limit(1000))

    // Group by distribution month
    const distributionHistory = (distributions || []).reduce((acc: Record<string, {
      totalCredits: number;
      totalUsers: number;
      byTier: Record<string, { users: number; credits: number }>;
    }>, transaction: any) => {
      const metadata = transaction.metadata as { distribution_month?: string; subscription_tier?: string } | null
      const month = metadata?.distribution_month || 'unknown'

      if (!acc[month]) {
        acc[month] = {
          totalCredits: 0,
          totalUsers: 0,
          byTier: {} as Record<string, { users: number; credits: number }>
        }
      }

      acc[month].totalCredits += transaction.amount
      acc[month].totalUsers++

      const tier = metadata?.subscription_tier || 'unknown'
      if (!acc[month].byTier[tier]) {
        acc[month].byTier[tier] = { users: 0, credits: 0 }
      }
      acc[month].byTier[tier].users++
      acc[month].byTier[tier].credits += transaction.amount

      return acc
    }, {})

    return NextResponse.json({
      distributionHistory: Object.values(distributionHistory)
    })

  } catch (error) {
    console.error('Distribution history endpoint error:', error)
    return NextResponse.json({ error: 'Failed to fetch distribution history' }, { status: 500 })
  }
}