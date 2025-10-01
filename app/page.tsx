'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function HomePage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    premise: '',
    targetLength: 20
  })

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-development-bypass': 'true'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create story')
      }

      const data = await response.json()

      // Navigate to the new story's detail page
      router.push(`/stories/${data.story.id}`)
    } catch (error) {
      console.error('Error creating story:', error)
      alert(error instanceof Error ? error.message : 'Failed to create story')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/victorian-street-scene.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 z-10" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Infinite Pages</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-white hover:text-amber-400 hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Sign Up
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Create Unlimited Stories
              <br />
              <span className="text-amber-400">with AI Assistance</span>
            </h2>

            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Transform your storytelling with AI-powered continuity tracking,
              character development, and world-building at your fingertips
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => setShowModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6 gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Writing Now
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-amber-400 font-semibold text-lg mb-2">AI-Powered Generation</h3>
                <p className="text-white/80 text-sm">
                  Generate engaging chapters with advanced Claude AI that understands your story's context
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-amber-400 font-semibold text-lg mb-2">Smart Continuity</h3>
                <p className="text-white/80 text-sm">
                  Automatic fact tracking keeps your characters, locations, and plot points consistent
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-amber-400 font-semibold text-lg mb-2">Genre Expertise</h3>
                <p className="text-white/80 text-sm">
                  Specialized support for Fantasy, Romance, Mystery, Sci-Fi, and more
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-white/60 text-sm border-t border-white/10">
          <p>&copy; 2024 Infinite Pages. Powered by Claude AI.</p>
        </footer>
      </div>

      {/* Story Creator Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-600" />
              Create Your Story
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to begin your AI-assisted writing journey
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStory} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                placeholder="Enter your story title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => setFormData({ ...formData, genre: value })}
                required
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select a genre..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fantasy">Fantasy</SelectItem>
                  <SelectItem value="Romance">Romance</SelectItem>
                  <SelectItem value="Mystery">Mystery</SelectItem>
                  <SelectItem value="Thriller">Thriller</SelectItem>
                  <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                  <SelectItem value="Historical Fiction">Historical Fiction</SelectItem>
                  <SelectItem value="Horror">Horror</SelectItem>
                  <SelectItem value="Literary Fiction">Literary Fiction</SelectItem>
                  <SelectItem value="Young Adult">Young Adult</SelectItem>
                  <SelectItem value="Adventure">Adventure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premise">Story Premise</Label>
              <Textarea
                id="premise"
                placeholder="Describe your story idea, main characters, setting, and key themes..."
                value={formData.premise}
                onChange={(e) => setFormData({ ...formData, premise: e.target.value })}
                rows={5}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include any important details about your world, characters, or plot direction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLength">Target Chapters</Label>
              <Input
                id="targetLength"
                type="number"
                min="1"
                max="100"
                value={formData.targetLength}
                onChange={(e) => setFormData({ ...formData, targetLength: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                How many chapters do you plan to write? (You can change this later)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={creating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {creating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Story
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
