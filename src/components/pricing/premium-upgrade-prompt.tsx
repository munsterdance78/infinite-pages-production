import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'

interface PremiumUpgradePromptProps {
  feature: string
  onUpgrade?: () => void
}

export default function PremiumUpgradePrompt({ feature, onUpgrade }: PremiumUpgradePromptProps) {
  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800">Premium Feature</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          {feature} is available for Premium subscribers only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onUpgrade}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  )
}