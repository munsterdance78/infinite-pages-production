'use client'

import { useState, useCallback, useRef } from 'react'
import { claudeStreamingService, type StreamResponse } from '@/lib/ai/streaming'

export interface UseClaudeStreamingOptions {
  onComplete?: (response: StreamResponse) => void
  onError?: (error: string) => void
  onProgress?: (content: string) => void
}

export function useClaudeStreaming(options: UseClaudeStreamingOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<StreamResponse['usage'] | null>(null)
  const [cost, setCost] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (
    generator: AsyncGenerator<StreamResponse, void, unknown>
  ) => {
    setIsStreaming(true)
    setContent('')
    setError(null)
    setUsage(null)
    setCost(null)

    abortControllerRef.current = new AbortController()

    try {
      for await (const response of generator) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        if (response.error) {
          setError(response.error)
          options.onError?.(response.error)
          break
        }

        setContent(response.content)
        options.onProgress?.(response.content)

        if (response.isComplete) {
          setUsage(response.usage || null)
          setCost(response.cost || null)
          options.onComplete?.(response)
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [options.onError, options.onProgress, options.onComplete])

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }, [])

  const reset = useCallback(() => {
    setContent('')
    setError(null)
    setUsage(null)
    setCost(null)
    setIsStreaming(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Story foundation streaming
  const streamStoryFoundation = useCallback(async (params: {
    title?: string
    genre: string
    premise: string
  }) => {
    const generator = claudeStreamingService.streamStoryFoundation(params)
    await startStream(generator)
  }, [startStream])

  // Chapter streaming
  const streamChapter = useCallback(async (params: {
    storyContext: string
    chapterNumber: number
    previousChapters: Array<{ number: number; content: string; summary: string }>
    targetWordCount?: number
  }) => {
    const generator = claudeStreamingService.streamChapter(params)
    await startStream(generator)
  }, [startStream])

  // Content improvement streaming
  const streamContentImprovement = useCallback(async (params: {
    content: string
    feedback: string
    improvementType?: 'general' | 'dialogue' | 'description' | 'pacing' | 'character'
  }) => {
    const generator = claudeStreamingService.streamContentImprovement(params)
    await startStream(generator)
  }, [startStream])

  // Story analysis streaming
  const streamStoryAnalysis = useCallback(async (content: string) => {
    const generator = claudeStreamingService.streamStoryAnalysis(content)
    await startStream(generator)
  }, [startStream])

  return {
    // State
    isStreaming,
    content,
    error,
    usage,
    cost,

    // Actions
    streamStoryFoundation,
    streamChapter,
    streamContentImprovement,
    streamStoryAnalysis,
    stopStream,
    reset
  }
}

// Hook for non-streaming Claude operations
export function useClaude() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeClaudeOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    executeClaudeOperation,
    clearError: () => setError(null)
  }
}