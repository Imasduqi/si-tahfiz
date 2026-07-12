'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { FileSpreadsheet, AlertCircle, CalendarDays } from 'lucide-react'
import { Konfigurasi, SyahrulQuran } from '@/types'
import {
  generateRekapSyahrulQuranExcel,
  fetchDataForSyahrulQuranRekap,
} from '@/lib/excel/generate-rekap-syahrul-quran'
import * as XLSX from 'xlsx'
import { useRekapGenerator } from '@/lib/hooks/use-rekap-generator'
import { getTodayString } from '@/lib/utils'

export default function KoordinatorRekapPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [konfigurasi, setKonfigurasi] = useState<Konfigurasi | null>(null)
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  // Syahrul Quran section state
  const [syahrulQuranPeriods, setSyahrulQuranPeriods] = useState<SyahrulQuran[]>([])
  const [selectedSyahrulId, setSelectedSyahrulId] = useState('')
  const [isGeneratingSyahrul, setIsGeneratingSyahrul] = useState(false)

  const { generateRekap, isGenerating } = useRekapGenerator()

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, userLoading, router])

  // Fetch configuration on load to resolve current semester and year
  useEffect(() => {
    let isMounted = true
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from('konfigurasi')
          .select('*')
          .single()

        if (error) throw error
        
        if (isMounted) {
          setKonfigurasi(data)

          // Resolve current semester & year based on dates
          const now = new Date()
          const todayStr = getTodayString()
          const currentYear = now.getFullYear()

          if (data) {
            if (data.tanggal_mulai_ganjil && data.tanggal_selesai_ganjil) {
              if (todayStr >= data.tanggal_mulai_ganjil && todayStr <= data.tanggal_selesai_ganjil) {
                const startYear = new Date(data.tanggal_mulai_ganjil).getFullYear()
                setSemester('ganjil')
                setTahunAjaran(`${startYear}/${startYear + 1}`)
                return
              }
            }
            if (data.tanggal_mulai_genap && data.tanggal_selesai_genap) {
              if (todayStr >= data.tanggal_mulai_genap && todayStr <= data.tanggal_selesai_genap) {
                const endYear = new Date(data.tanggal_selesai_genap).getFullYear()
                setSemester('genap')
                setTahunAjaran(`${endYear - 1}/${endYear}`)
                return
              }
            }
          }

          // Fallback
          const month = now.getMonth() + 1
          if (month >= 7 && month <= 12) {
            setSemester('ganjil')
            setTahunAjaran(`${currentYear}/${currentYear + 1}`)
          } else {
            setSemester('genap')
            setTahunAjaran(`${currentYear - 1}/${currentYear}`)
          }
        }
      } catch (err) {
        console.error('Failed to load configuration:', err)
        if (isMounted) {
          toast.error('Gagal memuat konfigurasi sistem')
        }
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false)
        }
      }
    }

    if (currentUser) {
      loadConfig()
    }
    
    return () => { isMounted = false }
  }, [currentUser, supabase])

  // Fetch Syahrul Quran periods on load
  useEffect(() => {
    let isMounted = true
    async function loadSyahrulQuranPeriods() {
      const { data } = await supabase
        .from('syahrul_quran')
        .select('*')
        .order('tanggal_mulai', { ascending: false })
      if (isMounted) {
        setSyahrulQuranPeriods((data ?? []) as SyahrulQuran[])
      }
    }
    if (currentUser) {
      loadSyahrulQuranPeriods()
    }
    return () => { isMounted = false }
  }, [currentUser, supabase])

  const handleDownloadSyahrulQuran = async () => {
    if (!selectedSyahrulId) return
    setIsGeneratingSyahrul(true)
    try {
      const data = await fetchDataForSyahrulQuranRekap(supabase, selectedSyahrulId)
      const wb = generateRekapSyahrulQuranExcel({
        halaqahList: data.halaqahList,
        santriList: data.santriList,
        setoranList: data.setoranList,
        syahrulQuranPeriod: data.periode,
      })
      XLSX.writeFile(wb, `Rekap_Syahrul_Quran_${data.periode.tanggal_mulai}.xlsx`)
      toast.success('File Excel berhasil didownload')
    } catch (err) {
      toast.error('Gagal membuat rekap: ' + String(err))
    } finally {
      setIsGeneratingSyahrul(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    await generateRekap(semester, tahunAjaran, konfigurasi)
  }

  if (userLoading || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">
          Rekap Semester
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Unduh laporan rekapitulasi setoran harian, kehadiran, ujian, dan nilai akhir raport santri per halaqah.
        </p>
      </div>

      <Card shadow="md" className="overflow-hidden border border-[#E5E7EB] bg-white">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-[#E5E7EB] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-emerald-800 leading-relaxed">
            <span className="font-semibold block mb-0.5">Catatan Penting:</span>
            File Excel akan berisi satu sheet per halaqah, dikelompokkan berdasarkan halaqah masing-masing santri. 
            Nama sheet disesuaikan dengan nama halaqah masing-masing.
          </div>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full">
              <label htmlFor="semester-select" className="block text-xs font-semibold text-[#111827] mb-1.5">
                Semester
              </label>
              <select
                id="semester-select"
                value={semester}
                onChange={(e) => setSemester(e.target.value as 'ganjil' | 'genap')}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] transition-all"
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>

            <Input
              id="tahun-ajaran-input"
              label="Tahun Ajaran"
              placeholder="Contoh: 2025/2026"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
            <Button
              id="generate-rekap-btn"
              type="submit"
              isLoading={isGenerating}
              className="flex items-center gap-2 font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Generate & Download Rekap
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Rekap Syahrul Quran ─────────────────────────────────────────── */}
      <Card shadow="md" className="overflow-hidden border border-[#E5E7EB] bg-white">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 border-b border-[#E5E7EB] flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-teal-800 text-sm block mb-0.5">Rekap Syahrul Quran</span>
            <p className="text-xs text-teal-700 leading-relaxed">
              Unduh rekap setoran Sabak harian selama periode Syahrul Quran tertentu. Setiap halaqah mendapat dua sheet: tabel harian dan ringkasan status lulus/mengulang.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {syahrulQuranPeriods.length === 0 ? (
            <EmptyState
              title="Belum ada periode Syahrul Quran"
              description="Periode akan muncul di sini setelah Koordinator menetapkannya."
            />
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label
                  htmlFor="syahrul-quran-select"
                  className="block text-xs font-semibold text-[#111827] mb-1.5"
                >
                  Pilih Periode Syahrul Quran
                </label>
                <select
                  id="syahrul-quran-select"
                  value={selectedSyahrulId}
                  onChange={e => setSelectedSyahrulId(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] transition-all"
                >
                  <option value="">Pilih periode...</option>
                  {syahrulQuranPeriods.map(p => (
                    <option key={p.id} value={p.id}>
                      {new Date(p.tanggal_mulai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' — '}
                      {new Date(p.tanggal_selesai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                id="download-syahrul-quran-btn"
                onClick={handleDownloadSyahrulQuran}
                disabled={!selectedSyahrulId || isGeneratingSyahrul}
                isLoading={isGeneratingSyahrul}
                className="flex items-center gap-2 font-semibold whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Rekap Syahrul Quran
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
