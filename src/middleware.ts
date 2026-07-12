import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─────────────────────────────────────────────
// Konstanta route
// ─────────────────────────────────────────────

const PUBLIC_ROUTES = ['/login', '/login/ortu', '/login/staff', '/maintenance']

import { ROLE_HOME_PATHS } from '@/lib/constants'

/** Prefix route yang boleh diakses per-role */
const ROLE_PREFIX: Record<string, string> = {
  tu:          '/tu',
  koordinator: '/koordinator',
  pengampu:    '/pengampu',
  kepsek:      '/kepsek',
  orang_tua:   '/ortu',
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function url(path: string, req: NextRequest): URL {
  return new URL(path, req.url)
}


// ─────────────────────────────────────────────
// Middleware utama
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Buat Supabase SSR client untuk session refresh (anon key)
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (PENTING: harus dipanggil sebelum cek user)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Baca role dari cookie (diset saat login via Server Action)
  const roleCookie = request.cookies.get('x-user-role')?.value ?? null

  // ── Aturan: root "/" redirect ke /login ──
  if (pathname === '/') {
    return NextResponse.redirect(url('/login', request))
  }

  // ── Aturan: jika sudah login dan mengakses /login/staff (bukan /login) ──
  // Orang tua yang salah buka /login/staff → redirect ke /login
  if (pathname === '/login/staff' && user && roleCookie === 'orang_tua') {
    return NextResponse.redirect(url('/login', request))
  }

  // ── Aturan: jika sudah login dan mengakses halaman login → redirect ke beranda ──
  if ((pathname === '/login' || pathname === '/login/ortu' || pathname === '/login/staff') && user && roleCookie) {
    const home = ROLE_HOME_PATHS[roleCookie] ?? '/login'
    return NextResponse.redirect(url(home, request))
  }

  // ── Aturan: public routes boleh diakses tanpa login ──
  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  if (isPublic) {
    return response
  }

  // ── Aturan: protected route tapi tidak login → redirect ke /login ──
  if (!user || !roleCookie) {
    const loginPath = pathname.startsWith('/ortu') ? '/login' : '/login/staff'
    return NextResponse.redirect(url(loginPath, request))
  }

  // ── Aturan: cek maintenance mode (anon key — publicly readable via RLS) ──
  // Hanya jalankan untuk user non-TU agar TU tetap bisa akses
  if (roleCookie !== 'tu' && !pathname.startsWith('/maintenance')) {
    let maintenanceMode = false
    let maintenanceCheckFailed = false

    try {
      const { data: config, error } = await supabase
        .from('konfigurasi')
        .select('maintenance_mode')
        .single()
      
      if (error) throw error
      maintenanceMode = config?.maintenance_mode ?? false
    } catch {
      maintenanceCheckFailed = true
    }

    // Fail-closed: if we couldn't verify the status, treat as maintenance active
    if (maintenanceMode || maintenanceCheckFailed) {
      return NextResponse.redirect(url('/maintenance', request))
    }
  }

  // ── Aturan: role-based route protection ──
  const allowedPrefix = ROLE_PREFIX[roleCookie]

  if (!allowedPrefix) {
    // Role tidak dikenal → logout ke login
    return NextResponse.redirect(url('/login', request))
  }

  if (!pathname.startsWith(allowedPrefix)) {
    // User mengakses route yang bukan miliknya → redirect ke berandanya sendiri
    const home = ROLE_HOME_PATHS[roleCookie] ?? '/login'
    return NextResponse.redirect(url(home, request))
  }

  return response
}

// ─────────────────────────────────────────────
// Matcher — exclude static assets
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|workbox-.*\\.js|worker-.*\\.js|fallback-.*\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
