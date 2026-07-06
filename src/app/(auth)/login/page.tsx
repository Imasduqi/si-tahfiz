'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Phone, Loader2, AlertCircle, Info, Newspaper, Calendar, ChevronRight, Sparkles, BookOpen
} from 'lucide-react'
import { loginWithPhone } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { BeritaLogin } from '@/types'
import type { LoginResult } from '@/lib/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-login-ortu"
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

function BeritaCard({ berita }: { berita: BeritaLogin }) {
  const [tanggal, setTanggal] = useState('')
  useEffect(() => {
    setTanggal(new Date(berita.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
  }, [berita.created_at])

  return (
    <div className="rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 group cursor-default border border-white/20 bg-white/10">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-green-100 transition-colors">
          {berita.judul}
        </h3>
        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors flex-shrink-0">
          <ChevronRight className="w-3 h-3 text-white/70 group-hover:text-white" />
        </div>
      </div>
      <p className="text-xs text-white/65 mb-3 leading-relaxed line-clamp-2">{berita.isi}</p>
      <div className="flex items-center gap-1.5 bg-white/15 w-fit px-2.5 py-1 rounded-lg">
        <Calendar className="w-3 h-3 text-green-200" />
        <span className="text-[10px] font-semibold text-green-200 uppercase tracking-wide">{tanggal}</span>
      </div>
    </div>
  )
}

/* ── LEFT PANEL (Evergreen #228B22) */
function BeritaPanel({ beritaList, loading }: { beritaList: BeritaLogin[]; loading: boolean }) {
  return (
    <div
      className="hidden lg:flex lg:flex-[0_0_50%] flex-col min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #228B22 0%, #1E7A1E 50%, #145214 100%)' }}
    >
      {/* White hex pattern overlay */}
      <div className="absolute inset-0 bg-hex-white pointer-events-none" />

      {/* Soft light orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-white/8 rounded-full blur-[100px] animate-pulse-bg" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-green-900/30 rounded-full blur-[80px] animate-pulse-bg animate-delay-300" />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-8 right-8 w-40 h-40 border border-white/10 rounded-full animate-spin-slow" />
      <div className="absolute top-14 right-14 w-20 h-20 border border-white/8 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '18s' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
        {/* Logo + Brand */}
        <div className="flex items-center gap-4 mb-14 animate-fade-in-down">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-xl tracking-tight leading-none">SI-Tahfiz</h1>
            <p className="text-green-200/80 text-xs font-medium mt-0.5">MTs TQ Jamilurrahman Yogyakarta</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="mb-10 animate-fade-in-up animate-delay-100">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-green-200" />
            <span className="text-green-100 text-xs font-bold uppercase tracking-widest">Platform Tahfiz Digital</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Sistem<br />
            <span className="text-green-200">Informasi</span><br />
            Manajemen Tahfiz
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Platform terpadu untuk memantau progres hafalan, absensi, dan penilaian santri secara real-time.
          </p>
        </div>

        {/* Berita Feed */}
        <div className="flex-1 animate-fade-in-up animate-delay-200">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-green-200" />
            <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest">Informasi Terbaru</h3>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 scrollbar-hide">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4 animate-pulse bg-white/10 border border-white/15">
                  <div className="h-4 bg-white/15 rounded-lg mb-2 w-3/4" />
                  <div className="h-3 bg-white/10 rounded-lg w-full" />
                </div>
              ))
              : beritaList.length === 0
                ? (
                  <div className="rounded-2xl p-8 text-center bg-white/10 border border-white/15">
                    <BookOpen className="w-8 h-8 text-white/30 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">Belum ada informasi terbaru.</p>
                  </div>
                )
                : beritaList.map((b) => <BeritaCard key={b.id} berita={b} />)
            }
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-xs font-medium mt-8">
          © {new Date().getFullYear()} MTs TQ Jamilurrahman Yogyakarta
        </p>
      </div>
    </div>
  )
}

