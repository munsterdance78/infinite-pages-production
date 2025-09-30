'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DollarSign,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Calculator,
  CreditCard,
  Timer,
  Activity
} from 'lucide-react'
import {
  CostCalculator,
  estimateStoryModeCost,
  type CostBreakdown,
  type OperationEstimate,
  type TokenUsage,
  type RealTimeCostTracker
} from '@/lib/pricing/cost-calculator'

interface CostDisplayProps {
  userBalance: number
  subscriptionTier: 'basic' | 'premium'
  operation?: 'story' | 'novel' | 'choice-book' | 'ai-builder'
  isGenerating?: boolean
  onUpgrade?: () => void
}

interface RealTimeCostDisplayProps {
  tracker: RealTimeCostTracker | null
  currentTokens?: TokenUsage
  estimatedCompletion?: number // percentage
}

interface CostEstimateProps {
  operation: 'story' | 'novel' | 'choice-book' | 'ai-builder'
  userBalance: number
  onProceed?: () => void
  onUpgrade?: () => void
}

/**
 * Main Cost Display Component
 * Shows real-time pricing information and user balance
 */
export function CostDisplay({
  userBalance,
  subscriptionTier,
  operation,
  isGenerating = false,
  onUpgrade
}: CostDisplayProps) {
  const [calculator] = useState(() => new CostCalculator(userBalance, subscriptionTier))
  const [estimate, setEstimate] = useState<OperationEstimate | null>(null)

  useEffect(() => {
    if (operation) {
      const est = estimateStoryModeCost(operation, userBalance)
      setEstimate(est)
    }
  }, [operation, userBalance])

  const pricingContext = calculator.getPricingContext()
  const balancePercentage = (userBalance / pricingContext.subscription.monthlyCredits) * 100

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Account Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Credits Available</span>
            <Badge variant={userBalance > 100 ? 'default' : userBalance > 20 ? 'secondary' : 'destructive'}>
              {userBalance.toLocaleString()}
            </Badge>
          </div>
          <Progress
            value={Math.min(balancePercentage, 100)}
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {subscriptionTier === 'basic'
              ? `${pricingContext.subscription.monthlyCredits.toLocaleString()} monthly limit`
              : 'Unlimited accumulation'
            }
          </div>
        </div>

        {/* Subscription Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <div className="font-medium capitalize">{subscriptionTier} Plan</div>
            <div className="text-sm text-muted-foreground">
              ${pricingContext.subscription.priceUSD}/month
            </div>
          </div>
          <Badge variant="outline">
            {pricingContext.subscription.monthlyCredits.toLocaleString()} credits/mo
          </Badge>
        </div>

        {/* Operation Estimate */}
        {estimate && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="text-sm font-medium">Estimated Cost</span>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm">{estimate.operation.charAt(0).toUpperCase() + estimate.operation.slice(1)} Creation</span>
                <span className="font-medium">
                  {estimate.estimatedCost.creditsRequired} credits
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ~${estimate.estimatedCost.totalCostUSD.toFixed(4)} USD
              </div>
              {estimate.estimatedCost.hasInsufficientCredits && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Insufficient credits. Need {estimate.estimatedCost.creditsRequired - userBalance} more.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {userBalance < 50 && (
          <Button
            onClick={onUpgrade}
            className="w-full gap-2"
            variant={userBalance < 10 ? 'default' : 'outline'}
          >
            <CreditCard className="h-4 w-4" />
            Upgrade Plan
          </Button>
        )}

        {/* Current Model Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Model: {pricingContext.model}</div>
          <div>Input: ${pricingContext.rates.inputTokenCost} per token</div>
          <div>Output: ${pricingContext.rates.outputTokenCost} per token</div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Real-time Cost Tracking Display
 * Shows costs as they accumulate during generation
 */
export function RealTimeCostDisplay({
  tracker,
  currentTokens,
  estimatedCompletion = 0
}: RealTimeCostDisplayProps) {
  const [currentCost, setCurrentCost] = useState<CostBreakdown | null>(null)

  useEffect(() => {
    if (tracker && currentTokens) {
      const cost = tracker.updateProgress(currentTokens)
      setCurrentCost(cost)
    }
  }, [tracker, currentTokens])

  if (!tracker || !currentCost) {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Live Cost Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generation Progress</span>
            <span>{estimatedCompletion.toFixed(1)}%</span>
          </div>
          <Progress value={estimatedCompletion} className="h-2" />
        </div>

        {/* Current Costs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Tokens Used</div>
            <div className="font-medium">
              {currentTokens?.totalTokens.toLocaleString() || 0}
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Credits Used</div>
            <div className="font-medium">
              {currentCost.creditsRequired}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Cost Breakdown</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Input ({currentTokens?.inputTokens.toLocaleString()} tokens)</span>
              <span>${currentCost.inputCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Output ({currentTokens?.outputTokens.toLocaleString()} tokens)</span>
              <span>${currentCost.outputCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total Cost</span>
              <span>${currentCost.totalCostUSD.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {currentCost.hasInsufficientCredits && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Operation may exceed available balance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Cost Estimate Component for Pre-generation
 */
export function CostEstimate({
  operation,
  userBalance,
  onProceed,
  onUpgrade
}: CostEstimateProps) {
  const estimate = estimateStoryModeCost(operation, userBalance)
  const canAfford = !estimate.estimatedCost.hasInsufficientCredits

  const operationDetails = {
    story: { name: 'Story', description: 'Short narrative with 1-3 chapters' },
    novel: { name: 'Novel', description: 'Full-length book with multiple chapters' },
    'choice-book': { name: 'Choice Book', description: 'Interactive story with branching paths' },
    'ai-builder': { name: 'AI Builder', description: 'AI-assisted story generation' }
  }

  const details = operationDetails[operation]

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {details.name} Cost Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operation Description */}
        <p className="text-sm text-muted-foreground">
          {details.description}
        </p>

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Estimated Credits</span>
            <Badge variant={canAfford ? 'default' : 'destructive'}>
              {estimate.estimatedCost.creditsRequired}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>USD Equivalent</span>
              <span>${estimate.estimatedCost.totalCostUSD.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Your Balance</span>
              <span>{userBalance.toLocaleString()} credits</span>
            </div>
            <div className="flex justify-between">
              <span>After Operation</span>
              <span className={canAfford ? 'text-green-600' : 'text-red-600'}>
                {canAfford
                  ? `${(userBalance - estimate.estimatedCost.creditsRequired).toLocaleString()} credits`
                  : `Need ${estimate.estimatedCost.creditsRequired - userBalance} more credits`
                }
              </span>
            </div>
          </div>

          {/* Token Estimates */}
          <div className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">Estimated Token Usage</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Input Tokens</div>
                <div>{estimate.estimatedTokens.inputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Output Tokens</div>
                <div>{estimate.estimatedTokens.outputTokens.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            <span>Estimate Confidence: </span>
            <Badge variant="outline" className="capitalize">
              {estimate.confidence}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {canAfford ? (
            <Button onClick={onProceed} className="flex-1 gap-2">
              <CheckCircle className="h-4 w-4" />
              Proceed with Creation
            </Button>
          ) : (
            <>
              <Button onClick={onUpgrade} className="flex-1 gap-2">
                <CreditCard className="h-4 w-4" />
                Upgrade Plan
              </Button>
              <Button variant="outline" onClick={onProceed} className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Try Anyway
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Efficiency Metrics Display
 */
interface EfficiencyDisplayProps {
  tokensUsed: TokenUsage
  wordsGenerated: number
  operationTime: number
  costUSD: number
}

export function EfficiencyDisplay({
  tokensUsed,
  wordsGenerated,
  operationTime,
  costUSD
}: EfficiencyDisplayProps) {
  const calculator = new CostCalculator()
  const efficiency = calculator.calculateEfficiency(tokensUsed, wordsGenerated)
  const wordsPerMinute = wordsGenerated / (operationTime / 60000) // Convert ms to minutes
  const costPerWord = costUSD / wordsGenerated

  const getEfficiencyColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Generation Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Words/Token</div>
            <div className="font-medium">{efficiency.wordsPerToken}</div>
            <div className={`text-xs capitalize ${getEfficiencyColor(efficiency.efficiency)}`}>
              {efficiency.efficiency}
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Speed</div>
            <div className="font-medium">{Math.round(wordsPerMinute)}/min</div>
            <div className="text-xs text-muted-foreground">words per minute</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Words</span>
            <span>{wordsGenerated.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tokens</span>
            <span>{tokensUsed.totalTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cost per Word</span>
            <span>${costPerWord.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Generation Time</span>
            <span>{Math.round(operationTime / 1000)}s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export all components
export default CostDisplay