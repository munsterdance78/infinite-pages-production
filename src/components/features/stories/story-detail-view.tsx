'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  FileText,
  Clock,
  DollarSign,
  ArrowLeft,
  Plus,
  Eye,
  TrendingUp,
  Calendar,
  Edit3,
  Sparkles
} from 'lucide-react'

interface Story {
  id: string
  title: string
  genre: string
  premise: string
  user_id: string
  target_length: number
  created_at: string
  updated_at: string
}

interface Chapter {
  id: string
  story_id: string
  chapter_number: number
  content: string
  word_count: number
  generation_cost_usd: number
  created_at: string
  updated_at: string
}

interface StoryDetailViewProps {
  storyId: string
}

export default function StoryDetailView({ storyId }: StoryDetailViewProps) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStoryData()
  }, [storyId])

  const loadStoryData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch story details
      const storyResponse = await fetch(`/api/stories/${storyId}`, {
        headers: {
          'x-development-bypass': 'true'
        }
      })

      if (!storyResponse.ok) {
        throw new Error('Failed to load story')
      }

      const storyData = await storyResponse.json()
      setStory(storyData.story)

      // Fetch chapters
      const chaptersResponse = await fetch(`/api/stories/${storyId}/chapters`, {
        headers: {
          'x-development-bypass': 'true'
        }
      })

      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json()
        setChapters(chaptersData.chapters || [])
      }
    } catch (err) {
      console.error('Error loading story:', err)
      setError(err instanceof Error ? err.message : 'Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  const generateNextChapter = async () => {
    if (!story || generating) return

    const nextChapterNumber = chapters.length + 1
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch(`/api/stories/${storyId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-development-bypass': 'true'
        },
        body: JSON.stringify({
          chapterNumber: nextChapterNumber
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate chapter')
      }

      const data = await response.json()

      // Refresh the chapter list
      await loadStoryData()

      // Optionally navigate to the new chapter
      // router.push(`/stories/${storyId}/chapters/${nextChapterNumber}`)
    } catch (err) {
      console.error('Error generating chapter:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate chapter')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !story) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">Error Loading Story</h3>
          <p className="text-muted-foreground mb-4">
            {error || 'Story not found'}
          </p>
          <Button onClick={() => router.push('/my-library')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0)
  const totalCost = chapters.reduce((sum, ch) => sum + ch.generation_cost_usd, 0)
  const progress = story.target_length > 0 ? (chapters.length / story.target_length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/my-library')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
          <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{story.genre}</Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(story.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl">{story.premise}</p>
        </div>
        <Button onClick={generateNextChapter} disabled={generating} className="gap-2">
          {generating ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Generate Chapter {chapters.length + 1}
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Chapters</p>
                <p className="text-lg font-semibold">
                  {chapters.length}
                  {story.target_length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /{story.target_length}
                    </span>
                  )}
                </p>
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
                <p className="text-lg font-semibold">
                  {totalWords.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Read Time</p>
                <p className="text-lg font-semibold">
                  {Math.ceil(totalWords / 250)} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-lg font-semibold">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {story.target_length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Story Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Chapters List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chapters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No chapters yet</h3>
              <p className="text-muted-foreground mb-4">
                Start writing your story by generating the first chapter
              </p>
              <Button onClick={generateNextChapter} disabled={generating} className="gap-2">
                {generating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate Chapter 1
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters
                .sort((a, b) => a.chapter_number - b.chapter_number)
                .map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stories/${storyId}/chapters/${chapter.chapter_number}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold">
                        {chapter.chapter_number}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Chapter {chapter.chapter_number}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {chapter.word_count.toLocaleString()} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.ceil(chapter.word_count / 250)} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${chapter.generation_cost_usd.toFixed(3)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(chapter.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
