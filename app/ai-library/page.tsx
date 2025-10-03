import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/middleware'
import { redirect } from 'next/navigation'
import AILibraryView from '@/components/features/library/ai-library-view'

export const metadata: Metadata = {
  title: 'AI Library - Infinite Pages',
  description: 'Browse and read AI-generated stories from the Infinite Pages community'
}

export default async function AILibraryPage() {
  // Note: This would be replaced with actual auth check in production
  // For now, creating the page structure for the foundation

  return (
    <div className="victorian-bg min-h-screen" style={{
      backgroundImage: 'url(/victorian-street-scene.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="container mx-auto px-4 py-8">
        <AILibraryView />
      </div>
    </div>
  )
}