import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a singleton client for use throughout the app
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null
let instanceCount = 0

const createSupabaseInstance = () => {
  instanceCount++
  if (instanceCount > 1) {
    console.warn(`[Supabase] Multiple client instances detected (${instanceCount}). Using singleton pattern.`)
    console.trace('[Supabase] Call stack for multiple instance detection:')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: false, // Disable auth debug to reduce noise
      storageKey: 'infinite-pages-auth' // Use custom storage key to avoid conflicts
    },
    global: {
      headers: {
        'X-Client-Info': 'infinite-pages-web'
      }
    }
  })
}

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseInstance()
  }
  return supabaseClient
}

export const getSupabaseClient = () => {
  return createClient()
}

// Export the client directly for convenience
// RECOMMENDED: Use this pre-exported client instead of calling createClient()
export const supabase = createClient()

// For compatibility with existing code
export default supabase