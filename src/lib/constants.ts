// UNIFIED CREDIT SYSTEM
// 50% markup applied at subscription purchase time only
// Users spend credits at actual AI cost (no additional markup)

export const CREDIT_SYSTEM = {
  // Convert actual AI cost (USD) to credits for deduction
  convertCostToCredits(actualCostUSD: number): number {
    // 1 credit = $0.001 (credits are pre-purchased with 50% markup)
    return Math.ceil(actualCostUSD * 1000)
  },

  // Calculate subscription credit allocation (with 50% markup built-in)
  calculateSubscriptionCredits(subscriptionPriceUSD: number): number {
    // Remove platform overhead (30%), apply to AI costs
    const aiCostAllocation = subscriptionPriceUSD * 0.7
    // Convert to credits (each credit = $0.001)
    return Math.floor(aiCostAllocation * 1000)
  }
} as const

// Legacy costs for UI estimation only (will be replaced by actual AI costs)
export const ESTIMATED_CREDIT_COSTS = {
  STORY_FOUNDATION: 24,  // ~$0.024 actual AI cost = 24 credits
  CHAPTER_GENERATION: 15, // ~$0.015 actual AI cost = 15 credits
  CHAPTER_IMPROVEMENT: 8, // ~$0.008 actual AI cost = 8 credits
  CONTENT_ANALYSIS: 5,    // ~$0.005 actual AI cost = 5 credits
  FACT_EXTRACTION: 12,    // ~$0.012 actual AI cost = 12 credits
  STORY_ANALYSIS: 8       // ~$0.008 actual AI cost = 8 credits
} as const

// STANDARDIZED SUBSCRIPTION SYSTEM
export const SUBSCRIPTION_LIMITS = {
  basic: {
    MONTHLY_CREDITS: 5000,  // 5,000 credits per month
    MAX_CREDIT_BALANCE: 15000, // 3-month accumulation maximum (5,000 * 3)
    MONTHLY_STORIES: 5,
    MONTHLY_CHAPTERS: 50,
    EXPORTS_ALLOWED: false,
    IMPROVEMENTS_ALLOWED: true,
    PRIORITY_SUPPORT: false,
    CREDIT_REVERSION: true  // Excess credits revert to site
  },
  premium: {
    MONTHLY_CREDITS: 10000,  // 10,000 credits per month
    MAX_CREDIT_BALANCE: null, // Unlimited accumulation
    MONTHLY_STORIES: 999999, // Unlimited
    MONTHLY_CHAPTERS: 999999, // Unlimited
    EXPORTS_ALLOWED: true,
    IMPROVEMENTS_ALLOWED: true,
    PRIORITY_SUPPORT: true,
    CREDIT_REVERSION: false // Premium users keep all credits
  }
} as const

// Claude API pricing (per token)
export const CLAUDE_PRICING = {
  INPUT_TOKEN_COST: 0.000003,  // $0.000003 per input token
  OUTPUT_TOKEN_COST: 0.000015, // $0.000015 per output token
  MODEL: 'claude-sonnet-4-20250514'
} as const

// Available Claude models
export const CLAUDE_MODELS = {
  SONNET: 'claude-sonnet-4-20250514',
  OPUS: 'claude-3-opus-20240229',
  HAIKU: 'claude-3-haiku-20240307'
} as const

// Content limits
export const CONTENT_LIMITS = {
  STORY_TITLE_MAX_LENGTH: 200,
  PREMISE_MIN_LENGTH: 10,
  PREMISE_MAX_LENGTH: 2000,
  GENRE_MAX_LENGTH: 50,
  CHAPTER_TITLE_MAX_LENGTH: 100,
  IMPROVEMENT_FEEDBACK_MAX_LENGTH: 1000,
  MAX_CONTENT_LENGTH: 50000,
  MAX_PROMPT_LENGTH: 100000
} as const

// Allowed genres
export const ALLOWED_GENRES = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Horror',
  'Literary Fiction',
  'Historical Fiction',
  'Young Adult',
  'Adventure',
  'Contemporary',
  'Dystopian',
  'Comedy',
  'Drama'
] as const

// Export formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EPUB: 'epub',
  DOCX: 'docx',
  TXT: 'txt'
} as const

// Rate limiting
export const RATE_LIMITS = {
  STORY_CREATION_PER_MINUTE: 2,
  CHAPTER_GENERATION_PER_MINUTE: 5,
  API_REQUESTS_PER_MINUTE: 30,
  EXPORT_REQUESTS_PER_HOUR: 10
} as const

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  STORIES: 'stories',
  CHAPTERS: 'chapters',
  GENERATION_LOGS: 'generation_logs',
  EXPORTS: 'exports'
} as const

// Story statuses
export const STORY_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PUBLISHED: 'published'
} as const

