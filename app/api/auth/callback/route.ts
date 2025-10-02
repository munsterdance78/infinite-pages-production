import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/my-library'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log('[Callback] Get cookie:', name, value ? 'exists' : 'missing')
            return value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('[Callback] Set cookie:', name, 'length:', value.length)
            try {
              cookieStore.set({
                name,
                value,
                ...options,
                path: '/',
                sameSite: 'lax',
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production'
              })
            } catch (err) {
              console.error('[Callback] Failed to set cookie:', err)
            }
          },
          remove(name: string, options: CookieOptions) {
            console.log('[Callback] Remove cookie:', name)
            cookieStore.delete(name)
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Callback] Exchange result:', {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message
    })

    if (!error && data?.session) {
      console.log('[Callback] Session user:', data.user?.email)
      console.log('[Callback] All cookies after exchange:', cookieStore.getAll().map(c => c.name))
      console.log('[Callback] Success, redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[Callback] Error:', error)
  }

  // Return to signin if error
  return NextResponse.redirect(`${origin}/auth/signin`)
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