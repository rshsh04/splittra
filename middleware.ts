import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  console.log('Middleware: Processing request to', pathname)

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Allow admin login page
    if (pathname === '/admin/login') {
      console.log('Middleware: Allowing admin login page')
      return NextResponse.next()
    }

    console.log('Middleware: Checking admin access for', pathname)

    let res = NextResponse.next({ request: { headers: req.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    })

    try {
      // Refresh the session to ensure we have the latest auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Middleware: Session check', { session: session?.user?.id, sessionError })
      
      if (sessionError || !session?.user) {
        console.log('Middleware: No valid session, redirecting to login')
        const url = req.nextUrl.clone()
        url.pathname = '/admin/login'
        url.searchParams.set('error', 'auth_failed')
        return NextResponse.redirect(url)
      }

      const user = session.user

      // Check admin role with the same query as AdminContext
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, name, email, is_admin, created_at')
        .eq('auth_id', user.id)
        .single()

      console.log('Middleware: Profile check', { userProfile, profileError, userId: user.id })

      if (profileError || !userProfile || !userProfile.is_admin) {
        console.log('Middleware: Access denied', { profileError, userProfile })
        const url = req.nextUrl.clone()
        url.pathname = '/admin/login'
        url.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(url)
      }

      console.log('Middleware: Access granted for admin user', userProfile.id)
      return res
    } catch (error) {
      console.error('Middleware error:', error)
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'system_error')
      return NextResponse.redirect(url)
    }
  }

  if (pathname === '/signup' || pathname === '/login') {
    let res = NextResponse.next({ request: { headers: req.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    const url = req.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/signup'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
