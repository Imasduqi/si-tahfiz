'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateRekapExcel } from '@/lib/excel/generate-rekap'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Konfigurasi } from '@/types'

function isValidTahunAjaran(value: string): { valid: boolean; error?: string } {
  const formatMatch = /^\d{4}\/\d{4}$/.test(value)
  if (!formatMatch) {
    return { valid: false, error: 'Format harus YYYY/YYYY, contoh: 2025/2026' }
  }

  const [startYear, endYear] = value.split('/').map(Number)
  const currentYear = new Date().getFullYear()

  if (endYear !== startYear + 1) {
    return { valid: false, error: 'Tahun kedua harus tepat 1 tahun setelah tahun pertama' }
  }

  if (startYear < 2020 || startYear > currentYear + 1) {
    return { valid: false, error: 'Tahun ajaran di luar rentang yang wajar' }
  }

  return { valid: true }
}

export function useRekapGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRekap = async (semester: 'ganjil' | 'genap', tahunAjaran: string, konfigurasi: Konfigurasi | null) => {
    if (!semester) {
      toast.error('Pilih semester terlebih dahulu')
      return
    }

    if (!tahunAjaran) {
      toast.error('Masukkan tahun ajaran terlebih dahulu')
      return
    }

    const validation = isValidTahunAjaran(tahunAjaran)
    if (!validation.valid) {
      toast.error(validation.error)
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
      const supabase = createClient()
      
      // Parallel fetch all data except uas_detail (we need uas_id first)
      const [
        halaqahRes, santriRes, setoranRes, absensiRes,
        uasRes, akhlaqRes, hariLiburRes,
        syahrulRes, pekanRes, targetGradeRes, targetMurajaahRes
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
        supabase.from('akhlaq').select('*')
          .eq('semester', semester)
          .eq('tahun_ajaran', tahunAjaran),
        supabase.from('hari_libur').select('tanggal')
          .gte('tanggal', tanggalMulai)
          .lte('tanggal', tanggalSelesai),
        supabase.from('syahrul_quran').select('*'),
        supabase.from('pekan_murajaah').select('*'),
        supabase.from('target_grade').select('*'),
        supabase.from('target_murajaah').select('pekan_murajaah_id, halaqah_id, target_baris_per_hari')
      ])

      // Handle errors
      if (halaqahRes.error) throw halaqahRes.error
      if (santriRes.error) throw santriRes.error
      if (setoranRes.error) throw setoranRes.error
      if (absensiRes.error) throw absensiRes.error
      if (uasRes.error) throw uasRes.error
      if (akhlaqRes.error) throw akhlaqRes.error
      if (hariLiburRes.error) throw hariLiburRes.error
      if (syahrulRes.error) throw syahrulRes.error
      if (pekanRes.error) throw pekanRes.error
      if (targetGradeRes.error) throw targetGradeRes.error
      if (targetMurajaahRes.error) throw targetMurajaahRes.error

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
      
      const uasList = uasRes.data || []
      const uasIds = uasList.map(u => u.id)
      
      let uasDetailList: any[] = []
      if (uasIds.length > 0) {
        const { data, error } = await supabase
          .from('uas_detail')
          .select('*')
          .in('uas_id', uasIds)
        
        if (error) throw error
        uasDetailList = data || []
      }

      // Generate excel
      const wb = generateRekapExcel({
        halaqahList,
        santriList,
        setoranList: setoranRes.data || [],
        absensiList: absensiRes.data || [],
        uasList,
        uasDetailList,
        akhlaqList: akhlaqRes.data || [],
        hariLiburList: hariLiburRes.data || [],
        syahrulList: syahrulRes.data || [],
        pekanList: pekanRes.data || [],
        konfigurasi,
        semester,
        tahunAjaran,
        targetGradeList: targetGradeRes.data || [],
        targetMurajaahList: targetMurajaahRes.data || []
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

  return { generateRekap, isGenerating }
}
