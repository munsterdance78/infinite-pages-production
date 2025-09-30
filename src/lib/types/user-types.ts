/**
 * User profile and authentication related types
 */

import type { SubscriptionTier } from '@/lib/subscription-config'

// User profile types for components
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  subscription_tier: SubscriptionTier
  tokens_remaining: number
  tokens_used_total?: number
  tokens_saved_cache?: number
  stories_created?: number
  credits_balance?: number
  is_creator?: boolean
  is_admin?: boolean
  avatar_url?: string
  created_at?: string
  onboarding_complete?: boolean
}

// Unified user profile (combining different profile shapes)
export interface UnifiedUserProfile {
  id: string
  email: string
  full_name?: string
  subscription_tier: 'free' | 'basic' | 'premium' | 'pro'
  tokens_remaining: number
  tokens_used_total: number
  tokens_saved_cache?: number
  credits_balance?: number
  stories_created: number
  words_generated?: number
  is_creator?: boolean
  is_admin?: boolean
  avatar_url?: string
  current_period_end?: string
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
  next_billing_date?: string
}