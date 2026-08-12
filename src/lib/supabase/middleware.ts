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
  // Everything else (marketing pages, robots.txt, sitemap.xml, unmatched routes)
  // is allowed to reach Next.js so it can render the correct page or a real 404.
  const protectedPrefixes = [
    '/cases',
    '/inventory',
    '/patients',
    '/viewer',
    '/lab-directory',
  ]

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Root always sends to /landing so crawlers land on real content.
  if (pathname === '/' && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/landing'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
