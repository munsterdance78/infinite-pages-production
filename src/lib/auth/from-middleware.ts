import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Get authenticated user from middleware headers
 *
 * IMPORTANT: This should ONLY be used in API routes that are protected by middleware.ts
 * Middleware sets X-User-ID header after authenticating the request.
 *
 * This avoids the double-authentication problem where both middleware and the API route
 * try to read cookies (which fails because they're in different contexts).
 */
export function getUserFromMiddleware(request: NextRequest) {
  const userId = request.headers.get('X-User-ID')
  const userTier = request.headers.get('X-User-Tier')

  if (!userId) {
    console.error('[Auth] Missing X-User-ID header - middleware auth may have failed')
    return null
  }

  console.log('[Auth] Got user from middleware:', userId, 'tier:', userTier)

  return {
    id: userId,
    tier: userTier || 'free'
  }
}

/**
 * Create a Supabase client for server-side API routes
 * Uses service role key for admin operations
 */
export function createServiceClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  console.log('[Service Client] Creating with URL:', supabaseUrl ? 'present' : 'missing')
  console.log('[Service Client] Service key:', supabaseServiceKey ? 'present' : 'missing')

  if (!supabaseUrl || !supabaseServiceKey) {
    const error = new Error('Missing Supabase environment variables')
    console.error('[Service Client] Error:', error)
    throw error
  }

  try {
    const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('[Service Client] Successfully created')
    return client
  } catch (error) {
    console.error('[Service Client] Failed to create client:', error)
    throw error
  }
}

/**
 * Require authentication from middleware
 * Returns user info or 401 response
 */
export function requireMiddlewareAuth(request: NextRequest) {
  const user = getUserFromMiddleware(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  return { user, supabase: createServiceClient() }
}
