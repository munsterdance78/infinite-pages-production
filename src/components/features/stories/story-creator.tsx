'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/database/supabase'
import type { Database } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import StoryCard from '@/components/features/stories/story-card'
import ErrorBoundary from '@/components/common/error-boundary'
import PremiumUpgradePrompt from '@/components/pricing/premium-upgrade-prompt'
import {
  BookOpen,
  Plus,
  Wand2,
  Edit,
  DollarSign,
  Sparkles,
  FileText,
  RefreshCw,
  ArrowLeft,
  Search,
  Filter,
  SortDesc,
  Brain,
  Edit3,
  Save,
  Eye,
  Zap,
  Clock,
  BarChart3,
  Target,
  Layers,
  Users,
  Settings,
  TreePine,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import {
  ESTIMATED_CREDIT_COSTS,
  ALLOWED_GENRES,
  EXPORT_FORMATS,
  STORY_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  type StoryStatus,
  type ExportFormat
} from '@/lib/utils/constants'
import type { SubscriptionTier } from '@/lib/utils/subscription-config'

// Unified story creation modes
type CreationMode = 'story' | 'novel' | 'choice-book' | 'ai-builder'

// Unified story interface combining all types
interface UnifiedStory {
  id: string
  user_id: string
  title: string
  genre: string | null
  premise: string | null
  type: CreationMode
  status: StoryStatus

  // Story-specific fields
  foundation?: any
  chapters?: any[]
  content?: string
  total_tokens?: number
  cost_usd?: number

  // Novel-specific fields
  description?: string
  target_length?: number
  total_chapters?: number
  completed_chapters?: number
  total_words?: number

  // Choice book specific fields
  choice_complexity?: 'simple' | 'moderate' | 'complex'
  target_ending_count?: number
  estimated_length?: number
  main_themes?: string[]
  target_audience?: string
  choice_tree?: any

  // AI-assisted fields
  tone?: string
  characters?: string
  setting?: string
  ai_model_used?: string
  generation_time?: number

  // Common metadata
  created_at: string
  updated_at: string
  earnings_usd?: number
  views?: number
  published?: boolean
}

interface UnifiedStoryCreatorProps {
  userProfile: {
    id: string
    email: string
    subscription_tier: SubscriptionTier
    tokens_remaining: number
    tokens_used_total?: number
    stories_created?: number
    credits_balance?: number
    is_creator?: boolean
  }
  defaultMode?: CreationMode
  storyId?: string // For editing existing stories
}

interface CreationProgress {
  currentStep: number
  totalSteps: number
  stepName: string
  isGenerating: boolean
  error?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export default function UnifiedStoryCreator({
  userProfile,
  defaultMode = 'story',
  storyId
}: UnifiedStoryCreatorProps) {
  const [mode, setMode] = useState<CreationMode>(defaultMode)
  const [stories, setStories] = useState<UnifiedStory[]>([])
  const [currentStory, setCurrentStory] = useState<UnifiedStory | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGenre, setFilterGenre] = useState('all')
  const [sortBy, setSortBy] = useState('updated_at')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [progress, setProgress] = useState<CreationProgress>({
    currentStep: 0,
    totalSteps: 1,
    stepName: 'Initializing',
    isGenerating: false
  })

  // Form state for all modes
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    premise: '',
    description: '',
    tone: 'neutral',
    length: 'medium',
    characters: '',
    setting: '',
    target_length: 50000,
    target_chapters: 30,
    target_chapter_length: 2000,
    choice_complexity: 'moderate' as 'simple' | 'moderate' | 'complex',
    target_ending_count: 5,
    estimated_length: 10000,
    main_themes: [] as string[],
    target_audience: 'adult'
  })

  const supabase = createClient()

  useEffect(() => {
    loadStories()
    if (storyId) {
      loadStoryForEditing(storyId)
    }
  }, [storyId])

  const loadStories = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setStories(data || [])
    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStoryForEditing = async (id: string) => {
    try {
      const { data: storyData, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single()

      const data = storyData as any

      if (error) throw error
      if (data) {
        setCurrentStory(data as UnifiedStory)
        setMode(data.type as CreationMode)
        setFormData({
          title: data.title || '',
          genre: data.genre || '',
          premise: data.premise || '',
          description: data.description || '',
          tone: data.tone || 'neutral',
          length: 'medium',
          characters: data.characters || '',
          setting: data.setting || '',
          target_length: data.target_length || 50000,
          target_chapters: data.target_chapters || 30,
          target_chapter_length: data.target_chapter_length || 2000,
          choice_complexity: data.choice_complexity || 'moderate',
          target_ending_count: data.target_ending_count || 5,
          estimated_length: data.estimated_length || 10000,
          main_themes: data.main_themes || [],
          target_audience: data.target_audience || 'adult'
        })
        setIsEditing(true)
        setIsCreating(true)
      }
    } catch (error) {
      console.error('Error loading story for editing:', error)
    }
  }

  const validateForm = (): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!formData.title.trim()) {
      errors.push('Title is required')
    }

    if (!formData.genre) {
      errors.push('Genre is required')
    }

    if (!formData.premise.trim()) {
      errors.push('Premise is required')
    }

    if (formData.premise.length < 50) {
      warnings.push('Consider adding more detail to your premise for better results')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  const calculateEstimatedCost = (): number => {
    switch (mode) {
      case 'story':
        return ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION + (ESTIMATED_CREDIT_COSTS.CHAPTER_GENERATION * 3)
      case 'novel':
        return ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION + (ESTIMATED_CREDIT_COSTS.CHAPTER_GENERATION * 10)
      case 'choice-book':
        return ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION + (ESTIMATED_CREDIT_COSTS.CHAPTER_GENERATION * formData.target_ending_count * 2)
      case 'ai-builder':
        return ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION + ESTIMATED_CREDIT_COSTS.CONTENT_ANALYSIS
      default:
        return ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION
    }
  }

  const handleCreate = async () => {
    const validation = validateForm()
    if (!validation.isValid) {
      alert(validation.errors.join('\n'))
      return
    }

    const estimatedCost = calculateEstimatedCost()
    if ((userProfile.credits_balance || 0) < estimatedCost) {
      setShowUpgradePrompt(true)
      return
    }

    try {
      setProgress({
        currentStep: 1,
        totalSteps: 1,
        stepName: 'Generating story foundation with AI',
        isGenerating: true
      })

      // Call the actual API endpoint
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          genre: formData.genre,
          premise: formData.premise,
          target_length: formData.target_length,
          target_chapters: formData.target_chapters,
          target_chapter_length: formData.target_chapter_length
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create story')
      }

      const data = await response.json()

      // Update local state with the created story
      setCurrentStory(data.story as UnifiedStory)

      // Show success message with cache info
      setProgress({
        currentStep: 1,
        totalSteps: 1,
        stepName: data.fromCache ? 'Story created (from cache)' : 'Story created successfully',
        isGenerating: false
      })

      // Reload stories list and close creator
      await loadStories()
      setIsCreating(false)

    } catch (error) {
      console.error('Error creating story:', error)
      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to create story. Please try again.'
      }))
    }
  }

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.premise?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = filterGenre === 'all' || story.genre === filterGenre
    const matchesMode = story.type === mode
    return matchesSearch && matchesGenre && matchesMode
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'views':
        return (b.views || 0) - (a.views || 0)
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  if (showUpgradePrompt) {
    return (
      <PremiumUpgradePrompt
        feature="Story Creation"
        onUpgrade={() => setShowUpgradePrompt(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Story Creation Studio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as CreationMode)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="story" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Story
              </TabsTrigger>
              <TabsTrigger value="novel" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Novel
              </TabsTrigger>
              <TabsTrigger value="choice-book" className="flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                Choice Book
              </TabsTrigger>
              <TabsTrigger value="ai-builder" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Builder
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    {mode === 'story' && 'Short Story'}
                    {mode === 'novel' && 'Full-Length Novel'}
                    {mode === 'choice-book' && 'Interactive Choice Book'}
                    {mode === 'ai-builder' && 'AI-Assisted Creation'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {mode === 'story' && 'Create compelling short stories with AI assistance'}
                    {mode === 'novel' && 'Write full-length novels with chapter-by-chapter generation'}
                    {mode === 'choice-book' && 'Build interactive stories with multiple endings'}
                    {mode === 'ai-builder' && 'Let AI help build your story foundation and structure'}
                  </p>
                </div>
                <Badge variant={mode === 'ai-builder' ? 'default' : 'secondary'}>
                  ~{calculateEstimatedCost()} credits
                </Badge>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </Button>
        <Button variant="outline" onClick={loadStories} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Creation Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit' : 'Create'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Fill in the details to {isEditing ? 'update' : 'generate'} your {mode}
            </DialogDescription>
          </DialogHeader>

          {progress.isGenerating ? (
            <div className="space-y-4">
              <Progress value={(progress.currentStep / progress.totalSteps) * 100} />
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="font-medium">{progress.stepName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Step {progress.currentStep} of {progress.totalSteps}
                </p>
              </div>
              {progress.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{progress.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter story title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALLOWED_GENRES.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Premise</label>
                <Textarea
                  value={formData.premise}
                  onChange={(e) => setFormData(prev => ({ ...prev, premise: e.target.value }))}
                  placeholder="Describe your story idea..."
                  rows={3}
                />
              </div>

              {mode === 'novel' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Target Length (words)</label>
                      <Input
                        type="number"
                        value={formData.target_length}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_length: parseInt(e.target.value) }))}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Target Chapters</label>
                      <Input
                        type="number"
                        value={formData.target_chapters}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_chapters: parseInt(e.target.value) }))}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Chapter Length (words)</label>
                      <Input
                        type="number"
                        value={formData.target_chapter_length}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_chapter_length: parseInt(e.target.value) }))}
                        placeholder="2000"
                      />
                    </div>
                  </div>
                  
                  {/* Cost Estimation */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Estimated Cost</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {formData.target_chapters} chapters × 80 credits = {formData.target_chapters * 80} credits (${(formData.target_chapters * 80 * 0.001).toFixed(2)})
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Your balance: {userProfile.credits_balance || userProfile.tokens_remaining} credits
                        </div>
                        {formData.target_chapters * 80 > (userProfile.credits_balance || userProfile.tokens_remaining) && (
                          <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                            ⚠️ Insufficient credits
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {mode === 'choice-book' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Complexity</label>
                    <Select
                      value={formData.choice_complexity}
                      onValueChange={(value: 'simple' | 'moderate' | 'complex') =>
                        setFormData(prev => ({ ...prev, choice_complexity: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple (3-5 choices)</SelectItem>
                        <SelectItem value="moderate">Moderate (5-10 choices)</SelectItem>
                        <SelectItem value="complex">Complex (10+ choices)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Endings</label>
                    <Input
                      type="number"
                      value={formData.target_ending_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_ending_count: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Characters</label>
                  <Textarea
                    value={formData.characters}
                    onChange={(e) => setFormData(prev => ({ ...prev, characters: e.target.value }))}
                    placeholder="Describe main characters"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Setting</label>
                  <Textarea
                    value={formData.setting}
                    onChange={(e) => setFormData(prev => ({ ...prev, setting: e.target.value }))}
                    placeholder="Describe the setting"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Estimated cost: {calculateEstimatedCost()} credits</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={progress.isGenerating}>
                    {isEditing ? 'Update' : 'Create'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stories Grid */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {ALLOWED_GENRES.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Recently Updated</SelectItem>
              <SelectItem value="created_at">Recently Created</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stories List */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No stories found</h3>
              <p className="text-muted-foreground mb-4">
                {stories.length === 0
                  ? `Create your first ${mode} to get started!`
                  : 'Try adjusting your search or filters.'
                }
              </p>
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create New {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map(story => (
              <ErrorBoundary key={story.id}>
                <StoryCard
                  story={story as any}
                  onClick={() => loadStoryForEditing(story.id)}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}