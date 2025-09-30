'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { createClient } from '@/lib/database/supabase'
import { env } from '@/types/environment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreditCard, Check, AlertCircle, Star } from 'lucide-react'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

interface CreditPackage {
  id: string
  name: string
  description: string
  credits_amount: number
  price_usd: number
  bonus_credits: number
  total_credits: number
  price_per_credit: number
  bonus_percentage: number
  is_best_value: boolean
  display_savings: string | null
}

interface CreditPurchaseProps {
  isOpen?: boolean
  onSuccess?: (credits: number) => void
  onClose?: () => void
}

export default function CreditPurchase({ isOpen = false, onSuccess, onClose }: CreditPurchaseProps) {
  return (
    <Dialog open={isOpen} {...(onClose !== undefined && { onOpenChange: onClose })}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <CreditPurchaseForm onSuccess={onSuccess || (() => {})} onClose={onClose || (() => {})} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}

function CreditPurchaseForm({ onSuccess, onClose }: CreditPurchaseProps) {
  const stripe = useStripe()
  const elements = useElements()
  const supabase = createClient()

  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'payment'>('select')

  useEffect(() => {
    fetchCreditPackages()
  }, [])

  const fetchCreditPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages')
      const data = await response.json()

      if (response.ok) {
        setPackages(data.packages)
      } else {
        setError(data.error || 'Failed to load credit packages')
      }
    } catch (err) {
      setError('Failed to load credit packages')
    }
  }

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg)
    setStep('payment')
  }

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !selectedPackage) return

    setLoading(true)
    setError(null)

    try {
      // Create payment intent
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement
          }
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Payment successful
      onSuccess?.(selectedPackage.total_credits)
      onClose?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 'select' ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Choose a credit package to continue reading and creating stories.
            </p>
          </div>

          <div className="grid gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all hover:shadow-md relative ${
                  pkg.is_best_value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                {pkg.is_best_value && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                )}

                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>

                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{pkg.credits_amount.toLocaleString()}</span> credits
                          {pkg.bonus_credits > 0 && (
                            <span className="text-green-600 font-medium ml-2">
                              + {pkg.bonus_credits.toLocaleString()} bonus
                            </span>
                          )}
                        </div>

                        {pkg.display_savings && (
                          <Badge variant="secondary" className="text-green-600">
                            {pkg.display_savings}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold">${pkg.price_usd}</div>
                      <div className="text-xs text-muted-foreground">
                        ${pkg.price_per_credit.toFixed(3)}/credit
                      </div>
                      {pkg.bonus_percentage > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          +{pkg.bonus_percentage}% bonus
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Credits:</span>
                      <span className="font-medium">{pkg.total_credits.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Secure payment processing powered by Stripe
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="space-y-6">
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-medium">{selectedPackage.total_credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${selectedPackage.price_usd}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Card Details
                  </label>
                  <div className="border border-input rounded-md p-3 bg-background">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: 'hsl(var(--foreground))',
                            fontFamily: 'inherit',
                            '::placeholder': {
                              color: 'hsl(var(--muted-foreground))'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Secured by 256-bit SSL encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('select')}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${selectedPackage?.price_usd}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}