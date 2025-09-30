import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/middleware'
import { redirect } from 'next/navigation'
import MyLibraryView from '@/components/features/library/my-library-view'

export const metadata: Metadata = {
  title: 'My Library - Infinite Pages',
  description: 'Manage and read your personal collection of stories'
}

export default async function MyLibraryPage() {
  // Note: This would be replaced with actual auth check in production
  // For now, creating the page structure for the foundation

  return (
    <div className="container mx-auto px-4 py-8">
      <MyLibraryView />
    </div>
  )
}