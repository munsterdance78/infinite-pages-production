import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[Auth Callback] Received request with code:', code ? 'YES' : 'NO')
  console.log('[Auth Callback] Origin:', requestUrl.origin)

  if (!code) {
    console.error('[Auth Callback] No code provided, redirecting to signin')
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code`)
  }

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  console.log('[Auth Callback] Supabase URL:', supabaseUrl)

  try {
    // Exchange code for session using Supabase SDK
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
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

    // Set the session cookies manually with the exact format Supabase client expects
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    // Construct the session token that matches what the client SDK expects
    const sessionToken = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: 'bearer',
      user: data.user
    }

    // Set the cookie with the storage key that matches client config
    response.cookies.set('sb-tktntttemkbmnqkalkch-auth-token', JSON.stringify(sessionToken), {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      maxAge: data.session.expires_in || 60 * 60 * 24 * 7
    })

    console.log('[Auth Callback] Cookies set, redirecting to dashboard')
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