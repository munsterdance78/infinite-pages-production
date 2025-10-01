import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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
      supabase = createRouteHandlerClient<Database>({ cookies })
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user || error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES?.UNAUTHORIZED || 'Authentication required' },
        { status: 401 }
      )
    }

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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== 'admin') {
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_creator, creator_tier')
      .eq('id', user.id)
      .single()

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