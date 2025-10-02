import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // If there's an error from the OAuth provider
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Default redirect after successful auth
  const next = searchParams.get('next') ?? '/my-library'

  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    // Redirect to signin with error
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log('[Auth Callback] Get cookie:', name, value ? 'exists' : 'missing')
            return value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('[Auth Callback] Set cookie:', name, 'length:', value.length)
            try {
              cookieStore.set({
                name,
                value,
                ...options,
                path: '/',
                sameSite: 'lax',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
              })
            } catch (err) {
              console.error('[Auth Callback] Failed to set cookie:', err)
            }
          },
          remove(name: string, options: CookieOptions) {
            console.log('[Auth Callback] Remove cookie:', name)
            try {
              cookieStore.set({
                name,
                value: '',
                ...options,
                path: '/',
                maxAge: 0
              })
            } catch (err) {
              console.error('[Auth Callback] Failed to remove cookie:', err)
            }
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Auth Callback] Exchange result:', {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userEmail: data?.user?.email,
      error: exchangeError?.message
    })

    if (!exchangeError && data?.session) {
      console.log('[Auth Callback] Session established for:', data.user?.email)
      console.log('[Auth Callback] Redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[Auth Callback] Exchange error:', exchangeError)
  }

  // Return to signin if error or no code
  console.log('[Auth Callback] No valid code, redirecting to signin')
  return NextResponse.redirect(`${origin}/auth/signin`)
}
