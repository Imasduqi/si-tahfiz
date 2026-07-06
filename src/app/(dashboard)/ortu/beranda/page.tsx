'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateWithDay } from '@/lib/utils'
import { BookOpen, RefreshCw, Calendar, ChevronRight, GraduationCap, MapPin, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullIndicator } from '@/components/ui/pull-indicator'

interface Child {
  id: string
  nama_lengkap: string
  kelas: string
  grade: string
  halaqah: { nama_halaqah: string } | null
}

interface SetoranRecord {
  id: string
  tipe: 'sabak' | 'sabki' | 'manzil'
  jumlah_baris: number
  tanggal: string
}

const QUOTES = [
  { ar: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', id: 'Dan bacalah Al-Qur\'an dengan tartil (perlahan-lahan).', ref: 'QS. Al-Muzzammil: 4' },
  { ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', id: 'Sesungguhnya bersama kesulitan ada kemudahan.', ref: 'QS. Al-Insyirah: 6' },
  { ar: 'اقْرَأْ بِاسْمِ رَبِّكَ', id: 'Bacalah dengan menyebut nama Tuhanmu.', ref: 'QS. Al-Alaq: 1' },
]

export default function OrtuBerandaPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [anakList, setAnakList] = useState<Child[]>([])
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null)
  const [totalSetoranBulanIni, setTotalSetoranBulanIni] = useState<number>(0)
  const [tikrarAktifCount, setTikrarAktifCount] = useState<number>(0)
  const [alphaCount, setAlphaCount] = useState<number>(0)
  const [recentSetoran, setRecentSetoran] = useState<SetoranRecord[]>([])
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)

  const quoteIndex = new Date().getDate() % QUOTES.length
  const todayQuote = QUOTES[quoteIndex]

  const fetchChildProgress = useCallback(async (childId: string) => {
    setIsDataFetching(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const [setoranRes, tikrarRes, alphaRes, recentSetoranRes] = await Promise.all([
        supabase.from('setoran').select('jumlah_baris').eq('santri_id', childId).gte('tanggal', startOfMonth).lte('tanggal', today),
        supabase.from('tikrar').select('id', { count: 'exact', head: true }).eq('santri_id', childId).neq('status', 'selesai_rumah'),
        supabase.from('absensi').select('*', { count: 'exact', head: true }).eq('santri_id', childId).eq('status', 'alpha').gte('tanggal', startOfMonth),
        supabase.from('setoran').select('id, tipe, jumlah_baris, tanggal').eq('santri_id', childId).gte('tanggal', sevenDaysAgoStr).order('tanggal', { ascending: false }),
      ])

      if (setoranRes.error) throw setoranRes.error
      if (tikrarRes.error) throw tikrarRes.error
      if (alphaRes.error) throw alphaRes.error
      if (recentSetoranRes.error) throw recentSetoranRes.error

      const totalBaris = (setoranRes.data || []).reduce((sum, s) => sum + (s.jumlah_baris || 0), 0)
      setTotalSetoranBulanIni(totalBaris)
      setTikrarAktifCount(tikrarRes.count || 0)
      setAlphaCount(alphaRes.count || 0)
      setRecentSetoran((recentSetoranRes.data as SetoranRecord[]) || [])
    } catch (err) {
      console.error('Error fetching child progress:', err)
      toast.error('Gagal memuat rincian perkembangan anak')
    } finally {
      setIsPageLoading(false)
      setIsDataFetching(false)
    }
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setIsPageLoading(true)
    try {
      const { data: children, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, kelas, grade, halaqah(nama_halaqah)')
        .eq('orang_tua_id', currentUser.id)
        .order('nama_lengkap')

      if (error) throw error
      const list = (children as unknown as Child[]) || []
      setAnakList(list)
      const activeId = selectedAnakId || (list.length > 0 ? list[0].id : null)
      if (activeId) { setSelectedAnakId(activeId); await fetchChildProgress(activeId) }
      else setIsPageLoading(false)
    } catch (err) {
      console.error('Error fetching children:', err)
      toast.error('Gagal memuat daftar anak')
      setIsPageLoading(false)
    }
  }, [currentUser, selectedAnakId, supabase, fetchChildProgress])

  useEffect(() => {
    if (!userLoading && currentUser) fetchData()
  }, [currentUser, userLoading, fetchData])

  useEffect(() => {
    if (selectedAnakId) fetchChildProgress(selectedAnakId)
  }, [selectedAnakId, fetchChildProgress])

  const { isRefreshing, pullDistance } = usePullToRefresh({ onRefresh: async () => { await fetchData() } })

  const CardSkeleton = () => (
    <div className="h-28 rounded-2xl animate-pulse" style={{ background: '#F0F7F0', border: '1px solid #E0EDE0' }} />
  )

  if (userLoading || isPageLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <div className="h-52 rounded-3xl animate-pulse" style={{ background: '#E8F5E8', border: '1px solid #C8DFC8' }} />
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="h-24 rounded-2xl animate-pulse" style={{ background: '#F0F7F0', border: '1px solid #E0EDE0' }} />
        <div className="space-y-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    )
  }

  if (anakList.length === 0) {
    return <div className="p-6 max-w-4xl mx-auto"><EmptyState title="Belum Ada Santri Terdaftar" description="Tidak ada data santri yang terhubung. Silakan hubungi TU atau Koordinator." /></div>
  }

  const selectedChild = anakList.find((c) => c.id === selectedAnakId) || anakList[0]
  const initials = selectedChild.nama_lengkap.substring(0, 2).toUpperCase()
  const progressPercent = Math.min(Math.round((totalSetoranBulanIni / 200) * 100), 100)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <PullIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

      {/* Child Tabs */}
      {anakList.length > 1 && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {anakList.map((anak) => {
            const isSelected = anak.id === selectedAnakId
            return (
              <button
                key={anak.id}
                onClick={() => setSelectedAnakId(anak.id)}
                className="px-5 py-2 text-sm font-bold rounded-full transition-all duration-300"
                style={isSelected ? {
                  background: '#228B22',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(34,139,34,0.3)',
                  border: '1px solid #1A6B1A',
                } : {
                  background: '#FFFFFF',
                  color: '#4A6B4A',
                  border: '1px solid #C8DFC8',
                }}
              >
                {anak.nama_lengkap}
              </button>
            )
          })}
        </div>
      )}

      {/* ── HERO CARD (Evergreen) */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #228B22 0%, #1E7A1E 55%, #145214 100%)',
          boxShadow: '0 8px 40px rgba(34,139,34,0.25), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Decorations */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-hex-white rounded-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl border border-white/30"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                {initials}
              </div>
              <div>
                <p className="text-green-200/80 text-[11px] font-bold uppercase tracking-widest mb-0.5">Santri Anda</p>
                <h2 className="text-white font-extrabold text-xl leading-tight">{selectedChild.nama_lengkap}</h2>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(255,255,240,0.2)', border: '1px solid rgba(255,255,240,0.35)', color: '#FFFFF0' }}>
              Grade {selectedChild.grade}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: GraduationCap, text: `Kelas ${selectedChild.kelas}` },
              { icon: MapPin, text: selectedChild.halaqah?.nama_halaqah || 'Belum ada halaqah' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#E8FFE8' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: '#FFFFF0' }} />{text}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-200/80 text-[11px] font-bold uppercase tracking-wider">Progress Setoran Bulan Ini</span>
              <span className="text-white font-black text-sm">{totalSetoranBulanIni} <span className="text-green-200 font-semibold text-xs">Baris</span></span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #FFFFF0, #C8FFB0)' }} />
            </div>
            <p className="text-green-300/50 text-[11px] mt-1.5 font-medium">Target: 200 baris / bulan</p>
          </div>
        </div>
      </div>

      {/* ── STATS GRID */}
      {isDataFetching ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4 animate-fade-in-up animate-delay-100">
          {/* Setoran */}
          <div className="rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-default"
            style={{ background: '#FFFFFF', border: '1px solid #C8DFC8', boxShadow: '0 2px 12px rgba(34,139,34,0.08)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#F0F7F0' }}>
              <BookOpen className="w-5 h-5" style={{ color: '#228B22' }} />
            </div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: '#1C3B1C' }}>{totalSetoranBulanIni}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: '#6B8B6B' }}>Setoran</div>
          </div>

          {/* Tikrar */}
          <Link href={tikrarAktifCount > 0 ? "/ortu/tikrar" : "#"} className={tikrarAktifCount === 0 ? 'pointer-events-none' : ''}>
            <div className="rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
              style={{ background: '#FFFFFF', border: '1px solid #FDE68A', boxShadow: '0 2px 12px rgba(180,130,10,0.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FFFBEB' }}>
                <RefreshCw className="w-5 h-5" style={{ color: '#B45309' }} />
              </div>
              <div className="text-2xl md:text-3xl font-black" style={{ color: '#78350F' }}>{tikrarAktifCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: '#92400E' }}>Tikrar</div>
            </div>
          </Link>

          {/* Alpha */}
          <div className="rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
            style={alphaCount > 0
              ? { background: '#FFF5F5', border: '1px solid #FCA5A5', boxShadow: '0 2px 12px rgba(180,50,50,0.08)' }
              : { background: '#FFFFFF', border: '1px solid #E0EDE0', boxShadow: '0 2px 12px rgba(34,139,34,0.05)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: alphaCount > 0 ? '#FEE2E2' : '#F0F7F0' }}>
              <Calendar className="w-5 h-5" style={{ color: alphaCount > 0 ? '#DC2626' : '#6B8B6B' }} />
            </div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: alphaCount > 0 ? '#DC2626' : '#1C3B1C' }}>{alphaCount}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: alphaCount > 0 ? '#B91C1C' : '#6B8B6B' }}>Alpha</div>
          </div>
        </div>
      )}

      {/* ── QUOTE CARD */}
      <div className="rounded-2xl p-5 relative overflow-hidden animate-fade-in-up animate-delay-200"
        style={{ background: 'linear-gradient(135deg, #F0F7F0 0%, #E8F5E8 100%)', border: '1px solid #C8DFC8' }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 pointer-events-none" style={{ background: 'rgba(34,139,34,0.08)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: '#228B22' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4A6B4A' }}>Ayat Hari Ini</span>
          </div>
          <p className="text-right text-lg font-bold mb-2 leading-relaxed" dir="rtl" style={{ color: '#1C3B1C' }}>{todayQuote.ar}</p>
          <p className="text-sm font-medium italic leading-relaxed" style={{ color: '#4A6B4A' }}>&ldquo;{todayQuote.id}&rdquo;</p>
          <p className="text-xs font-bold mt-2" style={{ color: '#6B8B6B' }}>{todayQuote.ref}</p>
        </div>
      </div>

      {/* ── RECENT SETORAN */}
      {!isDataFetching && (
        <div className="animate-fade-in-up animate-delay-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1C3B1C' }}>
              <span className="w-1 h-5 rounded-full" style={{ background: '#228B22' }} />
              Setoran Terakhir
              <span className="text-xs font-semibold" style={{ color: '#6B8B6B' }}>(7 Hari)</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#4A6B4A' }}>
              <TrendingUp className="w-4 h-4" />
              <span>{recentSetoran.length} catatan</span>
            </div>
          </div>

          <div className="space-y-3">
            {recentSetoran.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#F7F7E8', border: '1px solid #E0EDE0' }}>
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#C8DFC8' }} />
                <p className="font-bold text-sm" style={{ color: '#6B8B6B' }}>Belum ada riwayat setoran dalam 7 hari terakhir.</p>
              </div>
            ) : (
              recentSetoran.map((record, idx) => {
                const tipeConfig = {
                  sabak:  { label: 'Sabaq',  accent: '#228B22', light: '#F0F7F0',  border: '#C8DFC8',  text: '#1C3B1C' },
                  sabki:  { label: 'Sabqi',  accent: '#1D4ED8', light: '#EFF6FF',  border: '#BFDBFE',  text: '#1E3A8A' },
                  manzil: { label: 'Manzil', accent: '#B45309', light: '#FFFBEB',  border: '#FDE68A',  text: '#78350F' },
                }
                const cfg = tipeConfig[record.tipe] ?? tipeConfig.sabak

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E0EDE0',
                      boxShadow: '0 1px 6px rgba(34,139,34,0.05)',
                      animationDelay: `${idx * 60}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-2 h-8 rounded-full" style={{ background: cfg.accent }} />
                      <div>
                        <div className="text-xs font-bold mb-0.5" style={{ color: '#6B8B6B' }}>{formatDateWithDay(record.tanggal)}</div>
                        <div className="text-sm font-black" style={{ color: '#1C3B1C' }}>
                          {record.jumlah_baris} <span className="text-xs font-semibold" style={{ color: '#6B8B6B' }}>Baris</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider"
                      style={{ background: cfg.light, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
