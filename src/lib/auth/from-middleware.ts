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
 * Uses service role key for admin operations (or anon key as fallback)
 */
export function createServiceClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  console.log('[Service Client] URL:', supabaseUrl)
  console.log('[Service Client] Service key present:', !!supabaseServiceKey)
  console.log('[Service Client] Service key first 20 chars:', supabaseServiceKey?.substring(0, 20))
  console.log('[Service Client] Anon key present:', !!supabaseAnonKey)
  console.log('[Service Client] Anon key first 20 chars:', supabaseAnonKey?.substring(0, 20))

  if (!supabaseUrl) {
    const error = new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    console.error('[Service Client] Error:', error)
    throw error
  }

  if (!supabaseServiceKey) {
    const error = new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
    console.error('[Service Client] Error:', error)
    throw error
  }

  try {
    console.log('[Service Client] Creating client with service role key...')
    const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('[Service Client] Successfully created with service role')
    return client
  } catch (error) {
    console.error('[Service Client] Failed to create client:', error)
    console.error('[Service Client] Error details:', JSON.stringify(error, null, 2))
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
