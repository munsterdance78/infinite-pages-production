import { type ClassValue, clsx } from 'clsx'
import { ERROR_MESSAGES } from './constants'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount)
}

export function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

export function validateTokenBalance(
  tokensRemaining: number, 
  requiredTokens: number, 
  operationType: string
): { isValid: boolean; errorResponse?: { error: string; details: string[] } } {
  if (tokensRemaining < requiredTokens) {
    return {
      isValid: false,
      errorResponse: {
        error: ERROR_MESSAGES.INSUFFICIENT_TOKENS,
        details: [
          `${requiredTokens} tokens required for ${operationType}. ` +
          `You have ${tokensRemaining} tokens remaining.`
        ]
      }
    }
  }
  return { isValid: true }
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}