import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Explicitly protected dashboard prefixes — only redirect to /login for these.
  const protectedPrefixes = [
    '/cases',
    '/inventory',
    '/patients',
    '/viewer',
    '/lab-directory',
    '/billing',
    '/visits',
  ]

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is already authenticated and visits /login, redirect to / (dashboard)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Serve the landing page CONTENT at the root URL for unauthenticated visitors
  // using a rewrite (HTTP 200), not a redirect. The homepage is the highest-authority
  // URL on the domain; a redirect makes it show up in Search Console as "Page with
  // redirect" and forces an extra hop. A rewrite keeps `/` a real 200 page whose
  // canonical tag (emitted by the /landing route) points to /landing, so authority
  // consolidates cleanly with no redirect. Authenticated users fall through to the
  // dashboard, so this guard is scoped strictly to `!user`.
  if (pathname === '/' && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/landing'
    const rewriteResponse = NextResponse.rewrite(url, { request })
    // Preserve any auth cookies Supabase refreshed while resolving the session.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie)
    })
    return rewriteResponse
  }

  return supabaseResponse
}
