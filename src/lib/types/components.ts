/**
 * Main component types - re-exports from specialized modules for backward compatibility
 */

import type { ReactNode, ComponentProps, HTMLAttributes } from 'react'
import type { Profile, Story, Chapter } from './database'

// Re-export base components
export type {
  BaseComponentProps,
  ButtonProps,
  CardProps,
  ModalProps,
  FormProps
} from './component-props'

// Re-export user types
export type {
  UserProfile,
  UnifiedUserProfile
} from './user-types'

// Re-export story types
export type {
  StoryCardProps,
  StoryListProps,
  StoryCreatorProps,
  StoryFilters
} from './story-types'

// Analytics component props (remaining in this file for now)
export interface AnalyticsChartProps {
  className?: string
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type?: 'line' | 'bar' | 'pie' | 'area'
  title?: string
  height?: number
  showLegend?: boolean
}

export interface MetricCardProps {
  className?: string
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: ReactNode
  description?: string
}

export interface DashboardTabProps {
  className?: string
  label: string
  value: string
  isActive?: boolean
  onClick?: (value: string) => void
  count?: number
}

// Creator-specific component props
// Note: CreatorEarningsProps disabled due to missing CreatorEarning type
// export interface CreatorEarningsProps {
//   className?: string
//   earnings: CreatorEarning[]
//   period: 'week' | 'month' | 'quarter' | 'year'
//   onPeriodChange?: (period: string) => void
//   showWithdrawButton?: boolean
//   onWithdraw?: () => void
// }

export interface SubscriptionBadgeProps {
  className?: string
  tier: 'free' | 'basic' | 'premium' | 'pro'
  size?: 'sm' | 'md' | 'lg'
  showUpgrade?: boolean
  onUpgrade?: () => void
}

// Event handler types
export type KeyPressHandler = (event: React.KeyboardEvent) => void