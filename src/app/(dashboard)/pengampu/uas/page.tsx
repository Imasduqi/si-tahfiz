'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Table, TableColumn } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonTable } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { Info, Edit3 } from 'lucide-react'
import { Santri, Halaqah, Konfigurasi, Uas, UasDetail } from '@/types'
import { getTodayString } from '@/lib/utils'

interface UasWithDetails extends Uas {
  uas_detail: UasDetail[]
}

interface SantriWithUas extends Santri {
  uasRecord?: UasWithDetails
}

function getCurrentTahunAjaran(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12

  // Academic year starts in July (month 7)
  if (month >= 7) {
    return `${year}/${year + 1}`
  } else {
    return `${year - 1}/${year}`
  }
}

export default function PengampuUasPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<SantriWithUas[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Semester and Year configuration
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil')
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(getCurrentTahunAjaran())
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<SantriWithUas | null>(null)
  
  // Modal Form States
  const [jumlahJuz, setJumlahJuz] = useState<number>(3)
  const [juzDetails, setJuzDetails] = useState<{ nomorJuz: string; nilai: string }[]>([
    { nomorJuz: '', nilai: '' },
    { nomorJuz: '', nilai: '' },
    { nomorJuz: '', nilai: '' },
  ])
  const [isSaving, setIsSaving] = useState(false)

  // Generate available school years around current date
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = -2; i <= 2; i++) {
      const start = currentYear + i
      years.push(`${start}/${start + 1}`)
    }
    setAvailableYears(years)
  }, [])

  // Resolve current semester & school year from konfigurasi or fallback
  const resolveCurrentSemesterAndYear = (config: Konfigurasi | null) => {
    const now = new Date()
    const todayStr = getTodayString()
    const currentYear = now.getFullYear()

    if (config) {
      if (config.tanggal_mulai_ganjil && config.tanggal_selesai_ganjil) {
        if (todayStr >= config.tanggal_mulai_ganjil && todayStr <= config.tanggal_selesai_ganjil) {
          const startYear = new Date(config.tanggal_mulai_ganjil).getFullYear()
          setSelectedSemester('ganjil')
          setSelectedTahunAjaran(`${startYear}/${startYear + 1}`)
          return
        }
      }
      if (config.tanggal_mulai_genap && config.tanggal_selesai_genap) {
        if (todayStr >= config.tanggal_mulai_genap && todayStr <= config.tanggal_selesai_genap) {
          const endYear = new Date(config.tanggal_selesai_genap).getFullYear()
          setSelectedSemester('genap')
          setSelectedTahunAjaran(`${endYear - 1}/${endYear}`)
          return
        }
      }
    }

    // Fallback logic
    const month = now.getMonth() + 1
    if (month >= 7 && month <= 12) {
      setSelectedSemester('ganjil')
      setSelectedTahunAjaran(`${currentYear}/${currentYear + 1}`)
    } else {
      setSelectedSemester('genap')
      setSelectedTahunAjaran(`${currentYear - 1}/${currentYear}`)
    }
  }

  // Fetch halaqah, santri and UAS records
  const fetchPageData = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      // 1. Fetch Konfigurasi to set current default semester & year
      const { data: configData } = await supabase
        .from('konfigurasi')
        .select('*')
        .single()

      resolveCurrentSemesterAndYear(configData)

      // 2. Fetch halaqah
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select('*')
        .eq('pengampu_id', currentUser.id)
        .single()

      if (halaqahError) {
        throw new Error('Halaqah tidak ditemukan. Anda belum terdaftar sebagai pengampu di halaqah mana pun.')
      }

      if (halaqahData) {
        setHalaqah(halaqahData)
      }
    } catch (error) {
      console.error('Initial load error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal memuat data halaqah'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch UAS scores when halaqah, semester, or school year changes
  const fetchUasRecords = async () => {
    if (!halaqah) return
    try {
      // Fetch Santri in halaqah
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('halaqah_id', halaqah.id)
        .order('nama_lengkap')

      if (santriError) throw santriError

      if (santriData && santriData.length > 0) {
        const santriIds = santriData.map(s => s.id)

        // Fetch UAS headers and details
        const { data: uasData, error: uasError } = await supabase
          .from('uas')
          .select(`
            *,
            uas_detail(id, nomor_juz, nilai, created_at)
          `)
          .in('santri_id', santriIds)
          .eq('semester', selectedSemester)
          .eq('tahun_ajaran', selectedTahunAjaran)

        if (uasError) throw uasError

        const uasMap = new Map<string, UasWithDetails>()
        ;(uasData || []).forEach(record => {
          uasMap.set(record.santri_id, record as unknown as UasWithDetails)
        })

        const mappedSantri = santriData.map(s => ({
          ...s,
          uasRecord: uasMap.get(s.id)
        }))

        setSantriList(mappedSantri)
      } else {
        setSantriList([])
      }
    } catch (error) {
      console.error('Fetch UAS data error:', error)
      toast.error('Gagal memuat data UAS santri')
    }
  }

  useEffect(() => {
    if (!userLoading) {
      fetchPageData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userLoading])

  useEffect(() => {
    if (halaqah) {
      fetchUasRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halaqah, selectedSemester, selectedTahunAjaran])

  const openUasModal = (santri: SantriWithUas) => {
    setSelectedSantri(santri)
    
    if (santri.uasRecord && santri.uasRecord.uas_detail && santri.uasRecord.uas_detail.length > 0) {
      // Pre-fill existing data
      const sortedDetails = [...santri.uasRecord.uas_detail].sort((a, b) => a.nomor_juz - b.nomor_juz)
      setJumlahJuz(sortedDetails.length)
      setJuzDetails(sortedDetails.map(d => ({
        nomorJuz: d.nomor_juz.toString(),
        nilai: d.nilai.toString()
      })))
    } else {
      // Default state
      setJumlahJuz(3)
      setJuzDetails([
        { nomorJuz: '', nilai: '' },
        { nomorJuz: '', nilai: '' },
        { nomorJuz: '', nilai: '' },
      ])
    }
    setIsModalOpen(true)
  }

  const handleJumlahJuzChange = (newVal: number) => {
    setJumlahJuz(newVal)
    setJuzDetails(prev => {
      const next = [...prev]
      if (newVal > prev.length) {
        while (next.length < newVal) {
          next.push({ nomorJuz: '', nilai: '' })
        }
      } else {
        next.splice(newVal)
      }
      return next
    })
  }

  const handleJuzDetailChange = (index: number, field: 'nomorJuz' | 'nilai', value: string) => {
    setJuzDetails(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri || !currentUser) return

    // Validation
    if (juzDetails.length === 0) {
      toast.error('Minimal harus mengujikan 1 juz')
      return
    }

    const uniqueJuz = new Set<number>()
    for (let i = 0; i < juzDetails.length; i++) {
      const row = juzDetails[i]
      const juzNum = parseInt(row.nomorJuz)
      const nilaiNum = parseInt(row.nilai)

      if (isNaN(juzNum) || juzNum < 1 || juzNum > 30) {
        toast.error(`Nomor juz pada baris ke-${i + 1} tidak valid (1-30)`)
        return
      }

      if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        toast.error(`Nilai pada baris ke-${i + 1} tidak valid (0-100)`)
        return
      }

      if (uniqueJuz.has(juzNum)) {
        toast.error(`Duplikasi nomor juz: Juz ${juzNum} diinput lebih dari sekali`)
        return
      }
      uniqueJuz.add(juzNum)
    }

    setIsSaving(true)
    try {
      // 1. Upsert UAS Header
      const { data: uasRecord, error: headerError } = await supabase
        .from('uas')
        .upsert({
          santri_id: selectedSantri.id,
          pengampu_id: currentUser.id,
          semester: selectedSemester,
          tahun_ajaran: selectedTahunAjaran,
          updated_at: new Date().toISOString()
        }, { onConflict: 'santri_id,semester,tahun_ajaran' })
        .select()
        .single()

      if (headerError) throw headerError

      // 2 & 3. Replace old detail rows atomically via RPC
      const insertRows = juzDetails.map(d => ({
        nomor_juz: parseInt(d.nomorJuz),
        nilai: parseInt(d.nilai)
      }))

      const { error: rpcError } = await supabase.rpc('replace_uas_detail', {
        p_uas_id: uasRecord.id,
        p_details: insertRows
      })

      if (rpcError) {
        toast.error('Gagal menyimpan detail UAS: ' + rpcError.message)
        return // stop here — the RPC function guarantees old data is preserved if this failed
      }

      // 4. Calculate and Update Nilai Akhir
      const allFilled = juzDetails.every(d => d.nilai !== '')
      if (allFilled) {
        const avg = juzDetails.reduce((sum, d) => sum + Number(d.nilai), 0) / juzDetails.length
        const roundedAvg = Math.round(avg * 10) / 10

        const { error: updateError } = await supabase
          .from('uas')
          .update({ nilai_akhir: roundedAvg })
          .eq('id', uasRecord.id)

        if (updateError) throw updateError

        toast.success('Nilai UAS berhasil disimpan')
      } else {
        // Clear average if incomplete
        const { error: updateError } = await supabase
          .from('uas')
          .update({ nilai_akhir: null })
          .eq('id', uasRecord.id)

        if (updateError) throw updateError

        toast.success('Nilai UAS disimpan — belum lengkap, nilai akhir belum terhitung')
      }

      setIsModalOpen(false)
      fetchUasRecords()
    } catch (error) {
      console.error('Save UAS error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal menyimpan nilai UAS'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate live average for modal view
  const allFilled = juzDetails.every(d => d.nilai !== '')
  const liveAverage = allFilled && juzDetails.length > 0
    ? (juzDetails.reduce((sum, d) => sum + Number(d.nilai), 0) / juzDetails.length).toFixed(1)
    : null

  // Table Columns
  const columns: TableColumn<SantriWithUas>[] = [
    {
      key: 'nama_santri',
      header: 'Nama Santri',
      render: (item) => (
        <span className="font-semibold text-gray-900">{item.nama_lengkap}</span>
      ),
    },
    {
      key: 'kelas',
      header: 'Kelas',
      render: (item) => <span>{item.kelas}</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item) => (
        <Badge variant="info" className="capitalize">
          {item.grade}
        </Badge>
      ),
    },
    {
      key: 'nilai_akhir',
      header: 'Nilai Akhir UAS',
      render: (item) => {
        const uas = item.uasRecord
        if (uas && uas.nilai_akhir !== null) {
          return (
            <span className="font-bold text-emerald-600 text-base">
              {Number(uas.nilai_akhir).toFixed(1)}
            </span>
          )
        }
        return (
          <Badge variant="warning">
            Belum Lengkap
          </Badge>
        )
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => {
        const hasRecord = !!item.uasRecord
        return (
          <Button
            variant={hasRecord ? 'secondary' : 'primary'}
            size="sm"
            rounded="lg"
            onClick={() => openUasModal(item)}
            className={`flex items-center gap-1.5 ${
              !hasRecord ? 'bg-[#10B981] hover:bg-[#059669] text-white' : ''
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {hasRecord ? 'Edit UAS' : 'Input UAS'}
          </Button>
        )
      },
    },
  ]

  if (userLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <LoadingSkeleton className="h-8 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <SkeletonTable />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <EmptyState
          title="Akses Ditolak"
          description="Silakan log in terlebih dahulu untuk mengakses halaman ini."
        />
      </div>
    )
  }

  if (!halaqah) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <EmptyState
          title="Halaqah Tidak Ditemukan"
          description="Anda belum terdaftar sebagai pengampu di halaqah mana pun."
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Ujian Akhir Semester (UAS)
          </h1>
          <p className="text-sm font-semibold text-[#6B7280] mt-1">
            Halaqah: {halaqah.nama_halaqah} ({halaqah.grade.toUpperCase()})
          </p>
        </div>

        {/* Semester & Tahun Selector */}
        <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as 'ganjil' | 'genap')}
              className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer border-r pr-3 border-gray-200"
            >
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Tahun Ajaran:</span>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => setSelectedTahunAjaran(e.target.value)}
              className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Daftar Penilaian UAS — Semester {selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} {selectedTahunAjaran}
        </h2>

        <Table
          columns={columns}
          data={santriList}
          empty={{
            title: 'Tidak ada santri',
            description: 'Tidak ada data santri yang terdaftar dalam halaqah Anda.',
          }}
        />
      </div>

      {/* Input/Edit UAS Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSantri?.uasRecord ? `Edit Nilai UAS — ${selectedSantri.nama_lengkap}` : `Input Nilai UAS — ${selectedSantri?.nama_lengkap}`}
        size="lg"
      >
        {selectedSantri && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Note & Config */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl space-y-2">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#92400E] leading-relaxed">
                  <p className="font-bold mb-1">Panduan Pengisian UAS</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pilih jumlah juz yang akan diujikan pada semester ini (1-3 juz).</li>
                    <li>
                      <strong>Jika hafalan santri ≤ jumlah juz yang diujikan, seluruh hafalan harus diujikan.</strong>
                    </li>
                    <li>Sistem akan menghitung rata-rata secara otomatis setelah semua nilai juz terisi.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Jumlah Juz Selector */}
            <div className="flex items-center gap-4 border-b pb-4 border-gray-100">
              <label className="text-sm font-semibold text-gray-700">
                Jumlah Juz yang Diujikan:
              </label>
              <select
                value={jumlahJuz}
                onChange={(e) => handleJumlahJuzChange(parseInt(e.target.value))}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 outline-none focus:border-[#10B981]"
              >
                <option value={1}>1 Juz</option>
                <option value={2}>2 Juz</option>
                <option value={3}>3 Juz</option>
              </select>
            </div>

            {/* Dynamic Juz Form Rows */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {juzDetails.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]"
                >
                  <Input
                    label={`Juz ke-${index + 1} (Nomor Juz: 1-30) *`}
                    type="number"
                    min="1"
                    max="30"
                    placeholder="Contoh: 30"
                    value={row.nomorJuz}
                    onChange={(e) => handleJuzDetailChange(index, 'nomorJuz', e.target.value)}
                    required
                  />
                  <Input
                    label={`Nilai Juz ke-${index + 1} (0-100) *`}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 85"
                    value={row.nilai}
                    onChange={(e) => handleJuzDetailChange(index, 'nilai', e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

            {/* Live Average View */}
            <div className="bg-gray-50 border border-[#E5E7EB] rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Nilai Akhir UAS:</span>
              {liveAverage !== null ? (
                <span className="text-xl font-bold text-emerald-600">
                  {liveAverage}
                </span>
              ) : (
                <span className="text-sm font-semibold text-gray-400">
                  Belum Lengkap (nilai akhir belum terhitung)
                </span>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                rounded="lg"
                isLoading={isSaving}
                className="flex-1 bg-[#10B981] hover:bg-[#059669]"
              >
                Simpan Nilai UAS
              </Button>
              <Button
                type="button"
                variant="secondary"
                rounded="lg"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="w-[100px] border border-gray-200"
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
