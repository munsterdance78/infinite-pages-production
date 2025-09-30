'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/database/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Sparkles,
  Zap,
  Star,
  Check,
  ArrowRight,
  Crown,
  FileText,
  BarChart,
  Download,
  Rocket,
  Brain,
  Wand2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const redirectUrl = `${process.env['NEXT_PUBLIC_SITE_URL'] || window.location.origin}/api/auth/callback`

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Infinite-Pages
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                onClick={() => {
                  const pricingSection = document.getElementById('pricing-section')
                  pricingSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                onClick={() => {
                  const featuresSection = document.getElementById('features-section')
                  featuresSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Features
              </Button>
              <Button
                onClick={handleSignIn}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Signing in...' : 'Get Started Free'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200" variant="outline">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Story Generation Platform
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Create{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Unlimited Stories
              </span>
              <br />
              with AI Assistance
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your ideas into complete stories with our advanced AI. Generate foundations,
              write chapters, and bring your imagination to life with cost-effective structured prompting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleSignIn}
                disabled={loading}
                className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4"
                onClick={() => {
                  const featuresSection = document.getElementById('features-section')
                  featuresSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Features
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to write amazing stories</h2>
            <p className="text-xl text-gray-600">Powered by Claude AI with cost-optimized structured prompting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>AI Story Foundation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generate complete story bibles with characters, world-building, and plot outlines in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Chapter Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Write engaging chapters that maintain consistency with your story's world and characters.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Wand2 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Smart Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Refine your content with AI-powered suggestions while maintaining your story's voice.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Export Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Download your stories in PDF, EPUB, DOCX, or TXT format for publishing or sharing.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Writing Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track your progress, efficiency, and writing patterns to optimize your creative process.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle>Cost Efficient</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Structured prompting system maximizes quality while minimizing AI costs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your writing goals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Basic</CardTitle>
                <div className="text-4xl font-bold">$7.99</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">1,332 Credits per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">5 stories per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Foundation, character & chapter generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">2 cover generations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Community support</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-6"
                  variant="outline"
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  Start Basic Plan
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-purple-200 shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-4 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold">$14.99</div>
                <p className="text-gray-600">For serious writers</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">2,497 Credits per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">All export formats (PDF, EPUB, DOCX)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Advanced AI operations & improvements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Priority support & analytics dashboard</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Start Premium Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              30-day money-back guarantee • Cancel anytime • No setup fees
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">Words Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Stories Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to bring your stories to life?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of writers creating amazing stories with AI assistance
          </p>
          <Button
            size="lg"
            onClick={handleSignIn}
            disabled={loading}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Account - Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Infinite-Pages</span>
              </div>
              <p className="text-gray-400">
                AI-powered story generation platform for writers of all levels.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Examples</li>
                <li>API</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Status</li>
                <li>Community</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Infinite-Pages. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}