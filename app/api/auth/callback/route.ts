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
    // Exchange code for session
    const { data, error } = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        auth_code: code
      })
    }).then(res => res.json())

    if (error) {
      console.error('[Auth Callback] Token exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error.message || 'token_exchange_failed')}`)
    }

    if (!data?.access_token) {
      console.error('[Auth Callback] No access token received')
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_access_token`)
    }

    console.log('[Auth Callback] Session established successfully')
    console.log('[Auth Callback] User:', data.user?.email)

    // Set the session cookies manually
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    // Set access token
    response.cookies.set('sb-tktntttemkbmnqkalkch-auth-token', JSON.stringify(data), {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      maxAge: data.expires_in || 60 * 60 * 24 * 7
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