'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bot,
  Search,
  Filter,
  Star,
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  BookOpen,
  Users,
  Zap,
  FileText
} from 'lucide-react'
import { ALLOWED_GENRES } from '@/lib/utils/constants'

interface AIStory {
  id: string
  title: string
  genre: string
  premise: string
  target_length: number
  word_count: number
  chapter_count: number
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
  creator?: {
    name: string
    id: string
  }
}

// Real API data - no mock data needed

export default function AILibraryView() {
  const [stories, setStories] = useState<AIStory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [unlockedStories, setUnlockedStories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/library')
        if (!response.ok) {
          throw new Error('Failed to load stories')
        }
        const data = await response.json()
        setStories(data.stories || [])
      } catch (error) {
        console.error('Error loading stories:', error)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [])

  const unlockStory = async (storyId: string) => {
    setUnlocking(storyId)
    try {
      const response = await fetch(`/api/stories/${storyId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlock story')
      }

      const data = await response.json()
      
      // Add to unlocked stories
      setUnlockedStories(prev => new Set([...prev, storyId]))
      
      // Show success message (you could add a toast notification here)
      console.log('Story unlocked successfully:', data.message)
      
    } catch (error) {
      console.error('Error unlocking story:', error)
      // Show error message (you could add a toast notification here)
      alert(error instanceof Error ? error.message : 'Failed to unlock story')
    } finally {
      setUnlocking(null)
    }
  }

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.premise.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre
    return matchesSearch && matchesGenre && story.is_published
  })

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      case 'wordCount':
        return b.word_count - a.word_count
      case 'chapters':
        return b.chapter_count - a.chapter_count
      default: // newest
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Library
          </h1>
          <p className="text-muted-foreground">Discover amazing stories created by AI</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {stories.length} AI Stories
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Stories</p>
                <p className="text-lg font-semibold">{stories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-lg font-semibold">
                  {stories.reduce((sum, story) => sum + (story as any).views || 0, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-lg font-semibold">
                  {stories.length > 0
                    ? (stories.reduce((sum, story) => sum + ((story as any).rating || 0), 0) / stories.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-lg font-semibold">
                  {Math.round(stories.reduce((sum, story) => sum + story.word_count, 0) / 1000)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search AI stories, tags, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
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
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="wordCount">Longest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedStories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No AI stories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new AI-generated content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStories.map(story => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{story.genre}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Bot className="h-3 w-3" />
                        AI Generated
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(story.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {story.premise}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {story.chapter_count} chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {story.word_count.toLocaleString()} words
                      </span>
                    </div>
                    <span className="text-green-600 font-medium">
                      {story.target_length.toLocaleString()} target
                    </span>
                  </div>

                  <Button 
                    className="w-full" 
                    size="sm" 
                    variant={unlockedStories.has(story.id) ? "secondary" : "default"}
                    onClick={() => {
                      if (unlockedStories.has(story.id)) {
                        window.location.href = `/stories/${story.id}/read`
                      } else {
                        unlockStory(story.id)
                      }
                    }}
                    disabled={unlocking === story.id}
                  >
                    {unlocking === story.id ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Unlocking...
                      </>
                    ) : unlockedStories.has(story.id) ? (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read Now
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Unlock for 250 credits ($0.25)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}