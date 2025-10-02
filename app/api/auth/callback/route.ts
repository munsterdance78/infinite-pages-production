import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[Auth Callback] Received request with code:', code ? 'YES' : 'NO')
  console.log('[Auth Callback] Origin:', requestUrl.origin)
  console.log('[Auth Callback] All cookies:', request.cookies.getAll().map(c => c.name))

  if (!code) {
    console.error('[Auth Callback] No code provided, redirecting to signin')
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code`)
  }

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  console.log('[Auth Callback] Supabase URL:', supabaseUrl)

  // Create response first so we can use it for cookie storage
  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  try {
    // Create Supabase client with cookie storage that reads from request and writes to response
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'infinite-pages-v3-auth',
        storage: {
          getItem: async (key: string) => {
            const cookie = request.cookies.get(key)
            console.log('[Auth Callback] Getting cookie:', key, cookie ? 'found' : 'not found')
            return cookie?.value ?? null
          },
          setItem: async (key: string, value: string) => {
            console.log('[Auth Callback] Setting cookie:', key)
            response.cookies.set({
              name: key,
              value: value,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false,
              maxAge: 60 * 60 * 24 * 7 // 7 days
            })
          },
          removeItem: async (key: string) => {
            console.log('[Auth Callback] Removing cookie:', key)
            response.cookies.delete(key)
          }
        }
      }
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Auth Callback] Exchange result:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message
    })

    if (error) {
      console.error('[Auth Callback] Token exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error.message || 'token_exchange_failed')}`)
    }

    if (!data?.session) {
      console.error('[Auth Callback] No session received')
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_session`)
    }

    console.log('[Auth Callback] Session established successfully')
    console.log('[Auth Callback] User:', data.user?.email)
    console.log('[Auth Callback] Cookies should now be set via storage handlers')

    return response

  } catch (err) {
    console.error('[Auth Callback] Exception:', err)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback_exception`)
  }
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