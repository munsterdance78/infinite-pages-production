/**
 * REAL-TIME PRICING SYSTEM
 *
 * Provides real-time cost calculation for AI operations with accurate token counting,
 * subscription-based credit management, and transparent pricing display.
 *
 * Key Features:
 * - Real-time Claude API cost calculation
 * - Credit system with unified pricing
 * - Subscription tier limits and benefits
 * - Cost estimation for different story modes
 * - Real-time balance tracking
 */

import {
  CLAUDE_PRICING,
  CREDIT_SYSTEM,
  SUBSCRIPTION_LIMITS,
  ESTIMATED_CREDIT_COSTS
} from '@/lib/utils/constants'

// Types for pricing calculations
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCostUSD: number
  creditsRequired: number
  userBalance: number
  hasInsufficientCredits: boolean
}

export interface OperationEstimate {
  operation: string
  estimatedTokens: TokenUsage
  estimatedCost: CostBreakdown
  confidence: 'low' | 'medium' | 'high'
}

export interface SubscriptionPricing {
  tier: 'basic' | 'premium'
  monthlyCredits: number
  maxBalance: number | null
  priceUSD: number
  creditsPerDollar: number
  effectiveRate: number // actual cost per credit considering markup
}

/**
 * Core Cost Calculator Class
 */
export class CostCalculator {
  private currentBalance: number = 0
  private subscriptionTier: 'basic' | 'premium' = 'basic'

  constructor(userBalance: number = 0, tier: 'basic' | 'premium' = 'basic') {
    this.currentBalance = userBalance
    this.subscriptionTier = tier
  }

  /**
   * Calculate exact cost from actual token usage
   */
  calculateActualCost(usage: TokenUsage): CostBreakdown {
    const inputCost = usage.inputTokens * CLAUDE_PRICING.INPUT_TOKEN_COST
    const outputCost = usage.outputTokens * CLAUDE_PRICING.OUTPUT_TOKEN_COST
    const totalCostUSD = inputCost + outputCost
    const creditsRequired = CREDIT_SYSTEM.convertCostToCredits(totalCostUSD)

    return {
      inputCost,
      outputCost,
      totalCostUSD,
      creditsRequired,
      userBalance: this.currentBalance,
      hasInsufficientCredits: this.currentBalance < creditsRequired
    }
  }

  /**
   * Estimate costs for different story creation operations
   */
  estimateOperationCost(operation: keyof typeof ESTIMATED_CREDIT_COSTS): OperationEstimate {
    const creditCost = ESTIMATED_CREDIT_COSTS[operation]
    const estimatedUSD = creditCost * 0.001 // Convert credits back to USD estimate

    // Reverse engineer token estimates (these are approximations)
    const estimatedInputTokens = Math.floor(estimatedUSD / CLAUDE_PRICING.INPUT_TOKEN_COST * 0.7) // 70% input
    const estimatedOutputTokens = Math.floor(estimatedUSD / CLAUDE_PRICING.OUTPUT_TOKEN_COST * 0.3) // 30% output

    const tokenUsage: TokenUsage = {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens
    }

    return {
      operation,
      estimatedTokens: tokenUsage,
      estimatedCost: {
        inputCost: estimatedInputTokens * CLAUDE_PRICING.INPUT_TOKEN_COST,
        outputCost: estimatedOutputTokens * CLAUDE_PRICING.OUTPUT_TOKEN_COST,
        totalCostUSD: estimatedUSD,
        creditsRequired: creditCost,
        userBalance: this.currentBalance,
        hasInsufficientCredits: this.currentBalance < creditCost
      },
      confidence: 'medium' as const
    }
  }

  /**
   * Calculate multi-step operation costs (like full story creation)
   */
  estimateMultiStepCost(operations: (keyof typeof ESTIMATED_CREDIT_COSTS)[]): OperationEstimate {
    const totalCredits = operations.reduce((sum, op) => sum + ESTIMATED_CREDIT_COSTS[op], 0)
    const totalUSD = totalCredits * 0.001

    const combinedTokens: TokenUsage = {
      inputTokens: Math.floor(totalUSD / CLAUDE_PRICING.INPUT_TOKEN_COST * 0.7),
      outputTokens: Math.floor(totalUSD / CLAUDE_PRICING.OUTPUT_TOKEN_COST * 0.3),
      totalTokens: 0
    }
    combinedTokens.totalTokens = combinedTokens.inputTokens + combinedTokens.outputTokens

    return {
      operation: `Multi-step: ${operations.join(', ')}`,
      estimatedTokens: combinedTokens,
      estimatedCost: {
        inputCost: combinedTokens.inputTokens * CLAUDE_PRICING.INPUT_TOKEN_COST,
        outputCost: combinedTokens.outputTokens * CLAUDE_PRICING.OUTPUT_TOKEN_COST,
        totalCostUSD: totalUSD,
        creditsRequired: totalCredits,
        userBalance: this.currentBalance,
        hasInsufficientCredits: this.currentBalance < totalCredits
      },
      confidence: 'high' as const
    }
  }

  /**
   * Get subscription pricing information
   */
  getSubscriptionPricing(tier: 'basic' | 'premium'): SubscriptionPricing {
    const limits = SUBSCRIPTION_LIMITS[tier]
    const pricing = {
      basic: { price: 7.99, credits: limits.MONTHLY_CREDITS },
      premium: { price: 14.99, credits: limits.MONTHLY_CREDITS }
    }

    const tierPricing = pricing[tier]
    const creditsPerDollar = tierPricing.credits / tierPricing.price
    const effectiveRate = tierPricing.price / tierPricing.credits // Cost per credit with markup

    return {
      tier,
      monthlyCredits: tierPricing.credits,
      maxBalance: limits.MAX_CREDIT_BALANCE,
      priceUSD: tierPricing.price,
      creditsPerDollar,
      effectiveRate
    }
  }

