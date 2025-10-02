import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import type { AuthResult, AuthenticatedRequest } from './types'
import type { Database } from '@/lib/supabase/types'

/**
 * Consolidated authentication middleware for API routes
 * Replaces 45+ duplicate authentication patterns across the platform
 *
 * @param request - The incoming NextRequest
 * @returns AuthenticatedRequest with user and supabase client, or NextResponse error
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract Bearer token from Authorization header if present
    const authHeader = request.headers.get('authorization')
    let supabase

    if (authHeader?.startsWith('Bearer ')) {
      // Header-based auth (for API tests and external requests)
      const token = authHeader.substring(7)
      console.log('[Auth] Token length:', token.length)

      // Create a client that uses the provided token
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
      const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
    } else {
      // Cookie-based auth (for browser requests)
      const cookieStore = cookies()
      supabase = createServerClient<Database>(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
        {
          cookies: {
            get(name: string) {
              const cookie = cookieStore.get(name)
              if (!cookie) return undefined

              let value = cookie.value

              // Handle base64-prefixed cookies from SSR
              if (value && value.startsWith('base64-')) {
                try {
                  value = Buffer.from(value.substring(7), 'base64').toString('utf-8')
                } catch (e) {
                  console.error('[Auth Middleware] Failed to decode base64 cookie:', name, e)
                  return undefined
                }
              }

              return value
            },
            set(name: string, value: string, options: CookieOptions) {
              try {
                cookieStore.set({
                  name,
                  value,
                  ...options,
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production'
                })
              } catch (error) {
                // Cookie setting can fail in route handlers after response started
                console.log('[Auth Middleware] Cookie set attempted after response:', name)
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                cookieStore.set({
                  name,
                  value: '',
                  ...options,
                  maxAge: 0
                })
              } catch (error) {
                // Cookie removal can fail in route handlers after response started
                console.log('[Auth Middleware] Cookie remove attempted after response:', name)
              }
            },
          },
        }
      )
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    // Debug logging
    console.log('[Auth Middleware] Request:', request.url)
    console.log('[Auth Middleware] Has user:', !!user)
    console.log('[Auth Middleware] User ID:', user?.id)
    console.log('[Auth Middleware] Error:', error?.message)

    if (error) {
      console.error('[Auth Middleware] Auth error details:', error)
    }

    if (!user || error) {
      console.log('[Auth Middleware] Returning 401 - no valid user')
      return NextResponse.json(
        { error: ERROR_MESSAGES?.UNAUTHORIZED || 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[Auth Middleware] Authentication successful for user:', user.email)

    return {
      user,
      supabase
    } as AuthenticatedRequest
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication system error' },
      { status: 500 }
    )
  }
}

/**
 * Admin-only authentication middleware
 * Requires user to be authenticated AND have admin privileges
 *
 * @param request - The incoming NextRequest
 * @returns AuthenticatedRequest with admin user, or NextResponse error
 */
export async function requireAdminAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult // Return auth error
  }

  const { user, supabase } = authResult

  try {
    // Check if user has admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const profile = profileData as { is_admin: boolean } | null

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return authResult
  } catch (error) {
    console.error('Admin authentication error:', error)
    return NextResponse.json(
      { error: 'Authorization system error' },
      { status: 500 }
    )
  }
}

/**
 * Creator-only authentication middleware
 * Requires user to be authenticated AND have creator privileges
 *
 * @param request - The incoming NextRequest
 * @returns AuthenticatedRequest with creator user, or NextResponse error
 */
export async function requireCreatorAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult // Return auth error
  }

  const { user, supabase } = authResult

  try {
    // Check if user has creator permissions
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_creator, creator_tier')
      .eq('id', user.id)
      .single()

    const profile = profileData as { is_creator: boolean; creator_tier: string } | null

    if (!profile?.is_creator) {
      return NextResponse.json(
        { error: 'Creator access required' },
        { status: 403 }
      )
    }

    return authResult
  } catch (error) {
    console.error('Creator authentication error:', error)
    return NextResponse.json(
      { error: 'Creator authorization system error' },
      { status: 500 }
    )
  }
}