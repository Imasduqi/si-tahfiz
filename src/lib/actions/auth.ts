'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LoginResult =
  | { success: true; role: string }
  | { success: false; error: string }

// ─────────────────────────────────────────────
// Cookie helper
// ─────────────────────────────────────────────

const ROLE_COOKIE = 'x-user-role'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 hari
}

async function setRoleCookie(role: string) {
  const cookieStore = await cookies()
  cookieStore.set(ROLE_COOKIE, role, cookieOptions)
}

async function clearRoleCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(ROLE_COOKIE)
}

async function getRoleCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ROLE_COOKIE)?.value ?? null
}

// ─────────────────────────────────────────────
// Redirect berdasarkan role
// ─────────────────────────────────────────────

function getRoleHomePath(role: string): string {
  switch (role) {
    case 'tu':          return '/tu/akun'
    case 'koordinator': return '/koordinator/beranda'
    case 'pengampu':    return '/pengampu/beranda'
    case 'kepsek':      return '/kepsek/dashboard'
    case 'ortu':        return '/ortu/beranda'
    default:            return '/login'
  }
}

// ─────────────────────────────────────────────
// UC-001: Login Email (TU, Koordinator, Pengampu, Kepsek)
// ─────────────────────────────────────────────

export async function loginWithEmail(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email    = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  // Validasi field kosong
  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const supabase = await createClient()

  // ── STEP 1 ──────────────────────────────────
  console.log('1. Mencoba signInWithPassword...', { email })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('2. Result:', {
    user: data?.user ? { id: data.user.id, email: data.user.email, confirmed: data.user.confirmed_at } : null,
    session: data?.session ? 'OK' : null,
    error,
  })

  if (error) {
    console.log('3. Error detail:', error.message, error.status)
    return { success: false, error: 'Email atau password salah.' }
  }

  // ── STEP 4 ──────────────────────────────────
  console.log('4. User ID:', data.user.id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()
  console.log('5. Profile result:', { profile, profileError })

  if (profileError || !profile) {
    console.log('6. Profile tidak ditemukan — signOut dan return error')
    await supabase.auth.signOut()
    return { success: false, error: 'Akun tidak ditemukan. Hubungi Staff TU.' }
  }

  const role = profile.role as string
  console.log('7. Login berhasil — role:', role)

  // Set cookie role agar middleware bisa membacanya
  await setRoleCookie(role)

  return { success: true, role }
}

// ─────────────────────────────────────────────
// UC-002: Login Nomor HP (Orang Tua)
// ─────────────────────────────────────────────

export async function loginWithPhone(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const nomorHP = (formData.get('nomor_hp') as string)?.trim()

  // Validasi field kosong
  if (!nomorHP) {
    return { success: false, error: 'Nomor HP wajib diisi.' }
  }

  // Validasi format nomor HP
  if (!/^\d{10,15}$/.test(nomorHP)) {
    return { success: false, error: 'Nomor HP tidak valid. Gunakan angka tanpa spasi (min. 10 digit).' }
  }

  // Konversi nomor HP ke format email palsu (UC-002)
  const email = `${nomorHP}@ortu.sitahfiz`

  // Password digenerate otomatis di server — format: TAHFIZ_{nomorHP}
  const password = `TAHFIZ_${nomorHP}`

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { success: false, error: 'Nomor HP tidak terdaftar. Hubungi Staff TU.' }
  }

  // Set cookie role = 'ortu'
  await setRoleCookie('ortu')

  return { success: true, role: 'ortu' }
}

// ─────────────────────────────────────────────
// UC-003: Logout (semua role)
// ─────────────────────────────────────────────

export async function logout() {
  // Baca role sebelum signOut agar redirect benar
  const role = await getRoleCookie()

  const supabase = await createClient()
  await supabase.auth.signOut()

  // Hapus cookie role
  await clearRoleCookie()

  // Redirect sesuai role terakhir (UC-003)
  const destination = role === 'ortu' ? '/login/ortu' : '/login'
  redirect(destination)
}

// ─────────────────────────────────────────────
// Helper: redirect ke beranda setelah login (dipanggil dari client)
// ─────────────────────────────────────────────

export async function redirectAfterLogin(role: string) {
  redirect(getRoleHomePath(role))
}
