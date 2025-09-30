/**
 * Story-related component types and interfaces
 */

import type { BaseComponentProps } from './component-props'
import type { Story, Chapter } from './database'

export interface StoryCardProps extends BaseComponentProps {
  story: Story
  onEdit?: (story: Story) => void
  onDelete?: (storyId: string) => void
  showActions?: boolean
  compact?: boolean
}

export interface StoryListProps extends BaseComponentProps {
  stories: Story[]
  loading?: boolean
  error?: string | null
  onStorySelect?: (story: Story) => void
  onEdit?: (story: Story) => void
  onDelete?: (storyId: string) => void
  showPagination?: boolean
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export interface StoryCreatorProps extends BaseComponentProps {
  onStoryCreated?: (story: Story) => void
  initialData?: Partial<Story>
  mode?: 'create' | 'edit'
}

export interface StoryFilters {
  genre?: string
  status?: 'draft' | 'published' | 'archived'
  authorId?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'views'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}