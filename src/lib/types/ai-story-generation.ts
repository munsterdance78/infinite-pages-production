/**
 * Story generation AI request and response types
 */

import type { AIModelUsage } from './ai-models'

export interface StoryGenerationRequest {
  type: 'foundation' | 'chapter' | 'character' | 'cover' | 'choice' | 'improvement'
  model: string
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  streaming?: boolean
  userId: string
  storyId?: string
  chapterId?: string
}

export interface StoryGenerationResponse {
  id: string
  content: string
  usage: AIModelUsage
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_use'
  model: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface FoundationRequest {
  title: string
  premise: string
  genre: string
  style?: string
  targetAudience?: string
  length?: 'short' | 'medium' | 'long'
}

export interface FoundationResponse {
  id: string
  title: string
  premise: string
  genre: string
  characters: Array<{
    name: string
    role: string
    description: string
  }>
  plotOutline: string[]
  themes: string[]
  setting: {
    time: string
    place: string
    atmosphere: string
  }
  estimatedLength: number
  keyEvents: string[]
}