// Export all Claude services and utilities (server-side safe)
export { ClaudeService, claudeService } from './service'
export { ClaudeStreamingService, claudeStreamingService } from './streaming'
export { ClaudeCache, claudeCache } from './cache'
export { ClaudeBatchProcessor, batchProcessor } from './batch'
export { ClaudeAnalyticsService, analyticsService } from './analytics'
export { PromptTemplateManager, promptTemplateManager } from './prompts'

// Client-side hooks (import separately in client components)
// export { useClaudeStreaming, useClaude } from './hooks'

// Export types
export type { StreamResponse } from './streaming'
export type { CacheEntry, CacheOptions } from './cache'
export type { BatchOperation, BatchResult, BatchProcessingOptions } from './batch'
export type { ClaudeAnalytics, AnalyticsEvent } from './analytics'
export type { PromptTemplate, PromptVariable } from './prompts'

// Re-export commonly used constants
export { 
  CLAUDE_PRICING, 
  CLAUDE_MODELS,
  calculateCost 
} from '@/lib/constants'
