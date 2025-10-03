/**
 * Centralized type exports for enhanced type safety
 */

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  StoryCreationRequest,
  StoryResponse,
  ChapterData,
  AIUsageRequest,
  AIUsageResponse,
  AIUsageStats,
  AnalyticsRequest,
  UserAnalytics,
  CacheAnalytics,
  CreatorEarningsRequest,
  CreatorEarningsResponse,
  PayoutRecord,
  TopStoryEarning,
  CreditPurchaseRequest,
  CreditPackage,
  SubscriptionRequest,
  ApiError,
  ValidationError,
  AuthenticatedRequest,
  RequestContext,
  NextApiHandler,
  AuthenticatedApiHandler
} from './api'

// Database types
export type {
  Database,
  Profile,
  Story,
  Chapter,
  // CreatorEarning, // Not available in current schema
  // AIUsageLog, // Not available in current schema
  // SubscriptionPlan, (commented out - not available)
  // ProfileInsert,
  // StoryInsert,
  // ChapterInsert,
  // CreatorEarningInsert,
  // AIUsageLogInsert,
  // ProfileUpdate,
  // StoryUpdate,
  // ChapterUpdate,
  // CreatorEarningUpdate,
  StoryWithChapters,
  // StoryWithEarnings, // Not available in current schema
  ProfileWithStats,
  ChapterWithStory,
  StoryFilters,
  ProfileFilters,
  EarningsFilters,
  PaginationOptions,
  SortOptions,
  QueryBuilder,
  StoryAggregates,
  UserAggregates,
  AIUsageAggregates,
  CachedStoryData,
  CachedUserStats,
  DatabaseTransaction,
  StoryListView,
  CreatorDashboardView,
  AdminAnalyticsView,
  StoryStatus,
  SubscriptionTier,
  PayoutStatus,
  AIOperationType,
  TypedSupabaseClient
} from './database'

// Component types
export type {
  BaseComponentProps,
  UserProfile,
  UnifiedUserProfile,
  StoryCardProps,
  StoryListProps,
  StoryCreatorProps,
  StoryFilters as ComponentStoryFilters,
  AnalyticsChartProps,
  MetricCardProps,
  DashboardTabProps,
  // SidebarItem,
  // SidebarProps,
  // FormFieldProps,
  FormProps,
  ModalProps,
  // ConfirmDialogProps,
  // TableColumn,
  // TableProps,
  // CreatorEarningsProps, // Not available in current schema
  // EarningsChartProps,
  // PayoutHistoryProps,
  // PremiumUpgradeProps,
  // ErrorBoundaryProps,
  // LoadingProps,
  // SkeletonProps,
  // NotificationProps,
  // SearchBarProps,
  // FilterPanelProps,
  // LayoutProps,
  // HeaderProps,
  // ComponentSize,
  // ComponentVariant,
  // ComponentState,
  // ClickHandler,
  // ChangeHandler,
  // SubmitHandler,
  KeyPressHandler
} from './components'

// AI types
export type {
  AIModel,
  AIModelUsage,
  StoryGenerationRequest,
  StoryGenerationResponse,
  StreamingChunk,
  StreamingResponse,
  FoundationRequest,
  FoundationResponse,
  Character,
  CharacterGenerationRequest,
  WorldBuilding,
  ChapterGenerationRequest,
  ChapterResponse,
  ChoiceGenerationRequest,
  ChoiceNode,
  Choice,
  CoverGenerationRequest,
  CoverResponse,
  ImprovementRequest,
  ImprovementResponse,
  ProcessingPipeline,
  ProcessingStage,
  RetryPolicy,
  ValidationRule,
  ContentValidation,
  ValidationResult,
  CacheEntry,
  CacheConfig,
  CacheMetrics,
  PacingGuide,
  StyleGuide,
  Conflict,
  AIServiceError,
  ModelProvider,
  GenerationType,
  FinishReason,
  AIServiceConfig
} from './ai'

// Type guards
export {
  isApiResponse,
  isApiError,
  isValidationError
  // isProfile, (not implemented)
  // isStory, (not implemented)
  // isChapter, (not implemented)
  // isCreatorEarning, (not implemented)
  // isStoryGenerationResponse, (not implemented)
  // isStreamingChunk, (not implemented)
  // isAIServiceError (not implemented)
} from './api'

export {
  isProfile as isDatabaseProfile,
  isStory as isDatabaseStory,
  isChapter as isDatabaseChapter,
  // isCreatorEarning as isDatabaseCreatorEarning // Not available in current schema
} from './database'

export {
  isStoryGenerationResponse as isAIStoryResponse,
  isStreamingChunk as isAIStreamingChunk,
  isAIServiceError as isAIError
} from './ai'

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybePromise<T> = T | Promise<T>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// Common enums
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  LOADING = 'loading',
  IDLE = 'idle'
}

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum ContentType {
  STORY = 'story',
  NOVEL = 'novel',
  CHOICE_BOOK = 'choice-book',
  AI_GENERATED = 'ai-generated'
}

// Common interfaces
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface TimestampedEntity extends BaseEntity {
  created_by?: string
  updated_by?: string
}

export interface SoftDeletableEntity extends TimestampedEntity {
  deleted_at?: string
  deleted_by?: string
  is_deleted?: boolean
}

// Error handling types
export interface ErrorInfo {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
  context?: {
    userId?: string
    requestId?: string
    path?: string
    method?: string
  }
}

export interface ValidationErrorInfo extends ErrorInfo {
  field: string
  value?: unknown
  constraint?: string
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  auth: {
    sessionTimeout: number
    tokenRefreshThreshold: number
  }
  features: {
    enableBetaFeatures: boolean
    enableAnalytics: boolean
    enableCaching: boolean
  }
  limits: {
    maxFileSize: number
    maxRequestSize: number
    rateLimits: Record<string, number>
  }
}

// Event types for application state management
export interface AppEvent {
  type: string
  payload?: Record<string, unknown>
  timestamp: string
  source: 'user' | 'system' | 'external'
}

export interface UserEvent extends AppEvent {
  userId: string
  sessionId?: string
}

export interface SystemEvent extends AppEvent {
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: 'performance' | 'security' | 'business' | 'technical'
}