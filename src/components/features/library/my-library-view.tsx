'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Search,
  Filter,
  Star,
  Eye,
  Clock,
  Edit3,
  Trash2,
  Download,
  Share,
  Plus,
  Archive,
  Heart,
  TrendingUp,
  Calendar,
  FileText,
  Users
} from 'lucide-react'
import { ALLOWED_GENRES } from '@/lib/utils/constants'

interface UserStory {
  id: string
  title: string
  genre: string
  description: string
  status: 'draft' | 'in-progress' | 'completed' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
  rating?: number
  views: number
  wordCount: number
  estimatedReadTime: number
  tags: string[]
  isPublic: boolean
  chapters: number
  totalChapters?: number
  collaborators?: {
    name: string
    id: string
    role: 'owner' | 'editor' | 'viewer'
  }[]
  earnings?: {
    totalRevenue: number
    monthlyRevenue: number
  }
}

// Mock data for demonstration
const mockUserStories: UserStory[] = [
  {
    id: '1',
    title: 'The Chronicles of Aethermoor',
    genre: 'Fantasy',
    description: 'An epic fantasy adventure following a young mage discovering ancient powers.',
    status: 'in-progress',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-20T14:22:00Z',
    rating: 4.6,
    views: 1247,
    wordCount: 23450,
    estimatedReadTime: 94,
    tags: ['magic', 'adventure', 'coming-of-age'],
    isPublic: true,
    chapters: 8,
    totalChapters: 15,
    earnings: { totalRevenue: 45.67, monthlyRevenue: 12.34 }
  },
  {
    id: '2',
    title: 'Silicon Dreams',
    genre: 'Science Fiction',
    description: 'A cyberpunk thriller exploring the boundaries between human and artificial consciousness.',
    status: 'completed',
    createdAt: '2023-12-15T16:45:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    rating: 4.8,
    views: 3421,
    wordCount: 34200,
    estimatedReadTime: 137,
    tags: ['cyberpunk', 'AI', 'thriller'],
    isPublic: true,
    chapters: 12,
    totalChapters: 12,
    earnings: { totalRevenue: 89.23, monthlyRevenue: 28.76 }
  },
  {
    id: '3',
    title: 'Midnight Confessions',
    genre: 'Romance',
    description: 'A heartwarming romance set in a small coastal town.',
    status: 'draft',
    createdAt: '2024-01-22T09:15:00Z',
    updatedAt: '2024-01-23T13:40:00Z',
    views: 156,
    wordCount: 5680,
    estimatedReadTime: 23,
    tags: ['contemporary', 'small-town', 'slow-burn'],
    isPublic: false,
    chapters: 2,
    totalChapters: 20
  }
]

export default function MyLibraryView() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [activeTab, setActiveTab] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate loading user stories
    const loadStories = async () => {
      setLoading(true)
      // In production, this would fetch from API with user authentication
      await new Promise(resolve => setTimeout(resolve, 800))
      setStories(mockUserStories)
      setLoading(false)
    }

    loadStories()
  }, [])

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre
    const matchesStatus = selectedStatus === 'all' || story.status === selectedStatus

    // Tab filtering
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'published' && story.isPublic) ||
                      (activeTab === 'drafts' && story.status === 'draft') ||
                      (activeTab === 'earning' && story.earnings)

    return matchesSearch && matchesGenre && matchesStatus && matchesTab
  })

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'views':
        return b.views - a.views
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'wordCount':
        return b.wordCount - a.wordCount
      case 'earnings':
        return (b.earnings?.totalRevenue || 0) - (a.earnings?.totalRevenue || 0)
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const getStatusColor = (status: UserStory['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'published': return 'bg-purple-100 text-purple-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalStories: stories.length,
    publishedStories: stories.filter(s => s.isPublic).length,
    totalWords: stories.reduce((sum, s) => sum + s.wordCount, 0),
    totalViews: stories.reduce((sum, s) => sum + s.views, 0),
    totalEarnings: stories.reduce((sum, s) => sum + (s.earnings?.totalRevenue || 0), 0)
  }

  const handleNewStory = () => {
    console.log('[My Library] New Story button clicked')
    setIsCreateDialogOpen(true)
  }

  const handleEditStory = (storyId: string) => {
    console.log('[My Library] Edit story clicked:', storyId)
    // TODO: Navigate to story editor
    window.location.href = `/stories/${storyId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-purple-600" />
            My Library
          </h1>
          <p className="text-muted-foreground">Manage and track your personal story collection</p>
        </div>
        <Button className="gap-2" onClick={handleNewStory}>
          <Plus className="h-4 w-4" />
          New Story
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Stories</p>
                <p className="text-lg font-semibold">{stats.totalStories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-lg font-semibold">{stats.publishedStories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-lg font-semibold">{Math.round(stats.totalWords / 1000)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-lg font-semibold">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Earnings</p>
                <p className="text-lg font-semibold">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="earning">Earning</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your stories..."
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="wordCount">Word Count</SelectItem>
                <SelectItem value="earnings">Earnings</SelectItem>
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
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No stories found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all'
                    ? "You haven't created any stories yet."
                    : 'No stories match your current filters.'
                  }
                </p>
                <Button className="gap-2" onClick={handleNewStory}>
                  <Plus className="h-4 w-4" />
                  Create Your First Story
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStories.map(story => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{story.genre}</Badge>
                          <Badge className={getStatusColor(story.status)} variant="outline">
                            {story.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {story.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span>{story.rating}</span>
                        </div>
                      )}
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

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {story.views.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {story.estimatedReadTime}m
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {story.chapters}/{story.totalChapters || '?'} chapters
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(story.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {story.earnings && (
                        <div className="text-xs text-green-600 font-medium">
                          ${story.earnings.totalRevenue.toFixed(2)} earned
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleEditStory(story.id)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Story Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Story creation wizard coming soon! This feature will allow you to create a new infinite story with AI assistance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              The story creation feature is currently under development. Once complete, you'll be able to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Choose your story genre and setting</li>
              <li>Define main characters and plot</li>
              <li>Set up AI writing parameters</li>
              <li>Generate your first chapter instantly</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}