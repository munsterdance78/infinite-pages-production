import type { Metadata } from 'next'
import StoryDetailView from '@/components/features/stories/story-detail-view'

export const metadata: Metadata = {
  title: 'Story Details - Infinite Pages',
  description: 'View and manage your story chapters'
}

interface StoryDetailPageProps {
  params: {
    storyId: string
  }
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { storyId } = params

  return (
    <div className="container mx-auto px-4 py-8">
      <StoryDetailView storyId={storyId} />
    </div>
  )
}
