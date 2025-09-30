/**
 * Secure Content Renderer
 *
 * Safely renders HTML content from stories without XSS vulnerabilities.
 * Replaces dangerous dangerouslySetInnerHTML patterns.
 */

'use client'

import React from 'react'
import { sanitizeStoryContent, ContentSanitizer } from '@/lib/security/content-sanitizer'

interface SecureContentRendererProps {
  content: string
  fallback?: React.ReactNode
  className?: string
  sanitizationLevel?: 'strict' | 'story' | 'basic'
}

/**
 * Secure content renderer that prevents XSS attacks
 */
export default function SecureContentRenderer({
  content,
  fallback,
  className = '',
  sanitizationLevel = 'story'
}: SecureContentRendererProps) {
  // Return fallback if no content
  if (!content || typeof content !== 'string') {
    return fallback ? <>{fallback}</> : <p>No content available</p>
  }

  // Apply appropriate sanitization based on level
  let sanitizedContent: string

  switch (sanitizationLevel) {
    case 'strict':
      // Convert to plain text for maximum security
      sanitizedContent = ContentSanitizer.formatAsBasicHTML(
        ContentSanitizer.toPlainText(content)
      )
      break

    case 'basic':
      // Allow only basic formatting
      sanitizedContent = ContentSanitizer.formatAsBasicHTML(content)
      break

    case 'story':
    default:
      // Use story content sanitization (allows safe HTML)
      sanitizedContent = sanitizeStoryContent(content)
      break
  }

  // Render sanitized content safely
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}

/**
 * Simple text renderer that converts content to safe plain text
 */
export function PlainTextRenderer({
  content,
  fallback,
  className = ''
}: {
  content: string
  fallback?: React.ReactNode
  className?: string
}) {
  if (!content || typeof content !== 'string') {
    return fallback ? <>{fallback}</> : <p>No content available</p>
  }

  const plainText = ContentSanitizer.toPlainText(content)

  return (
    <div className={className}>
      {plainText.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">
          {paragraph.trim() || '\u00A0'}
        </p>
      ))}
    </div>
  )
}

/**
 * Hook for getting sanitized content
 */
export function useSanitizedContent(
  content: string,
  level: 'strict' | 'story' | 'basic' = 'story'
): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  switch (level) {
    case 'strict':
      return ContentSanitizer.toPlainText(content)
    case 'basic':
      return ContentSanitizer.formatAsBasicHTML(content)
    case 'story':
    default:
      return sanitizeStoryContent(content)
  }
}