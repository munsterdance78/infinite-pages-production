import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1
}

export const metadata: Metadata = {
  title: 'Infinite Pages - Where Every Story Becomes Infinite',
  description: 'Transform any idea into boundless story universes that grow endlessly. Your AI creative partner awaits - explore limitless possibilities together.',
  keywords: ['AI', 'story generation', 'writing', 'creative writing', 'artificial intelligence'],
  authors: [{ name: 'Infinite-Pages Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Infinite Pages - Where Every Story Becomes Infinite',
    description: 'Transform any idea into boundless story universes that grow endlessly. Your AI creative partner awaits - explore limitless possibilities together.',
    type: 'website',
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinite Pages - Where Every Story Becomes Infinite',
    description: 'Transform any idea into boundless story universes that grow endlessly. Your AI creative partner awaits - explore limitless possibilities together.'
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <main className="min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  )
}