// Generation operation types
export const GENERATION_TYPES = {
  FOUNDATION: 'foundation',
  CHAPTER: 'chapter',
  IMPROVEMENT: 'improvement'
} as const

// Subscription tiers - use lib/subscription-config.ts instead
// This is deprecated - kept for backward compatibility only

// Analytics time ranges
export const ANALYTICS_TIME_RANGES = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365
} as const

// Efficiency benchmarks
export const EFFICIENCY_BENCHMARKS = {
  EXCELLENT_THRESHOLD: 400, // words per token
  GOOD_THRESHOLD: 250,
  POOR_THRESHOLD: 150
} as const

// Content moderation patterns
export const MODERATION_PATTERNS = [
  { pattern: /\b(explicit sexual|graphic sex|sexual violence)\b/gi, reason: 'explicit sexual content' },
  { pattern: /\b(graphic violence|gore|torture|dismemberment)\b/gi, reason: 'graphic violence' },
  { pattern: /\b(illegal drugs|drug dealing|terrorism|bomb making)\b/gi, reason: 'illegal activities' },
  { pattern: /\b(suicide methods|self-harm|cutting)\b/gi, reason: 'self-harm content' },
  { pattern: /\b(hate speech|racial slurs|nazi|white supremacy)\b/gi, reason: 'hate speech' },
  { pattern: /<script[^>]*>|javascript:|on\w+=/gi, reason: 'potential script injection' }
] as const

// Prompt injection detection patterns
export const INJECTION_PATTERNS = [
  /ignore previous instructions/gi,
  /forget everything above/gi,
  /new instructions:/gi,
  /system prompt/gi,
  /jailbreak/gi
] as const

// Default token grants
export const TOKEN_GRANTS = {
  NEW_USER_BONUS: 10,
  MONTHLY_FREE: 10,
  MONTHLY_PRO: 100
} as const

// File size limits
export const FILE_LIMITS = {
  MAX_EXPORT_SIZE_MB: 10,
  MAX_UPLOAD_SIZE_MB: 5
} as const

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  USER_PROFILE: 300,      // 5 minutes
  STORY_LIST: 180,        // 3 minutes
  ANALYTICS_DATA: 600,    // 10 minutes
  EXPORT_FILE: 3600       // 1 hour
} as const

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  INSUFFICIENT_TOKENS: 'Insufficient tokens for this operation',
  MONTHLY_LIMIT_REACHED: 'Monthly limit reached for your subscription tier',
  INVALID_INPUT: 'Invalid input provided',
  CONTENT_VIOLATION: 'Content violates our community guidelines',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  SUBSCRIPTION_REQUIRED: 'This feature requires a Pro subscription'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  STORY_CREATED: 'Story foundation created successfully',
  CHAPTER_GENERATED: 'Chapter generated successfully',
  CHAPTER_IMPROVED: 'Chapter improved successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully'
} as const

// Helper functions for type safety
// Use SubscriptionTier from lib/subscription-config.ts instead
export type StoryStatus = typeof STORY_STATUS[keyof typeof STORY_STATUS];
export type GenerationType = typeof GENERATION_TYPES[keyof typeof GENERATION_TYPES];
export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// Utility function to get subscription limits
// Unified subscription limits function
export function getSubscriptionLimits(tier: 'basic' | 'premium') {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.basic
}

// Utility function to calculate Claude API cost
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * CLAUDE_PRICING.INPUT_TOKEN_COST) + (outputTokens * CLAUDE_PRICING.OUTPUT_TOKEN_COST)
}

// Utility function to check if operation is allowed for subscription
export function isOperationAllowed(tier: 'basic' | 'premium', operation: string): boolean {
  const limits = getSubscriptionLimits(tier)
  
  switch (operation) {
    case 'export':
      return limits.EXPORTS_ALLOWED
    case 'improvement':
      return limits.IMPROVEMENTS_ALLOWED
    case 'priority_support':
      return limits.PRIORITY_SUPPORT
    default:
      return true
  }
}

// Utility function to get efficiency rating
export function getEfficiencyRating(wordsPerToken: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (wordsPerToken >= EFFICIENCY_BENCHMARKS.EXCELLENT_THRESHOLD) return 'excellent'
  if (wordsPerToken >= EFFICIENCY_BENCHMARKS.GOOD_THRESHOLD) return 'good'
  if (wordsPerToken >= EFFICIENCY_BENCHMARKS.POOR_THRESHOLD) return 'fair'
  return 'poor'
}

// Environment-specific constants
export const ENV_CONFIG = {
  DEVELOPMENT: {
    LOG_LEVEL: 'debug',
    ENABLE_DETAILED_ERRORS: true,
    MOCK_AI_RESPONSES: false
  },
  PRODUCTION: {
    LOG_LEVEL: 'error',
    ENABLE_DETAILED_ERRORS: false,
    MOCK_AI_RESPONSES: false
  }
} as const