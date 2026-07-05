'use client'

import './ortu/ortu.css'
import './login.css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Phone, BookOpen, Loader2, AlertCircle, Info, Newspaper, Calendar, ChevronRight
} from 'lucide-react'
import { loginWithPhone } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { BeritaLogin } from '@/types'
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
// BeritaCard — satu item berita
// tanggal diformat di client saja (state)
// ─────────────────────────────────────────────

function BeritaCard({ berita }: { berita: BeritaLogin }) {
  // Gunakan state agar format tanggal hanya dijalankan di client
  // sehingga tidak ada mismatch server ↔ client
  const [tanggal, setTanggal] = useState('')

  useEffect(() => {
    setTanggal(
      new Date(berita.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
  }, [berita.created_at])

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = '#10B981'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
        e.currentTarget.style.borderColor = '#E5E7EB'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.4 }}>
          {berita.judul}
        </h3>
        <ChevronRight style={{ width: 14, height: 14, color: '#D1D5DB', flexShrink: 0, marginTop: 2 }} />
      </div>
      <p style={{
        fontSize: 13,
        color: '#6B7280',
        margin: '0 0 8px 0',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {berita.isi}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Calendar style={{ width: 11, height: 11, color: '#9CA3AF' }} />
        {/* Render kosong dulu (server), isi setelah mount (client) */}
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{tanggal}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// BeritaPanel — kolom kiri (desktop only)
// ─────────────────────────────────────────────

function BeritaPanel({ beritaList, loading }: { beritaList: BeritaLogin[]; loading: boolean }) {
  return (
    <div style={{
      flex: '0 0 75%',
      maxWidth: '75%',
      padding: '48px 40px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #E5E7EB',
      minHeight: '100vh',
    }}>
      {/* Brand Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}>
            <BookOpen style={{ width: 22, height: 22, color: '#FFFFFF' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>SI-Tahfiz</h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>MTs TQ Jamilurrahman Yogyakarta</p>
          </div>
        </div>
      </div>

      {/* Hero text */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: '#111827', margin: '0 0 8px 0', lineHeight: 1.3 }}>
          Sistem Informasi<br />
          <span style={{ color: '#10B981' }}>Manajemen Tahfiz</span>
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
          Platform terpadu untuk memantau progres hafalan, absensi, dan penilaian santri.
        </p>
      </div>

      {/* Berita Section */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Newspaper style={{ width: 16, height: 16, color: '#10B981' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informasi Terbaru
          </span>
        </div>

        {loading ? (
          /* Skeleton loader — ditampilkan sama di server & client saat mount */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '16px 20px',
              }}>
                <div style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                <div style={{ height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 6, width: '90%' }} />
                <div style={{ height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, width: '75%' }} />
              </div>
            ))}
          </div>
        ) : beritaList.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Newspaper style={{ width: 48, height: 48, color: '#D1D5DB' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>Belum ada pengumuman</p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Pengumuman dari sekolah akan tampil di sini</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {beritaList.map((berita) => (
              <BeritaCard key={berita.id} berita={berita} />
            ))}
          </div>
        )}
      </div>

      {/* Footer — tahun diisi client-only via CSS content trick: gunakan span kosong di SSR */}
      <FooterYearLeft />
    </div>
  )
}

// ─────────────────────────────────────────────
// FooterYearLeft — render tahun hanya di client
// ─────────────────────────────────────────────

function FooterYearLeft() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 40 }}>
      &copy;{year !== null ? ` ${year}` : ''} MTs TQ Jamilurrahman Yogyakarta
    </p>
  )
}

// ─────────────────────────────────────────────
// FooterYearCenter — render tahun hanya di client
// ─────────────────────────────────────────────

function FooterYearCenter() {
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function LoginOrtuPage() {
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
    
    // Hide banner if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false)
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }
  }

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

  // Ambil berita_login (publik — tidak perlu auth)
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
    <>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#FFFFFF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* ── Kolom Kiri: Berita (desktop only via CSS class) ── */}
        <div className="login-news-col">
          <BeritaPanel beritaList={beritaList} loading={loadingBerita} />
        </div>

        {/* ── Kolom Kanan: Form Login ── */}
        <div
          className="login-form-col"
          style={{
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px 32px',
          }}
        >
          {/* Form Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '32px 28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
              Masuk sebagai Orang Tua
            </h2>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Gunakan nomor HP yang terdaftar di sistem
            </p>

            {showInstallBanner && (
              <div className="md:hidden flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <img src="/icon-192.png" alt="SI-Tahfiz" className="w-8 h-8 rounded-lg" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Install SI-Tahfiz</p>
                    <p className="text-xs text-emerald-600">Tambahkan ke layar utama</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInstallBanner(false)}
                    className="text-xs text-gray-500 px-2 py-1"
                  >
                    Nanti
                  </button>
                  <button
                    onClick={handleInstall}
                    className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg font-medium"
                  >
                    Install
                  </button>
                </div>
              </div>
            )}

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
                <Link
                  href="/login/staff"
                  className="link-ortu-emerald"
                  style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none' }}
                >
                  Login sebagai Staff (TU/Koordinator/Pengampu/Kepsek)
                </Link>
              </p>
            </div>
          </div>

          {/* Footer tahun — client-only */}
          <FooterYearCenter />
        </div>
      </div>
    </>
  )
}
