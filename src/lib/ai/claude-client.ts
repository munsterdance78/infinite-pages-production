import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/types/environment'

/**
 * Anthropic Claude client
 * Uses exact environment variables from Vercel
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY
})

/**
 * Claude model configuration
 */
export const claudeConfig = {
  model: 'claude-3-sonnet-20240229',
  maxTokens: 4000,
  temperature: 0.7
} as const

/**
 * Pricing configuration for cost calculation
 */
export const claudePricing = {
  inputTokenCost: 0.000003,  // $0.000003 per input token
  outputTokenCost: 0.000015 // $0.000015 per output token
} as const

/**
 * Calculate Claude API cost
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * claudePricing.inputTokenCost) + (outputTokens * claudePricing.outputTokenCost)
}

/**
 * Convert cost to credits (1 credit = $0.001)
 */
export function convertCostToCredits(costUSD: number): number {
  return Math.ceil(costUSD * 1000)
}

/**
 * Create Claude message with cost tracking
 */
export async function createMessage({
  messages,
  model = claudeConfig.model,
  maxTokens = claudeConfig.maxTokens,
  temperature = claudeConfig.temperature,
  system
}: {
  messages: Anthropic.MessageParam[]
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
}) {
  const startTime = Date.now()

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
      ...(system && { system })
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Calculate costs
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const cost = calculateCost(inputTokens, outputTokens)
    const credits = convertCostToCredits(cost)

    return {
      response,
      usage: {
        inputTokens,
        outputTokens,
        cost,
        credits,
        duration
      }
    }
  } catch (error) {
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Stream Claude response with cost tracking
 */
export async function streamMessage({
  messages,
  model = claudeConfig.model,
  maxTokens = claudeConfig.maxTokens,
  temperature = claudeConfig.temperature,
  system,
  onChunk
}: {
  messages: Anthropic.MessageParam[]
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
  onChunk?: (chunk: string) => void
}) {
  const startTime = Date.now()

  try {
    const stream = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
      ...(system && { system }),
      stream: true
    })

    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = (chunk.delta as { type: 'text_delta'; text: string }).text
        fullContent += text
        onChunk?.(text)
      } else if (chunk.type === 'message_start') {
        inputTokens = chunk.message.usage.input_tokens
      } else if (chunk.type === 'message_delta') {
        outputTokens = chunk.usage.output_tokens
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    const cost = calculateCost(inputTokens, outputTokens)
    const credits = convertCostToCredits(cost)

    return {
      content: fullContent,
      usage: {
        inputTokens,
        outputTokens,
        cost,
        credits,
        duration
      }
    }
  } catch (error) {
    throw new Error(`Claude streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}