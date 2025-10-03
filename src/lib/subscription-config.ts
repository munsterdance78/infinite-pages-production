// Standardized Subscription Configuration
// Two-tier system: Basic and Premium

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    price_monthly: 7.99,
    price_yearly: 79.99,
    credits_per_month: 5000, // 5,000 credits per month
    max_credit_balance: 15000, // 3-month accumulation limit (5,000 * 3)
    features: {
      stories_limit: 5,
      cover_generations: 2,
      download_access: false,
      ai_operations: ['foundation', 'character', 'chapter'],
      cover_styles: ['minimalist', 'artistic'],
      priority_support: false,
      early_access: false,
      creator_tools: false,
      credit_reversion: true // Excess credits revert to site
    },
    stripe_price_id_monthly: process.env['STRIPE_BASIC_MONTHLY_PRICE_ID'] || 'price_basic_monthly',
    stripe_price_id_yearly: process.env['STRIPE_BASIC_YEARLY_PRICE_ID'] || 'price_basic_yearly'
  },
  premium: {
    name: 'Premium',
    price_monthly: 14.99,
    price_yearly: 149.99,
    credits_per_month: 10000, // 10,000 credits per month
    max_credit_balance: null, // Unlimited accumulation
    features: {
      stories_limit: 'unlimited',
      cover_generations: 10,
      ai_operations: ['foundation', 'character', 'chapter', 'improvement', 'advanced'],
      cover_styles: ['realistic', 'artistic', 'fantasy', 'minimalist', 'vintage'],
      priority_support: true,
      early_access: true,
      creator_tools: true,
      analytics_dashboard: true,
      credit_reversion: false // Premium users keep all unused credits
    },
    stripe_price_id_monthly: process.env['STRIPE_PREMIUM_MONTHLY_PRICE_ID'] || 'price_premium_monthly',
    stripe_price_id_yearly: process.env['STRIPE_PREMIUM_YEARLY_PRICE_ID'] || 'price_premium_yearly'
  }
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

export const AI_OPERATION_COSTS = {
  foundation: {
    basic_complexity: 8,  // 8 credits ($0.008)
    medium_complexity: 12, // 12 credits ($0.012)
    high_complexity: 18   // 18 credits ($0.018)
  },
  character: {
    basic_complexity: 5,  // 5 credits ($0.005)
    medium_complexity: 8, // 8 credits ($0.008)
    high_complexity: 12   // 12 credits ($0.012)
  },
  chapter: {
    basic_complexity: 80,  // 80 credits ($0.08) per chapter generation
    medium_complexity: 80, // 80 credits ($0.08) per chapter generation
    high_complexity: 80    // 80 credits ($0.08) per chapter generation
  },
  reading: {
    per_book: 250  // 250 credits ($0.25) per book reading/unlock
  },
  improvement: {
    basic_complexity: 3,  // 3 credits ($0.003)
    medium_complexity: 6, // 6 credits ($0.006)
    high_complexity: 10   // 10 credits ($0.010)
  },
  cover: {
    basic_style: 8,   // 8 credits ($0.008)
    premium_style: 12 // 12 credits ($0.012)
  }
} as const

export const CREATOR_REVENUE_SHARE = 0.7 // 70% to creator
export const PLATFORM_REVENUE_SHARE = 0.3 // 30% to platform

export const MINIMUM_PAYOUT_USD = 25.00

// Monthly credit distribution logic
export function calculateProportionalCredits(
  userTier: SubscriptionTier,
  storiesReadThisMonth: number,
  _totalActiveUsers: number
): number {
  const baseCredits = SUBSCRIPTION_TIERS[userTier].credits_per_month

  // Distribute additional credits based on reading activity
  const activityBonus = Math.min(storiesReadThisMonth * 10, baseCredits * 0.2)

  return Math.floor(baseCredits + activityBonus)
}

export function getUserFeatures(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier].features
}

export function canUserAccessFeature(
  tier: SubscriptionTier,
  feature: keyof typeof SUBSCRIPTION_TIERS.basic.features
): boolean {
  return !!SUBSCRIPTION_TIERS[tier].features[feature]
}

export function getSubscriptionUpgradeMessage(currentTier: SubscriptionTier): string {
  if (currentTier === 'basic') {
    return 'Upgrade to Premium for unlimited stories, premium covers, and download access!'
  }
  return 'You have full Premium access to all features!'
}

// Subscription enforcement - no free access
export function requiresSubscription(): boolean {
  return true // All features require subscription
}