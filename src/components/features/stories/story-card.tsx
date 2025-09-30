import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StoryCardProps {
  story: {
    id: string
    title: string
    description?: string
    status?: string
  }
  onClick?: () => void
}

export default function StoryCard({ story, onClick }: StoryCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <CardTitle className="text-lg">{story.title}</CardTitle>
      </CardHeader>
      {story.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{story.description}</p>
          {story.status && (
            <p className="text-xs text-muted-foreground mt-2">Status: {story.status}</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}