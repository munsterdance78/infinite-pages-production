'use client'

import React, { useState, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  AlertTriangle,
  CreditCard,
  Zap,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calculator
} from 'lucide-react'
import {
  CostCalculator,
  estimateStoryModeCost,
  type OperationEstimate
} from '@/lib/pricing/cost-calculator'
import { ESTIMATED_CREDIT_COSTS } from '@/lib/utils/constants'
import CreditPurchase from '@/components/pricing/credit-purchase'

export interface PricingGuardProps {
  children: ReactNode
  operation: keyof typeof ESTIMATED_CREDIT_COSTS | 'story' | 'novel' | 'choice-book' | 'ai-builder'
  userBalance: number
  subscriptionTier: 'basic' | 'premium'
  onInsufficientCredits?: () => void
  onPurchaseComplete?: (credits: number) => void
  disabled?: boolean
  showEstimate?: boolean
  blockingMode?: 'prevent' | 'warn' | 'allow'
  customMessage?: string
}

interface GuardState {
  canAfford: boolean
  estimate: OperationEstimate | null
  showPurchaseDialog: boolean
  loading: boolean
  warning: string | null
}

/**
 * Pricing Guard Component
 * Prevents users from starting actions they can't afford to complete
 */
export default function PricingGuard({
  children,
  operation,
  userBalance,
  subscriptionTier,
  onInsufficientCredits,
  onPurchaseComplete,
  disabled = false,
  showEstimate = true,
  blockingMode = 'prevent',
  customMessage
}: PricingGuardProps) {
  const [state, setState] = useState<GuardState>({
    canAfford: true,
    estimate: null,
    showPurchaseDialog: false,
    loading: true,
    warning: null
  })

  // Calculate cost estimate when component mounts or props change
  useEffect(() => {
    calculateCostEstimate()
  }, [operation, userBalance, subscriptionTier])

  const calculateCostEstimate = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      let estimate: OperationEstimate

      // Handle different operation types
      if (['story', 'novel', 'choice-book', 'ai-builder'].includes(operation as string)) {
        estimate = estimateStoryModeCost(
          operation as 'story' | 'novel' | 'choice-book' | 'ai-builder',
          userBalance
        )
      } else {
        // Handle individual operations
        const calculator = new CostCalculator(userBalance, subscriptionTier)
        estimate = calculator.estimateOperationCost(operation as keyof typeof ESTIMATED_CREDIT_COSTS)
      }

      const canAfford = !estimate.estimatedCost.hasInsufficientCredits
      const warning = getWarningMessage(estimate, userBalance)

      setState({
        canAfford,
        estimate,
        showPurchaseDialog: false,
        loading: false,
        warning
      })

    } catch (error) {
      console.error('Error calculating cost estimate:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        warning: 'Unable to calculate cost estimate'
      }))
    }
  }

  const getWarningMessage = (estimate: OperationEstimate, balance: number): string | null => {
    const cost = estimate.estimatedCost.creditsRequired
    const remaining = balance - cost

    if (remaining < 0) {
      return `Insufficient credits. Need ${Math.abs(remaining)} more credits.`
    } else if (remaining < cost * 0.5) {
      return `Low credits warning. You'll have ${remaining} credits remaining.`
    } else if (remaining < 50) {
      return 'Running low on credits. Consider purchasing more soon.'
    }

    return null
  }

  const handleActionAttempt = (event: React.MouseEvent) => {
    if (disabled) return

    if (!state.canAfford) {
      event.preventDefault()
      event.stopPropagation()

      if (blockingMode === 'prevent') {
        // Block the action completely
        setState(prev => ({ ...prev, showPurchaseDialog: true }))
        onInsufficientCredits?.()
        return
      } else if (blockingMode === 'warn') {
        // Show warning but allow action
        if (!confirm(`${state.warning}\n\nDo you want to continue anyway?`)) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
      }
      // 'allow' mode lets the action proceed regardless
    }
  }

  const handlePurchaseSuccess = (credits: number) => {
    setState(prev => ({ ...prev, showPurchaseDialog: false }))
    onPurchaseComplete?.(credits)
    // Recalculate with new balance
    calculateCostEstimate()
  }

  if (state.loading) {
    return <PricingGuardSkeleton>{children}</PricingGuardSkeleton>
  }

  return (
    <>
      <div className="space-y-4">
        {/* Cost Estimate Display */}
        {showEstimate && state.estimate && (
          <CostEstimateCard
            estimate={state.estimate}
            canAfford={state.canAfford}
            subscriptionTier={subscriptionTier}
          />
        )}

        {/* Warning Alert */}
        {state.warning && (
          <Alert variant={state.canAfford ? 'default' : 'destructive'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {customMessage || state.warning}
            </AlertDescription>
          </Alert>
        )}

        {/* Guarded Action */}
        <div
          onClick={handleActionAttempt}
          className={`${!state.canAfford && blockingMode === 'prevent' ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {React.cloneElement(children as React.ReactElement, {
            disabled: disabled || (!state.canAfford && blockingMode === 'prevent')
          })}
        </div>

        {/* Purchase Dialog */}
        <CreditPurchase
          isOpen={state.showPurchaseDialog}
          onClose={() => setState(prev => ({ ...prev, showPurchaseDialog: false }))}
          onSuccess={handlePurchaseSuccess}
        />
      </div>
    </>
  )
}

/**
 * Cost Estimate Card Component
 */
interface CostEstimateCardProps {
  estimate: OperationEstimate
  canAfford: boolean
  subscriptionTier: 'basic' | 'premium'
}

function CostEstimateCard({ estimate, canAfford, subscriptionTier }: CostEstimateCardProps) {
  const cost = estimate.estimatedCost

  return (
    <Card className={`border-l-4 ${canAfford ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Operation Cost Estimate
          <Badge variant={canAfford ? 'default' : 'destructive'}>
            {canAfford ? 'Affordable' : 'Insufficient Credits'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Credits Required</p>
            <p className="font-semibold">{cost.creditsRequired.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">USD Equivalent</p>
            <p className="font-semibold">${cost.totalCostUSD.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Your Balance</p>
            <p className="font-semibold">{cost.userBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">After Operation</p>
            <p className={`font-semibold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
              {canAfford
                ? `${(cost.userBalance - cost.creditsRequired).toLocaleString()} remaining`
                : `Need ${(cost.creditsRequired - cost.userBalance).toLocaleString()} more`
              }
            </p>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              estimate.confidence === 'high' ? 'bg-green-500' :
              estimate.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="capitalize">{estimate.confidence} confidence estimate</span>
          </div>
        </div>

        {/* Subscription Benefits */}
        {subscriptionTier === 'basic' && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💡 Premium users get better rates and less aggressive compression
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton
 */
function PricingGuardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
      <div className="opacity-60">
        {children}
      </div>
    </div>
  )
}

/**
 * Quick Guard Hook for Simple Use Cases
 */
export function usePricingGuard(
  operation: keyof typeof ESTIMATED_CREDIT_COSTS,
  userBalance: number,
  subscriptionTier: 'basic' | 'premium'
) {
  const [canAfford, setCanAfford] = useState(true)
  const [estimate, setEstimate] = useState<OperationEstimate | null>(null)

  useEffect(() => {
    const calculator = new CostCalculator(userBalance, subscriptionTier)
    const est = calculator.estimateOperationCost(operation)
    setEstimate(est)
    setCanAfford(!est.estimatedCost.hasInsufficientCredits)
  }, [operation, userBalance, subscriptionTier])

  return {
    canAfford,
    estimate,
    creditsRequired: estimate?.estimatedCost.creditsRequired || 0,
    costUSD: estimate?.estimatedCost.totalCostUSD || 0
  }
}

/**
 * Inline Guard Component for Simple Blocking
 */
interface InlinePricingGuardProps {
  operation: keyof typeof ESTIMATED_CREDIT_COSTS
  userBalance: number
  subscriptionTier: 'basic' | 'premium'
  children: ReactNode
  fallback?: ReactNode
}

export function InlinePricingGuard({
  operation,
  userBalance,
  subscriptionTier,
  children,
  fallback
}: InlinePricingGuardProps) {
  const { canAfford } = usePricingGuard(operation, userBalance, subscriptionTier)

  if (!canAfford) {
    return (
      <div className="space-y-2">
        {fallback || (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Insufficient credits for this operation
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Batch Guard for Multiple Operations
 */
interface BatchPricingGuardProps {
  operations: (keyof typeof ESTIMATED_CREDIT_COSTS)[]
  userBalance: number
  subscriptionTier: 'basic' | 'premium'
  children: ReactNode
  showSummary?: boolean
}

export function BatchPricingGuard({
  operations,
  userBalance,
  subscriptionTier,
  children,
  showSummary = true
}: BatchPricingGuardProps) {
  const calculator = new CostCalculator(userBalance, subscriptionTier)
  const totalCost = operations.reduce((sum, op) => sum + ESTIMATED_CREDIT_COSTS[op], 0)
  const canAfford = userBalance >= totalCost

  if (showSummary) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Batch Operation Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operations.map(op => (
                <div key={op} className="flex justify-between text-sm">
                  <span className="capitalize">{op.replace('_', ' ')}</span>
                  <span>{ESTIMATED_CREDIT_COSTS[op]} credits</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className={canAfford ? 'text-green-600' : 'text-red-600'}>
                  {totalCost} credits
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={!canAfford ? 'opacity-60 cursor-not-allowed' : ''}>
          {React.cloneElement(children as React.ReactElement, {
            disabled: !canAfford
          })}
        </div>
      </div>
    )
  }

  return canAfford ? <>{children}</> : null
}