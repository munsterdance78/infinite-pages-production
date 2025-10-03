import type { Metadata } from 'next'
import StoryDetailView from '@/components/features/stories/story-detail-view'
import StoryBible from '@/components/features/stories/story-bible'

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
    <div className="victorian-bg victorian-pattern min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <StoryDetailView storyId={storyId} />
        
        {/* Story Bible Section */}
        <div className="mt-12">
          <StoryBible storyId={storyId} />
        </div>
      </div>
    </div>
  )
}
