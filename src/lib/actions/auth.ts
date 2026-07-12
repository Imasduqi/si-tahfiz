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

import { ROLE_HOME_PATHS } from '@/lib/constants'

function getRoleHomePath(role: string): string {
  return ROLE_HOME_PATHS[role] ?? '/login'
}

// ─────────────────────────────────────────────
// UC-001: Login Email (TU, Koordinator, Pengampu, Kepsek)
// ─────────────────────────────────────────────

export async function loginWithEmail(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email    = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  // Validasi field kosong
  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const supabase = await createClient()

  // ── STEP 1 ──────────────────────────────────
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: 'Email/Nomor HP atau password salah' }
  }

  // ── STEP 4 ──────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { success: false, error: 'Email/Nomor HP atau password salah' }
  }

  const role = profile.role as string

  // Set cookie role agar middleware bisa membacanya
  await setRoleCookie(role)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        aktivitas: `Login sebagai ${profile.role} — ${email}`
      })
    }
  } catch {
    // silently ignore — login must not fail because of audit logging
  }

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
    return { success: false, error: 'Email/Nomor HP atau password salah' }
  }

  // After successful auth, verify the orang_tua record actually exists
  // rather than assuming role='orang_tua' just because this function was called
  const { data: ortuProfile, error: ortuError } = await supabase
    .from('orang_tua')
    .select('id')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (ortuError || !ortuProfile) {
    await supabase.auth.signOut()
    return { success: false, error: 'Email/Nomor HP atau password salah' }
  }

  // role confirmed as 'orang_tua' via actual database check, not assumption
  // Set cookie role = 'orang_tua'
  await setRoleCookie('orang_tua')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        aktivitas: `Login sebagai orang_tua — ${nomorHP}`
      })
    }
  } catch {
    // silently ignore — login must not fail because of audit logging
  }

  return { success: true, role: 'orang_tua' }
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
  const destination = role === 'orang_tua' ? '/login/ortu' : '/login'
  redirect(destination)
}

// ─────────────────────────────────────────────
// Helper: redirect ke beranda setelah login (dipanggil dari client)
// ─────────────────────────────────────────────

export async function redirectAfterLogin(role: string) {
  redirect(getRoleHomePath(role))
}
