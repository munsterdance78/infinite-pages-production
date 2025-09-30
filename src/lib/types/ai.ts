/**
 * AI service types - Main entry point for all AI-related types
 */

// Re-export model types
export type {
  AIModel,
  AIModelUsage,
  StreamingChunk,
  StreamingResponse
} from './ai-models'

// Re-export story generation types
export type {
  StoryGenerationRequest,
  StoryGenerationResponse,
  FoundationRequest,
  FoundationResponse
} from './ai-story-generation'

// Re-export character types
export type {
  Character,
  CharacterGenerationRequest,
  WorldBuilding
} from './ai-characters'

// Chapter and choice generation types (remaining in main file)
import type { StoryGenerationRequest, StoryGenerationResponse } from './ai-story-generation'
import type { StreamingChunk } from './ai-models'

export interface ChapterGenerationRequest extends StoryGenerationRequest {
  chapterNumber: number
  previousChapters?: string[]
  targetWordCount?: number
  plotPoints?: string[]
  characterFocus?: string[]
  setting?: string
  mood?: string
  cliffhanger?: boolean
}

export interface ChapterResponse {
  id: string
  title: string
  content: string
  wordCount: number
  estimatedReadingTime: number
  metadata: {
    characters: string[]
    setting: string
    mood: string
    plotAdvancement: string[]
  }
}

export interface ChoiceGenerationRequest extends StoryGenerationRequest {
  currentNarrative: string
  previousChoices?: Array<{
    choice: string
    consequence: string
  }>
}

export interface ChoiceNode {
  id: string
  text: string
  choices: Array<{
    id: string
    text: string
    consequence: string
    nextNodeId?: string
  }>
  metadata?: {
    mood: string
    characters: string[]
    consequences: string[]
  }
}

// Cover generation types
export interface CoverGenerationRequest {
  title: string
  genre: string
  mood: string
  style: 'realistic' | 'illustrated' | 'minimalist' | 'vintage'
  colorScheme?: string
  elements?: string[]
}

export interface CoverGenerationResponse {
  id: string
  imageUrl: string
  style: string
  metadata: {
    model: string
    prompt: string
    dimensions: string
    fileSize: number
  }
}

// Choice type for backward compatibility
export type Choice = ChoiceNode['choices'][number]

// Additional response types
export type CoverResponse = CoverGenerationResponse

export interface ImprovementRequest {
  content: string
  improvementType: 'grammar' | 'style' | 'clarity' | 'engagement' | 'pacing'
  targetAudience?: string
  preserveTone?: boolean
}

export interface ImprovementResponse {
  improvedContent: string
  changes: Array<{
    type: string
    original: string
    improved: string
    reason: string
  }>
  metadata: {
    improvementScore: number
    changesCount: number
  }
}

// Processing pipeline types
export interface ProcessingPipeline {
  id: string
  stages: ProcessingStage[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStage?: number
}

export interface ProcessingStage {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  error?: string
}

export interface RetryPolicy {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

// Validation types
export interface ValidationRule {
  name: string
  validator: (content: string) => boolean
  errorMessage: string
}

export interface ContentValidation {
  rules: ValidationRule[]
  strictMode?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

// Cache types
export interface CacheEntry {
  key: string
  value: unknown
  expiresAt: number
  metadata?: Record<string, unknown>
}

export interface CacheConfig {
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  size: number
}

// Story structure types
export interface PacingGuide {
  chapters: number
  wordsPerChapter: number
  plotBeats: string[]
  climaxPosition: number
}

export interface StyleGuide {
  tone: string
  vocabulary: 'simple' | 'standard' | 'advanced'
  sentenceVariety: boolean
  descriptiveness: number
}

export interface Conflict {
  type: 'internal' | 'external' | 'interpersonal'
  description: string
  characters: string[]
  resolution?: string
}

// Error types
export interface AIServiceError extends Error {
  code: string
  statusCode?: number
  retryable: boolean
  metadata?: Record<string, unknown>
}

// Configuration types
export type ModelProvider = 'anthropic' | 'openai' | 'custom'
export type GenerationType = 'story' | 'chapter' | 'character' | 'choice' | 'improvement' | 'cover'
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'error'

export interface AIServiceConfig {
  provider: ModelProvider
  model: string
  apiKey: string
  maxTokens: number
  temperature: number
  retryPolicy: RetryPolicy
  cacheConfig?: CacheConfig
}

// Type guard functions
export function isStoryGenerationResponse(value: unknown): value is StoryGenerationResponse {
  return typeof value === 'object' && value !== null && 'content' in value
}

export function isStreamingChunk(value: unknown): value is StreamingChunk {
  return typeof value === 'object' && value !== null && 'type' in value
}

export function isAIServiceError(value: unknown): value is AIServiceError {
  return value instanceof Error && 'code' in value && 'retryable' in value
}