import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  // Auth condition: if user is signing in and no user, redirect to login
  if (req.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Auth condition: if user is logged in and trying to access auth pages, redirect to dashboard
  if (req.nextUrl.pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // API route protection
  if (req.nextUrl.pathname.startsWith('/api/stories') && !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Protected API routes
  if (req.nextUrl.pathname.startsWith('/api/admin') && user?.user_metadata?.['role'] !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/api/stories/:path*',
    '/api/admin/:path*'
  ]
}