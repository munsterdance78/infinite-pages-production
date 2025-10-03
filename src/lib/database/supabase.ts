import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

/**
 * Client-side Supabase client
 * Uses default cookie handling for better SSR compatibility
 */
export const createClient = () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Use default cookie handling for better compatibility with SSR auth callback
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

/**
 * Service role client for admin operations
 * Uses SERVICE_ROLE_KEY for bypassing RLS
 */
export const createServiceClient = () => {
  return createServiceRoleClient()
}

export const createServiceRoleClient = () => {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'infinite-pages-v3-service'
      }
    }
  }) as ReturnType<typeof createBrowserClient<Database>>
}

// Export default client for convenience
export const supabase = createClient()