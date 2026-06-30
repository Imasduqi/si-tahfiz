'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Konfigurasi } from '@/types'
import { generateRekapExcel } from '@/lib/excel/generate-rekap'
import * as XLSX from 'xlsx'

export default function KepsekRekapPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [konfigurasi, setKonfigurasi] = useState<Konfigurasi | null>(null)
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, userLoading, router])

  // Fetch configuration on load to resolve current semester and year
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from('konfigurasi')
          .select('*')
          .single()

        if (error) throw error
        setKonfigurasi(data)

        // Resolve current semester & year based on dates
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
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
      } catch (err) {
        console.error('Failed to load configuration:', err)
        toast.error('Gagal memuat konfigurasi sistem')
      } finally {
        setIsLoadingConfig(false)
      }
    }

    if (currentUser) {
      loadConfig()
    }
  }, [currentUser, supabase])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!semester) {
      toast.error('Pilih semester terlebih dahulu')
      return
    }

    if (!tahunAjaran) {
      toast.error('Masukkan tahun ajaran terlebih dahulu')
      return
    }

    // Validate format YYYY/YYYY
    const yearPattern = /^[0-9]{4}\/[0-9]{4}$/
    if (!yearPattern.test(tahunAjaran)) {
      toast.error('Format tahun ajaran harus YYYY/YYYY (contoh: 2025/2026)')
      return
    }

    if (!konfigurasi) {
      toast.error('Konfigurasi sistem belum dimuat')
      return
    }

    const tanggalMulai = semester === 'ganjil' ? konfigurasi.tanggal_mulai_ganjil : konfigurasi.tanggal_mulai_genap
    const tanggalSelesai = semester === 'ganjil' ? konfigurasi.tanggal_selesai_ganjil : konfigurasi.tanggal_selesai_genap

    if (!tanggalMulai || !tanggalSelesai) {
      toast.error(`Tanggal mulai/selesai untuk semester ${semester} belum diatur di Konfigurasi oleh TU!`)
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('Mengambil data dan men-generate file Excel...')

    try {
      // Parallel fetch all data
      const [
        halaqahRes, santriRes, setoranRes, absensiRes,
        uasRes, uasDetailRes, akhlaqRes, hariLiburRes,
        syahrulRes, pekanRes, targetGradeRes
      ] = await Promise.all([
        supabase.from('halaqah').select('*, profiles(nama_lengkap)'),
        supabase.from('santri').select('*').order('nama_lengkap'),
        supabase.from('setoran').select('*')
          .gte('tanggal', tanggalMulai)
          .lte('tanggal', tanggalSelesai),
        supabase.from('absensi').select('*')
          .gte('tanggal', tanggalMulai)
          .lte('tanggal', tanggalSelesai),
        supabase.from('uas').select('*')
          .eq('semester', semester)
          .eq('tahun_ajaran', tahunAjaran),
        supabase.from('uas_detail').select('*'),
        supabase.from('akhlaq').select('*')
          .eq('semester', semester)
          .eq('tahun_ajaran', tahunAjaran),
        supabase.from('hari_libur').select('tanggal')
          .gte('tanggal', tanggalMulai)
          .lte('tanggal', tanggalSelesai),
        supabase.from('syahrul_quran').select('*'),
        supabase.from('pekan_murajaah').select('*'),
        supabase.from('target_grade').select('*')
      ])

      // Handle errors
      if (halaqahRes.error) throw halaqahRes.error
      if (santriRes.error) throw santriRes.error
      if (setoranRes.error) throw setoranRes.error
      if (absensiRes.error) throw absensiRes.error
      if (uasRes.error) throw uasRes.error
      if (uasDetailRes.error) throw uasDetailRes.error
      if (akhlaqRes.error) throw akhlaqRes.error
      if (hariLiburRes.error) throw hariLiburRes.error
      if (syahrulRes.error) throw syahrulRes.error
      if (pekanRes.error) throw pekanRes.error
      if (targetGradeRes.error) throw targetGradeRes.error

      const halaqahList = halaqahRes.data || []
      const santriList = santriRes.data || []

      if (halaqahList.length === 0) {
        toast.error('Tidak ada data halaqah untuk semester ini', { id: toastId })
        setIsGenerating(false)
        return
      }

      if (santriList.length === 0) {
        toast.error('Tidak ada data santri untuk semester ini', { id: toastId })
        setIsGenerating(false)
        return
      }

      // Generate excel
      const wb = generateRekapExcel({
        halaqahList,
        santriList,
        setoranList: setoranRes.data || [],
        absensiList: absensiRes.data || [],
        uasList: uasRes.data || [],
        uasDetailList: uasDetailRes.data || [],
        akhlaqList: akhlaqRes.data || [],
        hariLiburList: hariLiburRes.data || [],
        syahrulList: syahrulRes.data || [],
        pekanList: pekanRes.data || [],
        konfigurasi,
        semester,
        tahunAjaran,
        targetGradeList: targetGradeRes.data || []
      })

      // Download file
      XLSX.writeFile(wb, `Rekap_${semester}_${tahunAjaran.replace('/', '-')}.xlsx`)
      toast.success('File Excel berhasil didownload', { id: toastId })

    } catch (err) {
      console.error('Failed to generate Excel:', err)
      toast.error('Gagal membuat rekap Excel. Coba lagi.', { id: toastId })
    } finally {
      setIsGenerating(false)
    }
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
    </div>
  )
}
