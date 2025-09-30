// AI Usage Transparency System - Cost Calculator
// Provides transparent pricing with 20% markup over actual API costs

export interface AIOperation {
  type: 'foundation' | 'character' | 'cover' | 'chapter' | 'improvement'
  complexity: 'simple' | 'medium' | 'complex'
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
}

export interface CostBreakdown {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  totalTokens: number
  actualCostUSD: number
  chargedAmountUSD: number
  markupPercentage: number
  modelUsed: string
  savingsVsMarket: number
}

export interface UsageStats {
  totalTokensThisMonth: number
  totalCostThisMonth: number
  totalChargedThisMonth: number
  operationBreakdown: Record<string, {
    tokens: number
    cost: number
    charged: number
    count: number
  }>
  coverGenerations: number
  savingsVsMarket: number
}

// Current AI model pricing (as of 2024)
const MODEL_PRICING = {
  'claude-3-sonnet': {
    input: 0.000003,  // $0.003 per 1K tokens
    output: 0.000015, // $0.015 per 1K tokens
    name: 'Claude 3 Sonnet'
  },
  'gpt-4': {
    input: 0.00003,   // $0.03 per 1K tokens
    output: 0.00006,  // $0.06 per 1K tokens
    name: 'GPT-4'
  },
  'stable-diffusion': {
    input: 0,
    output: 0.02,     // $0.02 per image
    name: 'Stable Diffusion'
  }
} as const

// Market comparison rates (what other services charge)
const MARKET_RATES = {
  foundation: 0.15,    // Other services charge ~$0.15 per story foundation
  character: 0.08,     // Other services charge ~$0.08 per character generation
  chapter: 0.12,       // Other services charge ~$0.12 per chapter
  cover: 0.50,         // Other services charge ~$0.50 per cover
  improvement: 0.05    // Other services charge ~$0.05 per improvement
}

// Markup is now handled at subscription level - no additional markup here
const CREATOR_SHARE_PERCENTAGE = 70 // 70% to creator, 30% to platform

// Token estimation based on operation complexity
const TOKEN_ESTIMATES = {
  foundation: {
    simple: { input: 200, output: 800 },
    medium: { input: 400, output: 1500 },
    complex: { input: 600, output: 2500 }
  },
  character: {
    simple: { input: 150, output: 400 },
    medium: { input: 250, output: 700 },
    complex: { input: 400, output: 1200 }
  },
  chapter: {
    simple: { input: 300, output: 1000 },
    medium: { input: 500, output: 2000 },
    complex: { input: 800, output: 3500 }
  },
  improvement: {
    simple: { input: 200, output: 300 },
    medium: { input: 400, output: 600 },
    complex: { input: 600, output: 1000 }
  },
  cover: {
    simple: { input: 0, output: 1 },   // 1 image
    medium: { input: 0, output: 1 },
    complex: { input: 0, output: 1 }
  }
}

export function estimateOperationCost(operation: AIOperation, modelType: keyof typeof MODEL_PRICING = 'claude-3-sonnet'): CostBreakdown {
  const estimates = TOKEN_ESTIMATES[operation.type][operation.complexity]
  const pricing = MODEL_PRICING[modelType]

  const inputTokens = operation.estimatedInputTokens || estimates.input
  const outputTokens = operation.estimatedOutputTokens || estimates.output
  const totalTokens = inputTokens + outputTokens

  let actualCost: number

  if (operation.type === 'cover') {
    // Cover generation uses Stable Diffusion pricing
    actualCost = MODEL_PRICING['stable-diffusion'].output * outputTokens
  } else {
    // Text generation using Claude/GPT pricing
    actualCost = (inputTokens * pricing.input) + (outputTokens * pricing.output)
  }

  // No markup at usage time - user pays actual AI cost from pre-purchased credits
  const chargedAmount = actualCost
  const marketRate = MARKET_RATES[operation.type]
  const savingsVsMarket = Math.round(((marketRate - chargedAmount) / marketRate) * 100)

  return {
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens: outputTokens,
    totalTokens,
    actualCostUSD: actualCost,
    chargedAmountUSD: chargedAmount,
    markupPercentage: 0, // No markup at usage time
    modelUsed: pricing.name,
    savingsVsMarket: Math.max(0, savingsVsMarket)
  }
}

export function calculateActualCost(
  inputTokens: number,
  outputTokens: number,
  modelType: keyof typeof MODEL_PRICING = 'claude-3-sonnet'
): { actualCost: number; chargedAmount: number } {
  const pricing = MODEL_PRICING[modelType]
  const actualCost = (inputTokens * pricing.input) + (outputTokens * pricing.output)
  const chargedAmount = actualCost * 1.5

  return { actualCost, chargedAmount }
}

export function formatCost(amount: number): string {
  if (amount < 0.001) {
    return '<$0.001'
  }
  return `$${amount.toFixed(4)}`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`
  }
  return `${tokens} tokens`
}

export function getCostDisplayString(cost: CostBreakdown): string {
  return `~${formatTokens(cost.totalTokens)} | ${formatCost(cost.actualCostUSD)} cost | ${formatCost(cost.chargedAmountUSD)} charged`
}

export function getProcessingDisplayString(tokensUsed: number): string {
  return `Generating... ${formatTokens(tokensUsed)} used so far`
}

export function getCompletedDisplayString(
  inputTokens: number,
  outputTokens: number,
  actualCost: number,
  chargedAmount: number
): string {
  const total = inputTokens + outputTokens
  return `Completed: ${formatTokens(total)} | ${formatCost(actualCost)} cost | ${formatCost(chargedAmount)} charged`
}

// For the monthly usage dashboard
export function calculateMonthlySavings(usageStats: UsageStats): number {
  let totalMarketCost = 0

  // Calculate what user would pay at market rates
  Object.entries(usageStats.operationBreakdown).forEach(([operation, stats]) => {
    const marketRate = MARKET_RATES[operation as keyof typeof MARKET_RATES]
    if (marketRate) {
      totalMarketCost += marketRate * stats.count
    }
  })

  // Add cover generation market cost
  totalMarketCost += usageStats.coverGenerations * MARKET_RATES.cover

  const actualCharged = usageStats.totalChargedThisMonth
  const savings = Math.round(((totalMarketCost - actualCharged) / totalMarketCost) * 100)

  return Math.max(0, savings)
}

export function getOperationComplexity(
  operationType: AIOperation['type'],
  contentLength?: number,
  customPrompt?: string
): AIOperation['complexity'] {
  // Determine complexity based on operation type and content
  switch (operationType) {
    case 'foundation':
      if (contentLength && contentLength > 500) return 'complex'
      if (customPrompt && customPrompt.length > 200) return 'medium'
      return 'simple'

    case 'character':
      if (customPrompt && customPrompt.length > 150) return 'medium'
      return 'simple'

    case 'chapter':
      if (contentLength && contentLength > 1000) return 'complex'
      if (contentLength && contentLength > 500) return 'medium'
      return 'simple'

    case 'cover':
      if (customPrompt && customPrompt.length > 100) return 'medium'
      return 'simple'

    case 'improvement':
      return 'simple'

    default:
      return 'medium'
  }
}