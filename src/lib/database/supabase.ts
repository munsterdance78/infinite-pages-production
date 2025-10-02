import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

/**
 * Client-side Supabase client
 * Uses cookies for session storage (compatible with SSR auth callback)
 */
export const createClient = () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Only use custom cookie handlers in browser
  if (typeof window !== 'undefined') {
    return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='))
            ?.split('=')[1]

          if (value && value.startsWith('base64-')) {
            // Handle base64 encoded cookies from SSR
            try {
              return atob(value.substring(7))
            } catch (e) {
              console.error('[Client] Failed to decode base64 cookie:', name)
              return value
            }
          }
          return value
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 604800}; SameSite=Lax${options.secure ? '; Secure' : ''}`
        },
        remove(name: string) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      }
    })
  }

  // Server-side: use default behavior
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