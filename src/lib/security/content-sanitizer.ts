/**
 * Content Sanitization Utility
 *
 * Provides secure HTML sanitization for user-generated content and story content.
 * Prevents XSS attacks while preserving safe formatting for story display.
 */

export interface SanitizationOptions {
  allowedTags?: string[]
  allowedAttributes?: { [key: string]: string[] }
  allowedSchemes?: string[]
  removeScripts?: boolean
  removeStyles?: boolean
}

/**
 * Default sanitization options for story content
 */
export const STORY_CONTENT_OPTIONS: SanitizationOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'i', 'b', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'div', 'span', 'ul', 'ol', 'li', 'hr'
  ],
  allowedAttributes: {
    'div': ['class'],
    'span': ['class'],
    'p': ['class'],
    'h1': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'h4': ['class'],
    'h5': ['class'],
    'h6': ['class']
  },
  allowedSchemes: [],
  removeScripts: true,
  removeStyles: true
}

/**
 * Strict sanitization options for user input
 */
export const USER_INPUT_OPTIONS: SanitizationOptions = {
  allowedTags: ['p', 'br', 'strong', 'em'],
  allowedAttributes: {},
  allowedSchemes: [],
  removeScripts: true,
  removeStyles: true
}

/**
 * Basic HTML sanitizer implementation
 * In production, you would use a library like DOMPurify
 */
export class ContentSanitizer {
  private options: SanitizationOptions

  constructor(options: SanitizationOptions = STORY_CONTENT_OPTIONS) {
    this.options = options
  }

  /**
   * Sanitize HTML content by removing dangerous elements and attributes
   */
  sanitize(content: string): string {
    if (!content || typeof content !== 'string') {
      return ''
    }

    let sanitized = content

    // Remove script tags and their content
    if (this.options.removeScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    }

    // Remove style tags and their content
    if (this.options.removeStyles) {
      sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    }

    // Remove dangerous attributes
    sanitized = this.removeDangerousAttributes(sanitized)

    // Remove non-allowed tags
    sanitized = this.removeNonAllowedTags(sanitized)

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '')

    // Remove data: protocol (except for safe images)
    sanitized = sanitized.replace(/data:(?!image\/[a-z]+;base64,)/gi, '')

    // Remove on* event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')

    return sanitized.trim()
  }

  /**
   * Remove dangerous attributes from HTML
   */
  private removeDangerousAttributes(content: string): string {
    // List of dangerous attributes
    const dangerousAttributes = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'onkeydown', 'onkeyup', 'onkeypress', 'srcdoc', 'formaction'
    ]

    let sanitized = content
    dangerousAttributes.forEach(attr => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
      sanitized = sanitized.replace(regex, '')
    })

    return sanitized
  }

  /**
   * Remove tags that are not in the allowed list
   */
  private removeNonAllowedTags(content: string): string {
    if (!this.options.allowedTags) {
      return content
    }

    const allowedTags = this.options.allowedTags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g

    return content.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Check if attributes are allowed for this tag
        if (this.options.allowedAttributes && this.options.allowedAttributes[tagName.toLowerCase()]) {
          return this.sanitizeTagAttributes(match, tagName.toLowerCase())
        }
        // Return tag without attributes if no attributes are allowed
        return match.replace(/\s+[^>]*/, '>')
      }
      return '' // Remove non-allowed tags
    })
  }

  /**
   * Sanitize attributes for a specific tag
   */
  private sanitizeTagAttributes(tag: string, tagName: string): string {
    const allowedAttrs = this.options.allowedAttributes?.[tagName] || []

    if (allowedAttrs.length === 0) {
      return tag.replace(/\s+[^>]*/, '>')
    }

    // This is a simplified implementation
    // In production, use a proper HTML parser
    return tag
  }

  /**
   * Convert unsafe content to plain text
   */
  static toPlainText(content: string): string {
    if (!content || typeof content !== 'string') {
      return ''
    }

    return content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
        // Decode common HTML entities
        const entities: { [key: string]: string } = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#39;': "'",
          '&nbsp;': ' '
        }
        return entities[match] || match
      })
      .trim()
  }

  /**
   * Format text with basic paragraph breaks
   */
  static formatAsBasicHTML(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    return text
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${ContentSanitizer.escapeHTML(paragraph)}</p>`)
      .join('')
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }

    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match] || match)
  }
}

/**
 * Create a sanitizer instance for story content
 */
export const storyContentSanitizer = new ContentSanitizer(STORY_CONTENT_OPTIONS)

/**
 * Create a sanitizer instance for user input
 */
export const userInputSanitizer = new ContentSanitizer(USER_INPUT_OPTIONS)

/**
 * Quick sanitization function for story content
 */
export function sanitizeStoryContent(content: string): string {
  return storyContentSanitizer.sanitize(content)
}

/**
 * Quick sanitization function for user input
 */
export function sanitizeUserInput(content: string): string {
  return userInputSanitizer.sanitize(content)
}