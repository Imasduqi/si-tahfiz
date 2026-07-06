'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ArrowLeft, ShieldCheck,
} from 'lucide-react'
import { loginWithEmail } from '@/lib/actions/auth'
import type { LoginResult } from '@/lib/actions/auth'

const ROLE_HOME: Record<string, string> = {
  tu:          '/tu/akun',
  koordinator: '/koordinator/beranda',
  pengampu:    '/pengampu/beranda',
  kepsek:      '/kepsek/dashboard',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-login-email"
      type="submit"
      disabled={pending}
      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group ${pending ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
      style={{ background: 'linear-gradient(135deg, #228B22 0%, #2EA82E 60%, #3DB33D 100%)', boxShadow: '0 4px 20px rgba(34,139,34,0.35)' }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none rounded-2xl" />
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin relative z-10" />
          <span className="relative z-10">Memproses…</span>
        </>
      ) : (
        <span className="relative z-10 tracking-wide">Masuk Sekarang</span>
      )}
    </button>
  )
}

export default function StaffLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [year, setYear] = useState<number | null>(null)

  const [state, formAction] = useFormState<LoginResult | null, FormData>(loginWithEmail, null)

  useEffect(() => { setYear(new Date().getFullYear()) }, [])

  useEffect(() => {
    if (state?.success && state.role) {
      const destination = ROLE_HOME[state.role] ?? '/login'
      router.replace(destination)
    }
  }, [state, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#FFFFF0' }}>

      {/* Background pattern */}
      <div className="absolute inset-0 bg-hex-light pointer-events-none" />

      {/* Evergreen decorative panel — top-left corner */}
      <div className="absolute top-0 left-0 w-[45vw] h-[45vh] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #228B22 0%, #1E7A1E 100%)', borderBottomRightRadius: '60% 80%', opacity: 0.12 }} />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] pointer-events-none"
        style={{ background: 'linear-gradient(315deg, #228B22 0%, #1E7A1E 100%)', borderTopLeftRadius: '60% 80%', opacity: 0.08 }} />

      {/* Decorative circles */}
      <div className="absolute top-8 right-8 w-48 h-48 border-2 rounded-full animate-spin-slow pointer-events-none" style={{ borderColor: 'rgba(34,139,34,0.08)' }} />
      <div className="absolute bottom-12 left-12 w-32 h-32 border rounded-full animate-spin-slow pointer-events-none" style={{ borderColor: 'rgba(34,139,34,0.06)', animationDuration: '25s', animationDirection: 'reverse' }} />

      {/* Card wrapper */}
      <div className="w-full max-w-[440px] relative z-10">

        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 transition-all group animate-fade-in-down hover:opacity-80"
          style={{ color: '#228B22' }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-green-50"
            style={{ borderColor: '#C8DFC8', background: '#F0F7F0' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: '#228B22' }} />
          </div>
          <span>Kembali ke Login Orang Tua</span>
        </Link>

        {/* Logo + Brand */}
        <div className="text-center mb-7 animate-fade-in-up animate-delay-100">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-3xl blur-xl animate-pulse-bg" style={{ background: 'rgba(34,139,34,0.2)' }} />
            <div className="relative rounded-3xl p-3 border shadow-xl" style={{ background: '#228B22', borderColor: '#1A6B1A' }}>
              <img src="/logo.png" alt="Logo SI-Tahfiz" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight" style={{ color: '#1C3B1C' }}>
            SI-<span style={{ color: '#228B22' }}>Tahfiz</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: '#6B8B6B' }}>MTs TQ Jamilurrahman Yogyakarta</p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl p-8 animate-scale-in animate-delay-200"
          style={{
            background: '#FFFFFF',
            border: '1px solid #D4E8D4',
            boxShadow: '0 8px 40px rgba(34,139,34,0.1), 0 2px 8px rgba(0,0,0,0.05)',
          }}>

          {/* Card Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 border"
              style={{ background: '#F0F7F0', borderColor: '#C8DFC8' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#228B22' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#228B22' }}>Portal Staff</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#1C3B1C' }}>Masuk ke Akun</h2>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#6B8B6B' }}>
              Untuk Staff TU, Koordinator, Pengampu & Kepala Sekolah
            </p>
          </div>

          <form ref={formRef} action={formAction} className="flex flex-col gap-5">
            {state && !state.success && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border text-sm animate-scale-in"
                style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <span className="font-medium leading-relaxed">{state.error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold" style={{ color: '#2D5A2D' }}>
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: '#6B8B6B' }} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nama@email.com"
                  className="block w-full pl-11 pr-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 focus:outline-none"
                  style={{ background: '#F7F7E8', border: '1.5px solid #D4E8D4', color: '#1C3B1C' }}
                  onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.background = '#FFFFFF' }}
                  onBlur={e => { e.target.style.borderColor = '#D4E8D4'; e.target.style.background = '#F7F7E8' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold" style={{ color: '#2D5A2D' }}>
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: '#6B8B6B' }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 focus:outline-none"
                  style={{ background: '#F7F7E8', border: '1.5px solid #D4E8D4', color: '#1C3B1C' }}
                  onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.background = '#FFFFFF' }}
                  onBlur={e => { e.target.style.borderColor = '#D4E8D4'; e.target.style.background = '#F7F7E8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-opacity hover:opacity-70 focus:outline-none"
                  style={{ color: '#6B8B6B' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <SubmitButton />
            </div>
          </form>

          {/* Switch Role */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid #E8F0E8' }}>
            <p className="text-sm font-medium" style={{ color: '#6B8B6B' }}>
              Orang Tua / Wali?{' '}
              <Link href="/login" className="font-bold hover:opacity-80 transition-opacity" style={{ color: '#228B22' }}>
                Login Orang Tua
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs font-medium text-center mt-5" style={{ color: '#6B8B6B' }}>
          © {year ?? ''} MTs TQ Jamilurrahman Yogyakarta
        </p>
      </div>
    </div>
  )
}
