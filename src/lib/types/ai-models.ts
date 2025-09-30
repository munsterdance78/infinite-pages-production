/**
 * AI model configuration and usage types
 */

export interface AIModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai' | 'google' | 'mistral'
  maxTokens: number
  costPerInputToken: number
  costPerOutputToken: number
  supportsStreaming: boolean
  supportsToolUse: boolean
  contextWindow: number
}

export interface AIModelUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
}

export interface StreamingChunk {
  id: string
  content: string
  delta?: string
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export interface StreamingResponse {
  id: string
  chunks: StreamingChunk[]
  usage: AIModelUsage
}