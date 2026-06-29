'use client'

import './ortu.css'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Phone, BookOpen, Loader2, AlertCircle, Info,
} from 'lucide-react'
import { loginWithPhone } from '@/lib/actions/auth'
import type { LoginResult } from '@/lib/actions/auth'

// ─────────────────────────────────────────────
// SubmitButton — komponen terpisah agar bisa
// memakai useFormStatus dari react-dom
// ─────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-login-ortu"
      type="submit"
      disabled={pending}
      className="btn-ortu-primary"
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
// Menghindari mismatch server ↔ client
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
// Halaman Login Nomor HP (Orang Tua)
// ─────────────────────────────────────────────

export default function LoginOrtuPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction] = useFormState<LoginResult | null, FormData>(
    loginWithPhone,
    null
  )

  // Redirect ke /ortu/beranda setelah login berhasil
  useEffect(() => {
    if (state?.success) {
      router.replace('/ortu/beranda')
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
            Portal Orang Tua / Wali Santri
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
            Masuk sebagai Orang Tua
          </h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Gunakan nomor HP yang terdaftar di sistem
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

            {/* Nomor HP field */}
            <div>
              <label
                htmlFor="nomor_hp"
                style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Nomor HP
              </label>
              <div style={{ position: 'relative' }}>
                <Phone style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 15, height: 15, color: '#9CA3AF',
                }} />
                <input
                  id="nomor_hp"
                  name="nomor_hp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  placeholder="08xxxxxxxxxx"
                  pattern="[0-9]{10,15}"
                  className="focus-input-ortu"
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
              {/* Hint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                <Info style={{ width: 11, height: 11, color: '#9CA3AF', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  Ketik angka saja, tanpa spasi atau tanda +
                </span>
              </div>
            </div>

            <SubmitButton />
          </form>

          {/* Info box */}
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
          }}>
            <p style={{ fontSize: 12, color: '#065F46', margin: 0, lineHeight: 1.5 }}>
              <strong>Pertama kali masuk?</strong> Password Anda diatur otomatis oleh sistem.
              Hubungi Staff TU jika mengalami kesulitan.
            </p>
          </div>

          {/* Divider + link staff */}
          <div style={{
            marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5E7EB',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
              Staff Sekolah?{' '}
              <a
                href="/login"
                className="link-ortu-emerald"
                style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none' }}
              >
                Masuk dengan Email
              </a>
            </p>
          </div>
        </div>

        {/* Footer tahun — client-only */}
        <FooterYear />
      </div>
    </>
  )
}
