'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  AlertCircle,
  Crown,
  Wallet,
  Calendar,
  BarChart3
} from 'lucide-react'

interface EarningsData {
  totalEarnings: number
  monthlyEarnings: number
  totalReaders: number
  monthlyReaders: number
  storiesPublished: number
  averageRating: number
  pendingPayout: number
  nextPayoutDate: string | null
  recentPayouts: PayoutRecord[]
  topStories: StoryEarnings[]
}

interface PayoutRecord {
  id: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

interface StoryEarnings {
  id: string
  title: string
  earnings: number
  readers: number
  rating: number
}

interface CreatorEarningsHubProps {
  userId: string
  mode?: 'simple' | 'enhanced' | 'premium'
  compact?: boolean
  showHeader?: boolean
  onPayoutRequest?: () => void
  onUpgradeRequired?: () => void
}

// Mock data for demonstration - in real app this would come from API/hooks
const mockEarningsData: EarningsData = {
  totalEarnings: 1247.83,
  monthlyEarnings: 284.50,
  totalReaders: 15672,
  monthlyReaders: 3421,
  storiesPublished: 23,
  averageRating: 4.7,
  pendingPayout: 284.50,
  nextPayoutDate: '2024-01-15',
  recentPayouts: [
    { id: '1', amount: 425.30, date: '2023-12-15', status: 'completed' },
    { id: '2', amount: 312.20, date: '2023-11-15', status: 'completed' },
    { id: '3', amount: 226.83, date: '2023-10-15', status: 'completed' }
  ],
  topStories: [
    { id: '1', title: 'The Digital Frontier', earnings: 142.30, readers: 2341, rating: 4.8 },
    { id: '2', title: 'Echoes of Tomorrow', earnings: 98.50, readers: 1876, rating: 4.6 },
    { id: '3', title: 'Mystic Realms', earnings: 76.20, readers: 1432, rating: 4.7 }
  ]
}

export default function CreatorEarningsHub({
  userId,
  mode = 'enhanced',
  compact = false,
  showHeader = true,
  onPayoutRequest,
  onUpgradeRequired
}: CreatorEarningsHubProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [showDetails, setShowDetails] = useState(!compact)
  const [data] = useState<EarningsData>(mockEarningsData)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return <EarningsLoadingSkeleton compact={compact} />
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Creator Earnings
            </h1>
            <p className="text-muted-foreground">Track your story performance and earnings</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalEarnings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(data.monthlyEarnings)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Readers</p>
                <p className="text-2xl font-bold">{data.totalReaders.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {data.averageRating}
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      {data.pendingPayout > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pending Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{formatCurrency(data.pendingPayout)}</p>
                <p className="text-sm text-muted-foreground">
                  Next payout: {data.nextPayoutDate ? new Date(data.nextPayoutDate).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
              <Button onClick={onPayoutRequest} className="gap-2">
                <DollarSign className="h-4 w-4" />
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showDetails && (
        <>
          {/* Top Performing Stories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Top Performing Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topStories.map((story, index) => (
                  <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{story.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {story.readers.toLocaleString()} readers
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            {story.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(story.earnings)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentPayouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payout.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={payout.status === 'completed' ? 'default' : 'secondary'}
                      className={getStatusColor(payout.status)}
                    >
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Upgrade Prompt for Basic Users */}
      {mode === 'simple' && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Upgrade to Premium to access detailed analytics, faster payouts, and higher earning rates.
            <Button variant="link" className="p-0 h-auto" onClick={onUpgradeRequired}>
              Learn more
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Loading skeleton component
function EarningsLoadingSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!compact && (
        <>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}