'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/database/supabase'
import { useRouter } from 'next/navigation'

// New architecture components
import StoryCreator from '@/components/features/stories/story-creator'
import EarningsHub from '@/components/features/creator/earnings-hub'
import CreditPurchase from '@/components/pricing/credit-purchase'
import PricingGuard from '@/components/pricing/pricing-guard'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Icons
import {
  Home,
  BookOpen,
  BarChart,
  Settings,
  Crown,
  Coins,
  User,
  Menu,
  X,
  Zap,
  TrendingUp,
  DollarSign,
  Wand2,
  Brain,
  FileText,
  RefreshCw,
  AlertTriangle,
  Library,
  PlusCircle,
  Plus
} from 'lucide-react'

import { ESTIMATED_CREDIT_COSTS } from '@/lib/utils/constants'

// Unified user profile interface
interface UnifiedUserProfile {
  id: string
  email: string
  full_name?: string
  subscription_tier: 'basic' | 'premium'
  subscription_status?: string

  // Credits system
  credits_balance: number
  tokens_used_total?: number

  // Analytics data
  stories_created: number
  words_generated?: number

  // Creator features
  is_creator?: boolean

  // Subscription data
  current_period_end?: string
  onboarding_complete?: boolean
}

interface SidebarItem {
  id: string
  label: string
  icon: any
  description: string
  showForCreators?: boolean
  requiresPremium?: boolean
}

// Dashboard overview component
function DashboardOverview({
  userProfile,
  onNavigate
}: {
  userProfile: UnifiedUserProfile
  onNavigate: (tab: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back{userProfile.full_name ? `, ${userProfile.full_name}` : ''}!
        </h1>
        <p className="text-blue-100">
          Ready to create amazing stories with AI assistance?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.credits_balance}</div>
            {userProfile.tokens_used_total && (
              <p className="text-xs text-muted-foreground">
                {userProfile.tokens_used_total} tokens used total
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Created</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.stories_created}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {userProfile.subscription_tier}
            </div>
            <Badge variant={userProfile.subscription_tier === 'premium' ? 'default' : 'secondary'}>
              {userProfile.subscription_tier === 'premium' ? 'Active' : 'Upgrade Available'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile.words_generated ?
                `${Math.floor(userProfile.words_generated / 1000)}K` :
                '0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate('create')}>
          <CardContent className="p-6 text-center">
            <PlusCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Create New Story</h3>
            <p className="text-sm text-muted-foreground">Start writing with AI assistance</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate('library')}>
          <CardContent className="p-6 text-center">
            <Library className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold">My Library</h3>
            <p className="text-sm text-muted-foreground">View and manage your stories</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate('analytics')}>
          <CardContent className="p-6 text-center">
            <BarChart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-muted-foreground">Track your writing progress</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UnifiedUserProfile | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Dashboard home and statistics'
    },
    {
      id: 'create',
      label: 'Create Story',
      icon: Wand2,
      description: 'AI-powered story creation'
    },
    {
      id: 'library',
      label: 'My Library',
      icon: BookOpen,
      description: 'Your story collection'
    },
    {
      id: 'ai-library',
      label: 'AI Library',
      icon: Brain,
      description: 'Browse AI-generated stories'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart,
      description: 'Writing insights and progress'
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: DollarSign,
      description: 'Creator earnings dashboard',
      showForCreators: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account and preferences'
    }
  ]

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      console.log('[Dashboard] Auth check:', {
        hasUser: !!user,
        error: authError?.message,
        userId: user?.id
      })

      if (authError || !user) {
        console.log('[Dashboard] No user, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      // Mock user profile data for now (replace with actual API call)
      const mockProfile: UnifiedUserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.['full_name'] || 'Story Creator',
        subscription_tier: 'basic',
        subscription_status: 'active',
        credits_balance: 1000,
        tokens_used_total: 2500,
        stories_created: 3,
        words_generated: 15400,
        is_creator: false,
        onboarding_complete: true
      }

      setUserProfile(mockProfile)
      setError(null)
    } catch (err) {
      console.error('Error loading user profile:', err)
      setError('Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
  }

  const handleCreditPurchase = (credits: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        credits_balance: userProfile.credits_balance + credits
      })
    }
    setShowCreditPurchase(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
          <Button onClick={loadUserProfile} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (item.showForCreators && !userProfile.is_creator) return false
    if (item.requiresPremium && userProfile.subscription_tier !== 'premium') return false
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 space-y-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{userProfile.credits_balance} credits</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreditPurchase(true)}
                  className="ml-auto"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <nav className="space-y-1">
              {filteredSidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleNavigation(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {sidebarItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <DashboardOverview
                userProfile={userProfile}
                onNavigate={handleNavigation}
              />
            )}

            {activeTab === 'create' && (
              <PricingGuard
                operation="STORY_FOUNDATION"
                userBalance={userProfile.credits_balance}
                subscriptionTier={userProfile.subscription_tier}
                onInsufficientCredits={() => setShowCreditPurchase(true)}
                onPurchaseComplete={handleCreditPurchase}
              >
                <StoryCreator userProfile={{
                  ...userProfile,
                  tokens_remaining: (userProfile as { tokens_remaining?: number }).tokens_remaining || 0
                }} />
              </PricingGuard>
            )}

            {activeTab === 'library' && (
              <div className="text-center py-12">
                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">My Library</h3>
                <p className="text-muted-foreground">
                  Your personal story library will be displayed here
                </p>
                <Button
                  onClick={() => router.push('/my-library')}
                  className="mt-4"
                >
                  Open Library
                </Button>
              </div>
            )}

            {activeTab === 'ai-library' && (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">AI Library</h3>
                <p className="text-muted-foreground">
                  Browse stories created by AI and the community
                </p>
                <Button
                  onClick={() => router.push('/ai-library')}
                  className="mt-4"
                >
                  Browse AI Stories
                </Button>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and insights coming soon
                </p>
              </div>
            )}

            {activeTab === 'earnings' && userProfile.is_creator && (
              <EarningsHub userId={userProfile.id} />
            )}

            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Account Settings</h3>
                <p className="text-muted-foreground">
                  Account management and preferences coming soon
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Purchase Dialog */}
        <CreditPurchase
          isOpen={showCreditPurchase}
          onClose={() => setShowCreditPurchase(false)}
          onSuccess={handleCreditPurchase}
        />
      </div>
    </div>
  )
}