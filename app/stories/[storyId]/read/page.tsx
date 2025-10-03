import type { Metadata } from 'next'
import ChapterReader from '@/components/features/stories/chapter-reader'

export const metadata: Metadata = {
  title: 'Read Story - Infinite Pages',
  description: 'Read your unlocked story chapters'
}

interface StoryReadPageProps {
  params: {
    storyId: string
  }
}

export default async function StoryReadPage({ params }: StoryReadPageProps) {
  const { storyId } = params

  return (
    <div className="min-h-screen bg-background">
      <ChapterReader storyId={storyId} />
    </div>
  )
}
