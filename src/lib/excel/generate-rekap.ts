import * as XLSX from 'xlsx'
import { Halaqah, Santri, Setoran, Absensi, Uas, UasDetail, Akhlaq, SyahrulQuran, PekanMurajaah, Konfigurasi, TargetGrade } from '@/types'

// Helper to parse dates without timezone shifts
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Get all weekdays (Mon-Fri) in a date range, excluding hari_libur
function getHariEfektif(startDate: string, endDate: string, hariLibur: string[]): string[] {
  const dates: string[] = []
  const current = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  
  while (current <= end) {
    const dayOfWeek = current.getDay() // 0=Sunday, 6=Saturday
    
    // Format as YYYY-MM-DD manually to prevent timezone shifts
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !hariLibur.includes(dateStr)) {
      dates.push(dateStr)
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Get ISO Week Key for grouping (YYYY-Www)
function getISOWeekKey(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const day = d.getDay() || 7
  d.setDate(d.getDate() + 4 - day)
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1)
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Group dates into weeks (Mon-Fri groups)
function groupByWeek(dates: string[]): string[][] {
  const weeks: Map<string, string[]> = new Map()
  dates.forEach(date => {
    const weekKey = getISOWeekKey(date)
    if (!weeks.has(weekKey)) weeks.set(weekKey, [])
    weeks.get(weekKey)!.push(date)
  })
  return Array.from(weeks.values())
}

// Check if a date falls within Syahrul Quran period
function isSyahrulQuran(date: string, syahrulList: SyahrulQuran[]): boolean {
  return syahrulList.some(s => date >= s.tanggal_mulai && date <= s.tanggal_selesai)
}

// Check if a date falls within Pekan Murajaah
function isPekanMurajaah(date: string, pekanList: PekanMurajaah[]): boolean {
  return pekanList.some(p => date >= p.tanggal_mulai && date <= p.tanggal_selesai)
}

// Calculate total baris for a santri in a specific week and tipe
function getTotalBaris(
  santriId: string,
  weekDates: string[],
  tipe: 'sabak' | 'sabki' | 'manzil',
  setoranList: Setoran[]
): number {
  return setoranList
    .filter(s =>
      s.santri_id === santriId &&
      s.tipe === tipe &&
      weekDates.includes(s.tanggal)
    )
    .reduce((sum, s) => sum + s.jumlah_baris, 0)
}

interface WeekColDef {
  label: string
  dates: string[]
  isSQ: boolean
  isPM: boolean
  types: ('sabak' | 'sabki' | 'manzil')[]
  monthLabel: string
}

function getMonthYearLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

export function generateRekapExcel(params: {
  halaqahList: (Halaqah & { profiles?: { nama_lengkap: string } | null })[]
  santriList: Santri[]
  setoranList: Setoran[]
  absensiList: Absensi[]
  uasList: Uas[]
  uasDetailList: UasDetail[]
  akhlaqList: Akhlaq[]
  hariLiburList: { tanggal: string }[]
  syahrulList: SyahrulQuran[]
  pekanList: PekanMurajaah[]
  konfigurasi: Konfigurasi
  semester: 'ganjil' | 'genap'
  tahunAjaran: string
  targetGradeList?: TargetGrade[]
}): XLSX.WorkBook {
  const {
    halaqahList,
    santriList,
    setoranList,
    absensiList,
    uasList,
    akhlaqList,
    hariLiburList,
    syahrulList,
    pekanList,
    konfigurasi,
    semester,
    tahunAjaran,
    targetGradeList
  } = params

  const wb = XLSX.utils.book_new()

  const tanggalSelesai = semester === 'ganjil' ? konfigurasi.tanggal_selesai_ganjil : konfigurasi.tanggal_selesai_genap
  const targetTanggalMulai = semester === 'ganjil' ? konfigurasi.tanggal_mulai_ganjil : konfigurasi.tanggal_mulai_genap

  if (!targetTanggalMulai || !tanggalSelesai) {
    // If semester configurations are missing, return a workbook with an error sheet
    const ws = XLSX.utils.aoa_to_sheet([['Konfigurasi Semester Belum Lengkap. Silakan hubungi TU/Koordinator.']])
    XLSX.utils.book_append_sheet(wb, ws, 'Error')
    return wb
  }

  const hariLiburDates = hariLiburList.map(h => h.tanggal)
  const hariEfektifAll = getHariEfektif(targetTanggalMulai, tanggalSelesai, hariLiburDates)
  const hariEfektifNonSQ = hariEfektifAll.filter(d => !isSyahrulQuran(d, syahrulList))

  const weeksList = groupByWeek(hariEfektifAll)

  // Group weeks by Month
  const monthsMap: Map<string, string[][]> = new Map()
  weeksList.forEach(weekDates => {
    const label = getMonthYearLabel(weekDates[0])
    if (!monthsMap.has(label)) {
      monthsMap.set(label, [])
    }
    monthsMap.get(label)!.push(weekDates)
  })

  // Build column definitions for weeks
  const weekDefs: WeekColDef[] = []
  monthsMap.forEach((weeks, monthLabel) => {
    weeks.forEach((weekDates: string[], idx: number) => {
      const isSQ = weekDates.some((d: string) => isSyahrulQuran(d, syahrulList))
      const isPM = weekDates.some((d: string) => isPekanMurajaah(d, pekanList))
      
      let label = `Pekan ${idx + 1}`
      if (isSQ) label += '★'
      else if (isPM) label += '◆'
      
      const types: ('sabak' | 'sabki' | 'manzil')[] = isSQ ? ['sabak'] : ['sabak', 'sabki', 'manzil']
      
      weekDefs.push({
        label,
        dates: weekDates,
        isSQ,
        isPM,
        types,
        monthLabel
      })
    })
  })

  // Iterate over each halaqah and build a sheet
  halaqahList.forEach(halaqah => {
    const santriInHalaqah = santriList.filter(s => s.halaqah_id === halaqah.id)
    
    // Sort santri by name initially, then we will calculate scores and rank
    const santriCalculations = santriInHalaqah.map(santri => {
      // 1. Setoran
      const totalSabak = setoranList
        .filter(s => s.santri_id === santri.id && s.tipe === 'sabak')
        .reduce((sum, s) => sum + s.jumlah_baris, 0)
      
      const totalSabki = setoranList
        .filter(s => s.santri_id === santri.id && s.tipe === 'sabki')
        .reduce((sum, s) => sum + s.jumlah_baris, 0)
        
      const totalManzil = setoranList
        .filter(s => s.santri_id === santri.id && s.tipe === 'manzil')
        .reduce((sum, s) => sum + s.jumlah_baris, 0)

      // Find target minimum
      const targetGrade = targetGradeList?.find(tg => tg.grade === santri.grade)
      const targetMin = targetGrade ? targetGrade.target_min : (santri.grade === 'tahfiz' ? 30 : santri.grade === 'takmil' ? 15 : 7)

      const totalTargetSabak = hariEfektifAll.length * targetMin
      const totalTargetSabki = hariEfektifNonSQ.length * targetMin
      const totalTargetManzil = hariEfektifNonSQ.length * targetMin

      const nilaiSabak = totalTargetSabak > 0 ? Math.min(100, (totalSabak / totalTargetSabak) * 100) : 0
      const nilaiSabki = totalTargetSabki > 0 ? Math.min(100, (totalSabki / totalTargetSabki) * 100) : 0
      const nilaiManzil = totalTargetManzil > 0 ? Math.min(100, (totalManzil / totalTargetManzil) * 100) : 0

      const nilaiSetoran = (nilaiSabak * 0.30) + (nilaiSabki * 0.30) + (nilaiManzil * 0.40)

      // 2. Kehadiran
      const jumlahAlpha = absensiList.filter(a =>
        a.santri_id === santri.id &&
        a.status === 'alpha'
      ).length
      const nilaiKehadiran = hariEfektifAll.length > 0
        ? Math.max(0, Math.min(100, ((hariEfektifAll.length - jumlahAlpha) / hariEfektifAll.length) * 100))
        : 100

      // 3. UAS
      const uasRecord = uasList.find(u => u.santri_id === santri.id)
      const nilaiUas = uasRecord?.nilai_akhir ?? 0

      // 4. Akhlaq
      const akhlaqRecord = akhlaqList.find(a => a.santri_id === santri.id)
      const nilaiAkhlaq = akhlaqRecord?.nilai ?? 0

      // 5. Raport
      const { bobot_setoran, bobot_uas, bobot_akhlaq, bobot_kehadiran } = konfigurasi
      const nilaiRaport = (
        (nilaiSetoran * bobot_setoran / 100) +
        (nilaiUas * bobot_uas / 100) +
        (nilaiAkhlaq * bobot_akhlaq / 100) +
        (nilaiKehadiran * bobot_kehadiran / 100)
      )

      const nilaiRaportFinal = Math.round(nilaiRaport * 10) / 10

      return {
        santri,
        totalSabak,
        totalSabki,
        totalManzil,
        nilaiSetoran: Math.round(nilaiSetoran * 10) / 10,
        nilaiUas: Math.round(nilaiUas * 10) / 10,
        nilaiAkhlaq: Math.round(nilaiAkhlaq * 10) / 10,
        nilaiKehadiran: Math.round(nilaiKehadiran * 10) / 10,
        nilaiRaportFinal,
        rank: 0
      }
    })

    // Sort descending by nilaiRaportFinal
    const sortedSantri = [...santriCalculations].sort((a, b) => b.nilaiRaportFinal - a.nilaiRaportFinal)
    
    // Assign standard competition rank
    let rank = 1
    let prevNilai = -1
    sortedSantri.forEach((item, index) => {
      if (index > 0 && item.nilaiRaportFinal < prevNilai) {
        rank = index + 1
      }
      item.rank = rank
      prevNilai = item.nilaiRaportFinal
    })

    // Display alphabetically
    const outputSantri = [...sortedSantri].sort((a, b) => a.santri.nama_lengkap.localeCompare(b.santri.nama_lengkap))

    // Build the worksheet rows
    const wsData: (string | number)[][] = []

    // Title & Pengampu Information
    const titleSemester = semester.charAt(0).toUpperCase() + semester.slice(1)
    wsData.push([`Rekap Setoran Harian — ${halaqah.nama_halaqah} — ${titleSemester} ${tahunAjaran}`])
    wsData.push([`Pengampu: ${halaqah.profiles?.nama_lengkap || ''}`])
    wsData.push([]) // Empty spacer row

    // Build multi-level header
    const headerRow4: (string | number)[] = ['No', 'Nama Lengkap', 'Kelas']
    const headerRow5: (string | number)[] = ['', '', '']
    const headerRow6: (string | number)[] = ['', '', '']

    // Add Month headers
    let lastMonthLabel = ''
    weekDefs.forEach(wDef => {
      wDef.types.forEach((type, tIdx) => {
        if (tIdx === 0 && wDef.monthLabel !== lastMonthLabel) {
          headerRow4.push(wDef.monthLabel)
          lastMonthLabel = wDef.monthLabel
        } else {
          headerRow4.push('')
        }
      })
    })

    // Add Week headers
    weekDefs.forEach(wDef => {
      wDef.types.forEach((type, tIdx) => {
        if (tIdx === 0) {
          headerRow5.push(wDef.label)
        } else {
          headerRow5.push('')
        }
      })
    })

    // Add sub-headers (Sabak/Sabki/Manzil)
    weekDefs.forEach(wDef => {
      wDef.types.forEach(type => {
        const capType = type.charAt(0).toUpperCase() + type.slice(1)
        headerRow6.push(capType)
      })
    })

    // Summary columns
    const summaryLabels = [
      'Total Sabak (Semester)',
      'Total Sabki (Semester)',
      'Total Manzil (Semester)',
      'Total Hari Efektif',
      `Nilai Setoran (${konfigurasi.bobot_setoran}%)`,
      `Nilai UAS (${konfigurasi.bobot_uas}%)`,
      `Nilai Akhlaq (${konfigurasi.bobot_akhlaq}%)`,
      `Nilai Kehadiran (${konfigurasi.bobot_kehadiran}%)`,
      'Nilai Raport',
      'Rank'
    ]

    summaryLabels.forEach(label => {
      headerRow4.push(label)
      headerRow5.push('')
      headerRow6.push('')
    })

    wsData.push(headerRow4)
    wsData.push(headerRow5)
    wsData.push(headerRow6)

    // Add santri rows
    outputSantri.forEach((item, idx) => {
      const { santri } = item
      const row: (string | number)[] = [
        idx + 1,
        santri.nama_lengkap,
        santri.kelas
      ]

      // Weekly setoran totals
      weekDefs.forEach(wDef => {
        wDef.types.forEach(type => {
          const totalBaris = getTotalBaris(santri.id, wDef.dates, type, setoranList)
          row.push(totalBaris)
        })
      })

      // Add summary calculations
      row.push(item.totalSabak)
      row.push(item.totalSabki)
      row.push(item.totalManzil)
      row.push(hariEfektifAll.length)
      row.push(item.nilaiSetoran)
      row.push(item.nilaiUas)
      row.push(item.nilaiAkhlaq)
      row.push(item.nilaiKehadiran)
      row.push(item.nilaiRaportFinal)
      row.push(item.rank)

      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Calculate all merge ranges
    const merges: XLSX.Range[] = []

    // 1. Vertical merges for first 3 columns (No, Nama, Kelas) - from row 4 to 6 (index 3 to 5)
    merges.push({ s: { r: 3, c: 0 }, e: { r: 5, c: 0 } })
    merges.push({ s: { r: 3, c: 1 }, e: { r: 5, c: 1 } })
    merges.push({ s: { r: 3, c: 2 }, e: { r: 5, c: 2 } })

    // 2. Month merges (Row 4)
    let colIndex = 3
    let currentMonth = ''
    let monthStartCol = -1

    weekDefs.forEach(wDef => {
      const numCols = wDef.types.length
      if (wDef.monthLabel !== currentMonth) {
        if (monthStartCol !== -1) {
          merges.push({
            s: { r: 3, c: monthStartCol },
            e: { r: 3, c: colIndex - 1 }
          })
        }
        currentMonth = wDef.monthLabel
        monthStartCol = colIndex
      }
      colIndex += numCols
    })
    if (monthStartCol !== -1) {
      merges.push({
        s: { r: 3, c: monthStartCol },
        e: { r: 3, c: colIndex - 1 }
      })
    }

    // 3. Week merges (Row 5)
    let weekColIndex = 3
    weekDefs.forEach(wDef => {
      const numCols = wDef.types.length
      if (numCols > 1) {
        merges.push({
          s: { r: 4, c: weekColIndex },
          e: { r: 4, c: weekColIndex + numCols - 1 }
        })
      }
      weekColIndex += numCols
    })

    // 4. Summary column vertical merges (Row 4 to Row 6)
    const startSummaryCol = 3 + weekDefs.reduce((sum, w) => sum + w.types.length, 0)
    summaryLabels.forEach((_, idx) => {
      const c = startSummaryCol + idx
      merges.push({
        s: { r: 3, c: c },
        e: { r: 5, c: c }
      })
    })

    ws['!merges'] = merges

    // Set Column widths
    const cols: XLSX.ColInfo[] = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama Lengkap
      { wch: 8 }   // Kelas
    ]
    weekDefs.forEach(wDef => {
      wDef.types.forEach(() => {
        cols.push({ wch: 8 })
      })
    })
    summaryLabels.forEach(() => {
      cols.push({ wch: 15 })
    })
    ws['!cols'] = cols

    // Freeze settings (First 3 columns and 6 header rows)
    ws['!freeze'] = { xSplit: 3, ySplit: 6 }
    ws['!views'] = [
      { state: 'frozen', xSplit: 3, ySplit: 6, topLeftCell: 'D7', activePane: 'bottomRight' }
    ]

    // Sanitize and limit sheet name to 31 chars max
    const sheetName = halaqah.nama_halaqah.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName || `Halaqah ${halaqah.id.substring(0, 4)}`)
  })

  return wb
}
