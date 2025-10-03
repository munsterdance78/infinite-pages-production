'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  FileText,
  Lock,
  Eye,
  User
} from 'lucide-react'

interface Story {
  id: string
  title: string
  genre: string
  premise: string
  user_id: string
  target_length: number
  word_count: number
  chapter_count: number
  is_published: boolean
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

interface AccessCheck {
  hasAccess: boolean
  reason: string
  isCreator?: boolean
  unlockedAt?: string
  unlockRequired?: boolean
}

interface ChapterReaderProps {
  storyId: string
}

export default function ChapterReader({ storyId }: ChapterReaderProps) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [accessCheck, setAccessCheck] = useState<AccessCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStoryData()
  }, [storyId])

  const loadStoryData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check access first
      const accessResponse = await fetch(`/api/stories/${storyId}/access`)
      if (!accessResponse.ok) {
        throw new Error('Failed to check access')
      }
      const accessData = await accessResponse.json()
      setAccessCheck(accessData)

      if (!accessData.hasAccess) {
        setError(accessData.reason)
        setLoading(false)
        return
      }

      // Fetch story details
      const storyResponse = await fetch(`/api/stories/${storyId}`)

      if (!storyResponse.ok) {
        throw new Error('Failed to load story')
      }

      const storyData = await storyResponse.json()
      setStory(storyData.story)

      // Fetch chapters
      const chaptersResponse = await fetch(`/api/stories/${storyId}/chapters`)

      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json()
        const sortedChapters = (chaptersData.chapters || []).sort((a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number)
        setChapters(sortedChapters)
        
        // Set current chapter to first available chapter
        if (sortedChapters.length > 0) {
          setCurrentChapter(sortedChapters[0].chapter_number)
        }
      }
    } catch (err) {
      console.error('Error loading story:', err)
      setError(err instanceof Error ? err.message : 'Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentChapterData = () => {
    return chapters.find(ch => ch.chapter_number === currentChapter)
  }

  const goToPreviousChapter = () => {
    const currentIndex = chapters.findIndex(ch => ch.chapter_number === currentChapter)
    if (currentIndex > 0) {
      setCurrentChapter(chapters[currentIndex - 1].chapter_number)
    }
  }

  const goToNextChapter = () => {
    const currentIndex = chapters.findIndex(ch => ch.chapter_number === currentChapter)
    if (currentIndex < chapters.length - 1) {
      setCurrentChapter(chapters[currentIndex + 1].chapter_number)
    }
  }

  const handleChapterSelect = (chapterNumber: string) => {
    setCurrentChapter(parseInt(chapterNumber))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !accessCheck?.hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/ai-library')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              {error || 'Please unlock this story to read it'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!story || chapters.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/ai-library')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          
          <Alert>
            <AlertDescription>
              No chapters available for this story yet.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const currentChapterData = getCurrentChapterData()
  const currentIndex = chapters.findIndex(ch => ch.chapter_number === currentChapter)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/ai-library')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{story.title}</h1>
            {accessCheck.isCreator && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                Your Story
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{story.genre}</Badge>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {story.chapter_count} chapters
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {story.word_count.toLocaleString()} words
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl">{story.premise}</p>
        </div>
      </div>

      {/* Chapter Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chapter {currentChapter}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={currentChapter.toString()} onValueChange={handleChapterSelect}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.chapter_number} value={chapter.chapter_number.toString()}>
                      Chapter {chapter.chapter_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {currentChapterData && (
                <>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {currentChapterData.word_count.toLocaleString()} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.ceil(currentChapterData.word_count / 250)} min read
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousChapter}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextChapter}
                disabled={currentIndex === chapters.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Content */}
      <Card>
        <CardContent className="p-8">
          {currentChapterData ? (
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed">
                {currentChapterData.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chapter {currentChapter} not found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
