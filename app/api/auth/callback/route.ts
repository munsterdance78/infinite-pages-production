import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  if (code) {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

    // Create Supabase client with cookie handling for route handlers
    // CRITICAL: Must use same storageKey as client-side client
    const STORAGE_KEY = 'infinite-pages-v3-auth'

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        storageKey: STORAGE_KEY,
        storage: {
          getItem: async (key: string) => {
            const cookieValue = request.cookies.get(key)?.value
            console.log(`[Auth Callback] Getting cookie: ${key} =`, cookieValue ? 'exists' : 'null')
            return cookieValue ?? null
          },
          setItem: async (key: string, value: string) => {
            console.log(`[Auth Callback] Setting cookie: ${key}`)
            response.cookies.set({
              name: key,
              value: value,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false, // CRITICAL: Must be false for client-side access
              maxAge: 60 * 60 * 24 * 7 // 7 days
            })
          },
          removeItem: async (key: string) => {
            console.log(`[Auth Callback] Removing cookie: ${key}`)
            response.cookies.delete(key)
          }
        }
      }
    })

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error.message)}`)
      }

      if (data?.session) {
        console.log('Session established successfully:', data.session.user.email)
      }
    } catch (err) {
      console.error('Auth callback exception:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback_exception`)
    }
  }

  return response
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  })
}