function FooterYearCenter() {
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => { setYear(new Date().getFullYear()) }, [])
  return (
    <p className="text-xs font-medium text-center mt-5" style={{ color: '#6B8B6B' }}>
      © {year ?? ''} MTs TQ Jamilurrahman Yogyakarta
    </p>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function OrtuLoginPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [beritaList, setBeritaList] = useState<BeritaLogin[]>([])
  const [loadingBerita, setLoadingBerita] = useState(true)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    if (window.matchMedia('(display-mode: standalone)').matches) setShowInstallBanner(false)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setShowInstallBanner(false); setDeferredPrompt(null) }
  }

  const [state, formAction] = useFormState<LoginResult | null, FormData>(loginWithPhone, null)

  useEffect(() => {
    if (state?.success) router.replace('/ortu/beranda')
  }, [state, router])

  useEffect(() => {
    const fetchBerita = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('berita_login')
        .select('judul, isi, created_at, id')
        .order('created_at', { ascending: false })
        .limit(5)
      setBeritaList((data as any) ?? [])
      setLoadingBerita(false)
    }
    fetchBerita()
  }, [])

  return (
    /* Outer wrapper: Ivory background */
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: '#FFFFF0' }}
    >
      {/* LEFT — Evergreen panel */}
      <BeritaPanel beritaList={beritaList} loading={loadingBerita} />

      {/* RIGHT — Ivory form area */}
      <div
        className="flex-1 flex flex-col justify-center items-center p-6 lg:p-14 relative overflow-hidden"
        style={{ backgroundColor: '#FFFFF0' }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-hex-light pointer-events-none" />
        {/* Soft green orb */}
        <div className="absolute top-[-10%] right-[-5%] w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(34,139,34,0.07)' }} />
        <div className="absolute bottom-[-5%] left-[-5%] w-60 h-60 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(34,139,34,0.05)' }} />

        {/* Mobile Header */}
        <div className="lg:hidden z-10 w-full max-w-[420px] mb-8 text-center animate-fade-in-down">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden border"
            style={{ background: '#228B22', borderColor: '#1A6B1A' }}>
            <img src="/logo.png" alt="Logo SI-Tahfiz" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#1C3B1C' }}>SI-Tahfiz</h1>
          <p className="text-xs font-medium mt-1" style={{ color: '#4A6B4A' }}>MTs TQ Jamilurrahman Yogyakarta</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-[420px] z-10 animate-fade-in-up animate-delay-200">
          <div className="rounded-3xl p-8 lg:p-10" style={{
            background: '#FFFFFF',
            border: '1px solid #D4E8D4',
            boxShadow: '0 8px 40px rgba(34,139,34,0.1), 0 2px 8px rgba(0,0,0,0.05)',
          }}>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#1C3B1C' }}>Selamat Datang 👋</h2>
              <p className="text-sm font-medium" style={{ color: '#6B8B6B' }}>
                Masuk sebagai <span className="font-bold" style={{ color: '#228B22' }}>Orang Tua / Wali</span>
              </p>
            </div>

            {/* Install Banner */}
            {showInstallBanner && (
              <div className="flex items-center justify-between rounded-2xl p-4 mb-6 animate-scale-in border"
                style={{ background: '#F0F7F0', borderColor: '#C8DFC8' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 border" style={{ borderColor: '#D4E8D4' }}>
                    <img src="/icon-192.png" alt="App" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1C3B1C' }}>Install Aplikasi</p>
                    <p className="text-[11px] font-medium" style={{ color: '#4A6B4A' }}>Akses lebih cepat & mudah</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={handleInstall} className="text-xs text-white px-4 py-1.5 rounded-lg font-bold transition-all hover:opacity-90" style={{ background: '#228B22' }}>Install</button>
                  <button onClick={() => setShowInstallBanner(false)} className="text-[10px] font-medium text-center" style={{ color: '#4A6B4A' }}>Nanti Saja</button>
                </div>
              </div>
            )}

            {/* Form */}
            <form ref={formRef} action={formAction} className="flex flex-col gap-5">
              {state && !state.success && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border text-sm animate-scale-in"
                  style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                  <span className="font-medium leading-relaxed">{state.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="nomor_hp" className="block text-sm font-bold" style={{ color: '#2D5A2D' }}>
                  Nomor HP WhatsApp
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 transition-colors" style={{ color: '#6B8B6B' }} />
                  </div>
                  <input
                    id="nomor_hp"
                    name="nomor_hp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    pattern="[0-9]{10,15}"
                    className="block w-full pl-11 pr-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2"
                    style={{
                      background: '#F7F7E8',
                      border: '1.5px solid #D4E8D4',
                      color: '#1C3B1C',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.background = '#FFFFFF' }}
                    onBlur={e => { e.target.style.borderColor = '#D4E8D4'; e.target.style.background = '#F7F7E8' }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                  <Info className="w-3.5 h-3.5" style={{ color: '#6B8B6B' }} />
                  <span className="text-xs font-medium" style={{ color: '#6B8B6B' }}>Gunakan angka saja, tanpa spasi atau +62</span>
                </div>
              </div>

              <div className="pt-1">
                <SubmitButton />
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-2xl border" style={{ background: '#F0F7F0', borderColor: '#C8DFC8' }}>
              <p className="text-xs leading-relaxed font-medium" style={{ color: '#2D5A2D' }}>
                <span className="font-bold">Pertama kali masuk?</span> Password Anda diatur otomatis oleh sistem. Hubungi Staff TU jika mengalami kesulitan login.
              </p>
            </div>

            {/* Switch Role */}
            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid #E8F0E8' }}>
              <p className="text-sm font-medium" style={{ color: '#6B8B6B' }}>
                Staff Sekolah?{' '}
                <Link href="/login/staff" className="font-bold inline-flex items-center gap-1 group transition-opacity hover:opacity-80" style={{ color: '#228B22' }}>
                  Login Staff
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
          </div>

          <FooterYearCenter />
        </div>
      </div>
    </div>
  )
}
