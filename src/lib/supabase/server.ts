import { createPagesServerClient as createSupabaseServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createClient() {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  )
}

// Keep the old export for backward compatibility
export const createServerClient = () =>
  createSupabaseServerClient<Database>({
    cookies
  })