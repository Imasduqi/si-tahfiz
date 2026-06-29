import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─────────────────────────────────────────────
// Konstanta route
// ─────────────────────────────────────────────

const PUBLIC_ROUTES = ['/login', '/login/ortu', '/maintenance']

/** Halaman beranda per-role setelah login */
const ROLE_HOME: Record<string, string> = {
  tu:          '/tu/akun',
  koordinator: '/koordinator/beranda',
  pengampu:    '/pengampu/beranda',
  kepsek:      '/kepsek/dashboard',
  ortu:        '/ortu/beranda',
}

/** Prefix route yang boleh diakses per-role */
const ROLE_PREFIX: Record<string, string> = {
  tu:          '/tu',
  koordinator: '/koordinator',
  pengampu:    '/pengampu',
  kepsek:      '/kepsek',
  ortu:        '/ortu',
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function url(path: string, req: NextRequest): URL {
  return new URL(path, req.url)
}

/** Buat Supabase client dengan service role key — bypass RLS, aman untuk middleware */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // Middleware berjalan di Edge — tidak perlu cookie handling untuk client ini
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
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

  // ── Aturan: jika sudah login dan mengakses /login (bukan /login/ortu) ──
  // Orang tua yang salah buka /login → redirect ke /login/ortu
  if (pathname === '/login' && user && roleCookie === 'ortu') {
    return NextResponse.redirect(url('/login/ortu', request))
  }

  // ── Aturan: jika sudah login dan mengakses halaman login → redirect ke beranda ──
  if ((pathname === '/login' || pathname === '/login/ortu') && user && roleCookie) {
    const home = ROLE_HOME[roleCookie] ?? '/login'
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
    const loginPath = pathname.startsWith('/ortu') ? '/login/ortu' : '/login'
    return NextResponse.redirect(url(loginPath, request))
  }

  // ── Aturan: cek maintenance mode (service role key — bypass RLS) ──
  // Hanya jalankan untuk user non-TU agar TU tetap bisa akses
  if (roleCookie !== 'tu' && !pathname.startsWith('/maintenance')) {
    try {
      const serviceClient = createServiceClient()
      const { data: config } = await serviceClient
        .from('konfigurasi')
        .select('maintenance_mode')
        .single()

      if (config?.maintenance_mode === true) {
        return NextResponse.redirect(url('/maintenance', request))
      }
    } catch {
      // Jika gagal query, biarkan akses berlanjut (fail-open)
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
    const home = ROLE_HOME[roleCookie] ?? '/login'
    return NextResponse.redirect(url(home, request))
  }

  return response
}

// ─────────────────────────────────────────────
// Matcher — exclude static assets
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
