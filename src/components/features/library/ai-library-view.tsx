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
  Zap
} from 'lucide-react'
import { ALLOWED_GENRES } from '@/lib/utils/constants'

interface AIStory {
  id: string
  title: string
  genre: string
  description: string
  aiModel: string
  generatedAt: string
  rating: number
  views: number
  wordCount: number
  estimatedReadTime: number
  tags: string[]
  isPublic: boolean
  creator?: {
    name: string
    id: string
  }
}

// Mock data for demonstration
const mockAIStories: AIStory[] = [
  {
    id: '1',
    title: 'The Digital Consciousness',
    genre: 'Science Fiction',
    description: 'An AI awakens in a vast digital realm and must navigate the complexities of consciousness.',
    aiModel: 'Claude-3-Sonnet',
    generatedAt: '2024-01-15T10:30:00Z',
    rating: 4.7,
    views: 2341,
    wordCount: 8450,
    estimatedReadTime: 34,
    tags: ['AI', 'consciousness', 'digital-world'],
    isPublic: true,
    creator: { name: 'StoryBot', id: 'ai-bot-1' }
  },
  {
    id: '2',
    title: 'Echoes of Tomorrow',
    genre: 'Fantasy',
    description: 'A mystical journey through time where magic and technology intertwine.',
    aiModel: 'Claude-3-Opus',
    generatedAt: '2024-01-14T15:45:00Z',
    rating: 4.5,
    views: 1876,
    wordCount: 12300,
    estimatedReadTime: 49,
    tags: ['time-travel', 'magic', 'technology'],
    isPublic: true,
    creator: { name: 'AI Storyteller', id: 'ai-bot-2' }
  },
  {
    id: '3',
    title: 'The Last Library',
    genre: 'Dystopian',
    description: 'In a world where books are forbidden, one librarian fights to preserve knowledge.',
    aiModel: 'Claude-3-Sonnet',
    generatedAt: '2024-01-13T09:20:00Z',
    rating: 4.9,
    views: 3567,
    wordCount: 15600,
    estimatedReadTime: 62,
    tags: ['dystopian', 'books', 'resistance'],
    isPublic: true,
    creator: { name: 'Literary AI', id: 'ai-bot-3' }
  }
]

export default function AILibraryView() {
  const [stories, setStories] = useState<AIStory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    // Simulate loading AI stories
    const loadStories = async () => {
      setLoading(true)
      // In production, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStories(mockAIStories)
      setLoading(false)
    }

    loadStories()
  }, [])

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre
    return matchesSearch && matchesGenre && story.isPublic
  })

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'views':
        return b.views - a.views
      case 'newest':
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      case 'wordCount':
        return b.wordCount - a.wordCount
      default: // trending
        return (b.views * b.rating) - (a.views * a.rating)
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
                  {stories.reduce((sum, story) => sum + story.views, 0).toLocaleString()}
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
                    ? (stories.reduce((sum, story) => sum + story.rating, 0) / stories.length).toFixed(1)
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
                  {Math.round(stories.reduce((sum, story) => sum + story.wordCount, 0) / 1000)}K
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
            <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{story.genre}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Bot className="h-3 w-3" />
                        {story.aiModel}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>{story.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {story.description}
                </p>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {story.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {story.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {story.estimatedReadTime}m
                      </span>
                    </div>
                    <span>{story.wordCount.toLocaleString()} words</span>
                  </div>

                  <Button className="w-full" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Read Story
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