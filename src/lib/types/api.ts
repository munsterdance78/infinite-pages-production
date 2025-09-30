/**
 * Comprehensive API request/response type definitions
 */

import type { Database } from '@/lib/supabase/types'

// Base API response structure
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

// Paginated response structure
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Story-related API types
export interface StoryCreationRequest {
  title: string
  genre: string
  premise: string
  type: 'story' | 'novel' | 'choice-book' | 'ai-builder'
  description?: string
  tone?: string
  characters?: string
  setting?: string
  target_length?: number
  choice_complexity?: 'simple' | 'moderate' | 'complex'
  target_ending_count?: number
  estimated_length?: number
  main_themes?: string[]
  target_audience?: string
}

export interface StoryResponse {
  id: string
  title: string
  genre: string
  premise: string
  type: string
  status: string
  created_at: string
  updated_at: string
  total_tokens?: number
  cost_usd?: number
  chapters?: ChapterData[]
  content?: string
}

export interface ChapterData {
  id: string
  story_id: string
  chapter_number: number
  title: string
  content: string
  tokens_used: number
  cost_usd: number
  created_at: string
}

// AI Usage API types
export interface AIUsageRequest {
  operation_type: 'foundation' | 'character' | 'cover' | 'chapter' | 'improvement'
  tokens_input: number
  tokens_output: number
  ai_model_used: string
  story_id?: string
  chapter_id?: string
  generation_time_seconds: number
}

export interface AIUsageResponse {
  id: string
  user_id: string
  operation_type: string
  tokens_input: number
  tokens_output: number
  ai_model_used: string
  cost_usd: number
  created_at: string
}

export interface AIUsageStats {
  totalTokensUsed: number
  totalCostUSD: number
  operationBreakdown: OperationBreakdown[]
  modelBreakdown: ModelBreakdown[]
  dailyUsage: DailyUsage[]
  monthlySavings: number
  efficiency: number
}

export interface OperationBreakdown {
  operation_type: string
  total_tokens: number
  total_cost: number
  operation_count: number
}

export interface ModelBreakdown {
  ai_model_used: string
  total_tokens: number
  total_cost: number
  usage_count: number
}

export interface DailyUsage {
  date: string
  tokens_used: number
  cost_usd: number
  operations_count: number
}

// Analytics API types
export interface AnalyticsRequest {
  period?: 'current_month' | 'last_month' | 'last_3_months' | 'all_time'
  user_id?: string
}

export interface UserAnalytics {
  totalStories: number
  totalChapters: number
  totalWords: number
  totalTokensUsed: number
  totalCostUSD: number
  averageWordsPerStory: number
  efficiency: number
  daysActive: number
}

export interface CacheAnalytics {
  totalTokensSaved: number
  cacheHitRateByType: Record<string, number>
  topGenres: Array<{ genre: string; efficiency: number }>
  foundationReuseRate: number
  costSavingsThisMonth: number
  avgChaptersPerFoundation: number
  mostReusedFoundations: Array<{ title: string; reuse_count: number }>
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRatePercentage: number
  avgTokensSavedPerHit: number
  totalCostSavings: number
}

// Creator earnings API types
export interface CreatorEarningsRequest {
  period?: string
  view?: 'basic' | 'enhanced' | 'unified'
}

export interface CreatorEarningsResponse {
  earnings: {
    totalEarnings: number
    monthlyEarnings: number
    pendingPayout: number
    lifetimeEarnings: number
  }
  stories: {
    totalStories: number
    publishedStories: number
    storiesWithEarnings: number
    averageEarningsPerStory: number
  }
  performance: {
    weeklyGrowth: number
    monthlyGrowth: number
    costEfficiency: number
    userEngagement: number
  }
  payoutHistory: PayoutRecord[]
  topStories: TopStoryEarning[]
}

export interface PayoutRecord {
  id: string
  amount_usd: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  processed_at?: string
  stripe_transfer_id?: string
}

export interface TopStoryEarning {
  story_id: string
  title: string
  earnings_usd: number
  views: number
  created_at: string
}

// Credits/Billing API types
export interface CreditPurchaseRequest {
  package_id: string
  payment_method?: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price_usd: number
  bonus_credits?: number
  popular?: boolean
}

export interface SubscriptionRequest {
  tier: 'free' | 'basic' | 'premium' | 'pro'
  billing_period?: 'monthly' | 'yearly'
}

// Stripe/Payment API types
export interface StripeSessionRequest {
  success_url: string
  cancel_url: string
  mode: 'payment' | 'subscription'
  line_items: Array<{
    price: string
    quantity: number
  }>
}

export interface StripeConnectRequest {
  account_type: 'express' | 'standard'
  business_type?: 'individual' | 'company'
  return_url: string
  refresh_url: string
}

// Admin API types
export interface AdminDistributeCreditsRequest {
  user_ids: string[]
  credits_amount: number
  reason?: string
}

export interface AdminProcessPayoutsRequest {
  payout_batch_id?: string
  minimum_amount?: number
  dry_run?: boolean
}

export interface AdminAnalyticsResponse {
  users: {
    total: number
    active: number
    creators: number
    premium: number
  }
  content: {
    totalStories: number
    totalChapters: number
    totalWords: number
  }
  financial: {
    totalRevenue: number
    totalPayouts: number
    pendingPayouts: number
  }
  ai: {
    totalTokensUsed: number
    totalCost: number
    cacheEfficiency: number
  }
}

// Error response types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiError {
  error: string
  message: string
  details?: ValidationError[]
  code?: string
  status: number
}

// Request context types
export interface AuthenticatedRequest {
  user: Database['public']['Tables']['profiles']['Row']
  supabase: import('@supabase/supabase-js').SupabaseClient<Database> // Supabase client
}

export interface RequestContext {
  user?: Database['public']['Tables']['profiles']['Row']
  supabase: import('@supabase/supabase-js').SupabaseClient<Database>
  isAuthenticated: boolean
  isAdmin: boolean
  isCreator: boolean
}

// Type guards for runtime validation
export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && 'success' in obj
}

export function isApiError(obj: unknown): obj is ApiError {
  return typeof obj === 'object' && obj !== null && 'error' in obj && 'status' in obj
}

export function isValidationError(obj: unknown): obj is ValidationError {
  return typeof obj === 'object' && obj !== null &&
         'field' in obj && 'message' in obj && 'code' in obj
}

// Utility types for API routes
export type NextApiHandler<_T = unknown> = (
  req: Request,
  context?: { params?: Record<string, string> }
) => Promise<Response>

export type AuthenticatedApiHandler<T = unknown> = (
  req: Request,
  context: RequestContext
) => Promise<ApiResponse<T>>