import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Client-side Supabase client
 * Uses exact environment variables from Vercel
 */
export const createClient = () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'infinite-pages-v3-auth'
    },
    global: {
      headers: {
        'X-Client-Info': 'infinite-pages-v3'
      }
    }
  })
}

/**
 * Service role client for admin operations
 * Uses SERVICE_ROLE_KEY for bypassing RLS
 */
export const createServiceClient = () => {
  return createServiceRoleClient()
}

export const createServiceRoleClient = () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'infinite-pages-v3-service'
      }
    }
  })
}

// Export default client for convenience
export const supabase = createClient()