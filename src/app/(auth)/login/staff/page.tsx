'use client'

import '../login.css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Mail, Lock, BookOpen, Loader2, AlertCircle,
} from 'lucide-react'
import { loginWithEmail } from '@/lib/actions/auth'
import type { LoginResult } from '@/lib/actions/auth'

// ─────────────────────────────────────────────
// Redirect map
// ─────────────────────────────────────────────

const ROLE_HOME: Record<string, string> = {
  tu:          '/tu/akun',
  koordinator: '/koordinator/beranda',
  pengampu:    '/pengampu/beranda',
  kepsek:      '/kepsek/dashboard',
}

// ─────────────────────────────────────────────
// SubmitButton — komponen terpisah agar bisa
// memakai useFormStatus dari react-dom
// ─────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-login-email"
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        padding: '12px 20px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        backgroundColor: '#10B981',
        color: '#FFFFFF',
        border: 'none',
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? (
        <>
          <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
          Memproses…
        </>
      ) : (
        'Masuk'
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
// FooterYear — render tahun hanya di client
// ─────────────────────────────────────────────

function FooterYear() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 28 }}>
      &copy;{year !== null ? ` ${year}` : ''} MTs TQ Jamilurrahman Yogyakarta
    </p>
  )
}

// ─────────────────────────────────────────────
// Halaman Login Email (Staff)
// ─────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction] = useFormState<LoginResult | null, FormData>(
    loginWithEmail,
    null
  )

  // Redirect setelah login berhasil
  useEffect(() => {
    if (state?.success && state.role) {
      const destination = ROLE_HOME[state.role] ?? '/login'
      router.replace(destination)
    }
  }, [state, router])

  return (
    <>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#F9FAFB',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        {/* Brand header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            margin: '0 auto 12px',
          }}>
            <BookOpen style={{ width: 28, height: 28, color: '#FFFFFF' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            SI-Tahfiz
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            MTs TQ Jamilurrahman Yogyakarta
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 400,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Masuk ke Akun
          </h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Untuk Staff TU, Koordinator, Pengampu &amp; Kepala Sekolah
          </p>

          <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error alert — state dimulai null, tidak ada mismatch */}
            {state && !state.success && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: 13,
              }}>
                <AlertCircle style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />
                <span>{state.error}</span>
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 15, height: 15, color: '#9CA3AF',
                }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nama@email.com"
                  className="focus-input"
                  style={{
                    width: '100%',
                    paddingLeft: 38,
                    paddingRight: 14,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                    color: '#111827',
                    fontSize: 14,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 15, height: 15, color: '#9CA3AF',
                }} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="focus-input"
                  style={{
                    width: '100%',
                    paddingLeft: 38,
                    paddingRight: 42,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                    color: '#111827',
                    fontSize: 14,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: '#9CA3AF', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 15, height: 15 }} />
                    : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <SubmitButton />
          </form>

          {/* Divider + link ortu */}
          <div style={{
            marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5E7EB',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
              Orang Tua / Wali?{' '}
              <Link
                href="/login"
                className="link-emerald"
                style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none' }}
              >
                Login sebagai Orang Tua
              </Link>
            </p>
          </div>
        </div>

        {/* Footer tahun — client-only */}
        <FooterYear />
      </div>
    </>
  )
}
