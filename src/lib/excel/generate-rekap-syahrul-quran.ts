import * as XLSX from 'xlsx'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Halaqah, Santri, Setoran, SyahrulQuran } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateSyahrulQuranParams {
  halaqahList: Halaqah[]
  santriList: Santri[]
  setoranList: Setoran[] // pre-filtered to tipe='sabak' within the syahrul quran date range
  syahrulQuranPeriod: SyahrulQuran
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format date as DD/MM for column headers */
function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

/** Format date as "D Month YYYY" in Bahasa Indonesia */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  // Use a fixed timezone-safe date
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Get all calendar days (inclusive) between two ISO date strings */
function getAllDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = []
  const [sy, sm, sd] = startStr.split('-').map(Number)
  const [ey, em, ed] = endStr.split('-').map(Number)
  const current = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)

  while (current <= end) {
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateRekapSyahrulQuranExcel(params: GenerateSyahrulQuranParams): XLSX.WorkBook {
  const { halaqahList, santriList, setoranList, syahrulQuranPeriod } = params
  const wb = XLSX.utils.book_new()

  // All calendar days in the period (incl. weekends — Syahrul Quran is intensive)
  const dates = getAllDatesInRange(
    syahrulQuranPeriod.tanggal_mulai,
    syahrulQuranPeriod.tanggal_selesai
  )

  const periodeLabel = `${formatDate(syahrulQuranPeriod.tanggal_mulai)} — ${formatDate(syahrulQuranPeriod.tanggal_selesai)}`

  for (const halaqah of halaqahList) {
    const santriInHalaqah = santriList
      .filter(s => s.halaqah_id === halaqah.id)
      .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, 'id'))

    if (santriInHalaqah.length === 0) continue

    // ── Sheet 1: Main daily table ────────────────────────────────────────────

    const headerRow: (string | number)[] = [
      'No',
      'Nama Lengkap',
      'Kelas',
      ...dates.map(d => formatDateShort(d)),
      'Total Baris',
      'Rata-rata/Hari',
    ]

    const dataRows: (string | number)[][] = santriInHalaqah.map((santri, index) => {
      const row: (string | number)[] = [index + 1, santri.nama_lengkap, santri.kelas]

      let totalBaris = 0
      let hariAdaSetoran = 0

      for (const tanggal of dates) {
        const setoran = setoranList.find(
          s => s.santri_id === santri.id && s.tanggal === tanggal
        )
        const baris = setoran?.jumlah_baris ?? 0
        if (baris > 0) {
          row.push(baris)
          totalBaris += baris
          hariAdaSetoran += 1
        } else {
          row.push('-')
        }
      }

      const rataRata =
        hariAdaSetoran > 0 ? Math.round((totalBaris / hariAdaSetoran) * 10) / 10 : 0
      row.push(totalBaris, rataRata)
      return row
    })

    const wsMainData: (string | number)[][] = [
      [`Rekap Syahrul Quran — ${halaqah.nama_halaqah}`],
      [`Periode: ${periodeLabel}`],
      [],
      headerRow,
      ...dataRows,
    ]

    const wsMain = XLSX.utils.aoa_to_sheet(wsMainData)

    // Column widths: No | Nama | Kelas | date cols... | Total | Rata-rata
    wsMain['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 8 },
      ...dates.map(() => ({ wch: 8 })),
      { wch: 12 },
      { wch: 14 },
    ]

    // Freeze first 3 columns and 4 header rows
    wsMain['!freeze'] = { xSplit: 3, ySplit: 4 }

    const sheetName = halaqah.nama_halaqah.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, wsMain, sheetName)

    // ── Sheet 2: Summary (Ringkasan status lulus/mengulang) ──────────────────

    const summarySheetName = `${halaqah.nama_halaqah.substring(0, 26)}_Ring`

    const summaryHeader: (string | number)[] = [
      'No',
      'Nama Lengkap',
      'Kelas',
      'Hari Lulus',
      'Hari Mengulang',
      'Total Hari Setor',
      'Total Baris',
      'Rata-rata Kesalahan',
    ]

    const summaryRows: (string | number)[][] = santriInHalaqah.map((santri, index) => {
      const santriSetoran = setoranList.filter(s => s.santri_id === santri.id)
      const hariLulus = santriSetoran.filter(s => s.status === 'lulus').length
      const hariMengulang = santriSetoran.filter(s => s.status === 'mengulang').length
      const totalBaris = santriSetoran.reduce((acc, s) => acc + (s.jumlah_baris ?? 0), 0)
      const totalKesalahan = santriSetoran.reduce(
        (acc, s) => acc + (s.jumlah_kesalahan ?? 0),
        0
      )
      const rataKesalahan =
        santriSetoran.length > 0
          ? Math.round((totalKesalahan / santriSetoran.length) * 10) / 10
          : 0

      return [
        index + 1,
        santri.nama_lengkap,
        santri.kelas,
        hariLulus,
        hariMengulang,
        santriSetoran.length,
        totalBaris,
        rataKesalahan,
      ]
    })

    const wsSummaryData: (string | number)[][] = [
      [`Ringkasan Syahrul Quran — ${halaqah.nama_halaqah}`],
      [`Periode: ${periodeLabel}`],
      [],
      summaryHeader,
      ...summaryRows,
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData)

    wsSummary['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 8 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
    ]

    XLSX.utils.book_append_sheet(wb, wsSummary, summarySheetName)
  }

  return wb
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching helper
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchDataForSyahrulQuranRekap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  syahrulQuranId: string
) {
  const { data: periode, error: periodeError } = await supabase
    .from('syahrul_quran')
    .select('*')
    .eq('id', syahrulQuranId)
    .single()

  if (periodeError || !periode) {
    throw new Error('Periode Syahrul Quran tidak ditemukan')
  }

  const [halaqahRes, santriRes, setoranRes] = await Promise.all([
    supabase.from('halaqah').select('*, profiles(nama_lengkap)'),
    supabase.from('santri').select('*').order('nama_lengkap'),
    supabase
      .from('setoran')
      .select('*')
      .eq('tipe', 'sabak')
      .gte('tanggal', periode.tanggal_mulai)
      .lte('tanggal', periode.tanggal_selesai),
  ])

  if (halaqahRes.error) throw halaqahRes.error
  if (santriRes.error) throw santriRes.error
  if (setoranRes.error) throw setoranRes.error

  return {
    periode: periode as SyahrulQuran,
    halaqahList: (halaqahRes.data ?? []) as Halaqah[],
    santriList: (santriRes.data ?? []) as Santri[],
    setoranList: (setoranRes.data ?? []) as Setoran[],
  }
}