  /**
   * Calculate how many credits a user gets for a subscription purchase
   */
  calculateSubscriptionCredits(tier: 'basic' | 'premium'): number {
    const pricing = this.getSubscriptionPricing(tier)
    return CREDIT_SYSTEM.calculateSubscriptionCredits(pricing.priceUSD)
  }

  /**
   * Check if user can afford an operation
   */
  canAffordOperation(operation: keyof typeof ESTIMATED_CREDIT_COSTS): boolean {
    const creditCost = ESTIMATED_CREDIT_COSTS[operation]
    return this.currentBalance >= creditCost
  }

  /**
   * Deduct credits for completed operation
   */
  deductCredits(actualCost: CostBreakdown): number {
    this.currentBalance = Math.max(0, this.currentBalance - actualCost.creditsRequired)
    return this.currentBalance
  }

  /**
   * Add credits (from subscription or purchase)
   */
  addCredits(credits: number): number {
    const limits = SUBSCRIPTION_LIMITS[this.subscriptionTier]

    if (limits.MAX_CREDIT_BALANCE && this.subscriptionTier === 'basic') {
      // Basic tier has balance limits
      this.currentBalance = Math.min(limits.MAX_CREDIT_BALANCE, this.currentBalance + credits)
    } else {
      // Premium tier has unlimited accumulation
      this.currentBalance += credits
    }

    return this.currentBalance
  }

  /**
   * Get current pricing context for UI display
   */
  getPricingContext() {
    const subscriptionInfo = this.getSubscriptionPricing(this.subscriptionTier)

    return {
      currentBalance: this.currentBalance,
      subscriptionTier: this.subscriptionTier,
      subscription: subscriptionInfo,
      model: CLAUDE_PRICING.MODEL,
      rates: {
        inputTokenCost: CLAUDE_PRICING.INPUT_TOKEN_COST,
        outputTokenCost: CLAUDE_PRICING.OUTPUT_TOKEN_COST,
        creditValue: 0.001 // 1 credit = $0.001
      }
    }
  }

  /**
   * Format cost for user display
   */
  formatCost(cost: CostBreakdown): string {
    return `${cost.creditsRequired} credits (~$${cost.totalCostUSD.toFixed(4)})`
  }

  /**
   * Get efficiency metrics
   */
  calculateEfficiency(actualTokens: TokenUsage, outputWords: number) {
    const wordsPerToken = outputWords / actualTokens.outputTokens
    const costPerWord = (actualTokens.outputTokens * CLAUDE_PRICING.OUTPUT_TOKEN_COST) / outputWords

    return {
      wordsPerToken: Math.round(wordsPerToken * 100) / 100,
      costPerWord: Math.round(costPerWord * 10000) / 10000, // 4 decimal places
      efficiency: wordsPerToken >= 4 ? 'excellent' :
                  wordsPerToken >= 2.5 ? 'good' :
                  wordsPerToken >= 1.5 ? 'fair' : 'poor'
    }
  }
}

/**
 * Utility functions for common pricing operations
 */

/**
 * Quick cost estimate for story creation modes
 */
export function estimateStoryModeCost(
  mode: 'story' | 'novel' | 'choice-book' | 'ai-builder',
  userBalance: number = 0
): OperationEstimate {
  const calculator = new CostCalculator(userBalance)

  switch (mode) {
    case 'story':
      return calculator.estimateMultiStepCost(['STORY_FOUNDATION', 'CHAPTER_GENERATION'])

    case 'novel':
      return calculator.estimateMultiStepCost([
        'STORY_FOUNDATION',
        'CHAPTER_GENERATION',
        'CHAPTER_GENERATION',
        'CHAPTER_GENERATION'
      ])

    case 'choice-book':
      return calculator.estimateMultiStepCost([
        'STORY_FOUNDATION',
        'CHAPTER_GENERATION',
        'CHAPTER_GENERATION'
      ])

    case 'ai-builder':
      return calculator.estimateOperationCost('CHAPTER_GENERATION')

    default:
      return calculator.estimateOperationCost('STORY_FOUNDATION')
  }
}

/**
 * Real-time cost tracking for active operations
 */
export class RealTimeCostTracker {
  private calculator: CostCalculator
  private startTime: number
  private operation: string

  constructor(userBalance: number, tier: 'basic' | 'premium', operation: string) {
    this.calculator = new CostCalculator(userBalance, tier)
    this.startTime = Date.now()
    this.operation = operation
  }

  /**
   * Update with real token usage as operation progresses
   */
  updateProgress(tokensUsed: TokenUsage): CostBreakdown {
    return this.calculator.calculateActualCost(tokensUsed)
  }

  /**
   * Finalize operation and return metrics
   */
  finalize(finalTokens: TokenUsage, outputWords: number) {
    const finalCost = this.calculator.calculateActualCost(finalTokens)
    const duration = Date.now() - this.startTime
    const efficiency = this.calculator.calculateEfficiency(finalTokens, outputWords)

    return {
      cost: finalCost,
      duration,
      efficiency,
      operation: this.operation,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Export main calculator class and utility functions
 */
export { CLAUDE_PRICING, CREDIT_SYSTEM, SUBSCRIPTION_LIMITS }

/**
 * Default export for easy import
 */
export default CostCalculator