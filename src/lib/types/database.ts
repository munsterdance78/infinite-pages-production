/**
 * Enhanced database schema types with type-safe query builders
 */

import type { Database } from '@/lib/supabase/types'

// Re-export base database types
export type { Database }

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
export type CreatorEarning = Database['public']['Tables']['creator_earnings']['Row']
export type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Row']
// export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']

// Insert types for new records (commented out - not available in current schema)
// export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
// export type StoryInsert = Database['public']['Tables']['stories']['Insert']
// export type ChapterInsert = Database['public']['Tables']['chapters']['Insert']
// export type CreatorEarningInsert = Database['public']['Tables']['creator_earnings']['Insert']
// export type AIUsageLogInsert = Database['public']['Tables']['ai_usage_logs']['Insert']

// Update types for existing records (commented out - not available in current schema)
// export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
// export type StoryUpdate = Database['public']['Tables']['stories']['Update']
// export type ChapterUpdate = Database['public']['Tables']['chapters']['Update']
// export type CreatorEarningUpdate = Database['public']['Tables']['creator_earnings']['Update']

// Enhanced types with relationships
export interface StoryWithChapters extends Story {
  chapters: Chapter[]
  chapter_count: number
  total_words: number
}

export interface StoryWithEarnings extends Story {
  earnings: CreatorEarning[]
  total_earnings: number
  views: number
}

export interface ProfileWithStats extends Profile {
  story_count: number
  total_earnings: number
  total_words_written: number
  avg_story_rating: number
}

export interface ChapterWithStory extends Chapter {
  story: Pick<Story, 'id' | 'title' | 'genre' | 'user_id'>
}

// Query filter types
export interface StoryFilters {
  user_id?: string
  genre?: string
  status?: string
  published?: boolean
  created_after?: string
  created_before?: string
  min_words?: number
  max_words?: number
  search_term?: string
}

export interface ProfileFilters {
  subscription_tier?: string
  is_creator?: boolean
  is_admin?: boolean
  created_after?: string
  has_stories?: boolean
  min_earnings?: number
}

export interface EarningsFilters {
  user_id?: string
  story_id?: string
  period_start?: string
  period_end?: string
  min_amount?: number
  status?: string
}

// Pagination types
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface SortOptions {
  column: string
  direction: 'asc' | 'desc'
}

// Type-safe query builder interfaces
export interface QueryBuilder<T> {
  select(columns?: string): QueryBuilder<T>
  where(filters: Partial<T>): QueryBuilder<T>
  order(column: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>
  limit(count: number): QueryBuilder<T>
  offset(count: number): QueryBuilder<T>
  single(): Promise<T | null>
  many(): Promise<T[]>
  count(): Promise<number>
}

// Aggregation types
export interface StoryAggregates {
  total_stories: number
  total_words: number
  avg_words_per_story: number
  total_earnings: number
  total_views: number
  genres: Record<string, number>
  statuses: Record<string, number>
}

export interface UserAggregates {
  total_users: number
  active_users: number
  premium_users: number
  creator_users: number
  total_earnings_paid: number
  avg_stories_per_user: number
}

export interface AIUsageAggregates {
  total_tokens_used: number
  total_cost_usd: number
  total_operations: number
  avg_tokens_per_operation: number
  operations_by_type: Record<string, number>
  models_used: Record<string, number>
}

// Cache types for frequent queries
export interface CachedStoryData {
  story: Story
  chapters: Chapter[]
  earnings: CreatorEarning[]
  cache_timestamp: string
  cache_expiry: string
}

export interface CachedUserStats {
  user_id: string
  stats: {
    total_stories: number
    total_earnings: number
    total_words: number
    last_activity: string
  }
  cache_timestamp: string
}

// Transaction types
export interface DatabaseTransaction {
  commit(): Promise<void>
  rollback(): Promise<void>
  insert<T>(table: string, data: Partial<T>): Promise<T>
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>
  delete(table: string, id: string): Promise<void>
}

// View types for complex queries
export interface StoryListView {
  id: string
  title: string
  genre: string
  status: string
  user_id: string
  author_name: string
  chapter_count: number
  total_words: number
  total_earnings: number
  views: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CreatorDashboardView {
  user_id: string
  user_name: string
  total_stories: number
  published_stories: number
  total_earnings: number
  pending_payout: number
  total_views: number
  avg_rating: number
  last_story_published: string
  account_status: string
}

export interface AdminAnalyticsView {
  period: string
  total_users: number
  new_users: number
  active_users: number
  total_stories: number
  new_stories: number
  total_revenue: number
  total_payouts: number
  ai_cost: number
  cache_savings: number
}

// Enum types for database constraints
export enum StoryStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  PRO = 'pro'
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum AIOperationType {
  FOUNDATION = 'foundation',
  CHARACTER = 'character',
  COVER = 'cover',
  CHAPTER = 'chapter',
  IMPROVEMENT = 'improvement'
}

// Type guards for database objects
export function isProfile(obj: unknown): obj is Profile {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'email' in obj && 'subscription_tier' in obj
}

export function isStory(obj: unknown): obj is Story {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'title' in obj && 'user_id' in obj
}

export function isChapter(obj: unknown): obj is Chapter {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'story_id' in obj && 'chapter_number' in obj
}

export function isCreatorEarning(obj: unknown): obj is CreatorEarning {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'user_id' in obj && 'amount_usd' in obj
}

// Utility types for database operations
export type DatabaseInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T] extends { Insert: infer I } ? I : never

export type DatabaseUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T] extends { Update: infer U } ? U : never

export type DatabaseRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Type-safe database client interface
export interface TypedSupabaseClient {
  from<T extends keyof Database['public']['Tables']>(
    table: T
  ): {
    select<K extends string = '*'>(columns?: K): QueryBuilder<DatabaseRow<T>>
    insert(data: DatabaseInsert<T> | DatabaseInsert<T>[]): QueryBuilder<DatabaseRow<T>>
    update(data: DatabaseUpdate<T>): QueryBuilder<DatabaseRow<T>>
    delete(): QueryBuilder<DatabaseRow<T>>
    upsert(data: DatabaseInsert<T> | DatabaseInsert<T>[]): QueryBuilder<DatabaseRow<T>>
  }
}

// Migration and schema versioning types
export interface SchemaVersion {
  version: string
  applied_at: string
  description: string
  migration_file: string
}

export interface DatabaseMigration {
  version: string
  up(): Promise<void>
  down(): Promise<void>
  description: string
}

// Performance monitoring types
export interface QueryPerformance {
  query: string
  execution_time_ms: number
  rows_affected: number
  timestamp: string
  user_id?: string
}

export interface DatabaseMetrics {
  total_queries: number
  avg_query_time: number
  slow_queries: QueryPerformance[]
  table_sizes: Record<string, number>
  index_usage: Record<string, number>
}