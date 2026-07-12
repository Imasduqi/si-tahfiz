'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { useRouter } from 'next/navigation'
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
import { Edit3, Info, Heart } from 'lucide-react'
import { Santri, Halaqah, Konfigurasi, Akhlaq } from '@/types'
import { getTodayString } from '@/lib/utils'

interface SantriWithAkhlaq extends Santri {
  akhlaqRecord?: Akhlaq
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

export default function PengampuAkhlaqPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [isAkhlaqActive, setIsAkhlaqActive] = useState<boolean | null>(null)
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<SantriWithAkhlaq[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil')
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(getCurrentTahunAjaran())
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<SantriWithAkhlaq | null>(null)
  
  // Modal Form States
  const [formNilai, setFormNilai] = useState<string>('')
  const [formSemester, setFormSemester] = useState<'ganjil' | 'genap'>('ganjil')
  const [formTahunAjaran, setFormTahunAjaran] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Generate available school years
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = -2; i <= 2; i++) {
      const start = currentYear + i
      years.push(`${start}/${start + 1}`)
    }
    setAvailableYears(years)
  }, [])

  // Resolve semester & school year
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

    // Fallback
    const month = now.getMonth() + 1
    if (month >= 7 && month <= 12) {
      setSelectedSemester('ganjil')
      setSelectedTahunAjaran(`${currentYear}/${currentYear + 1}`)
    } else {
      setSelectedSemester('genap')
      setSelectedTahunAjaran(`${currentYear - 1}/${currentYear}`)
    }
  }

  // Initial Guard and Load Configuration & Halaqah
  const fetchInitialData = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      // 1. Check if Akhlaq feature is active
      const { data: config, error: configError } = await supabase
        .from('konfigurasi')
        .select('*')
        .single()

      if (configError) throw configError

      if (!config?.fitur_akhlaq_aktif) {
        router.replace('/pengampu/beranda')
        return
      }

      setIsAkhlaqActive(true)
      resolveCurrentSemesterAndYear(config)

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
      const msg = error instanceof Error ? error.message : 'Gagal memuat konfigurasi awal'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch student list & Akhlaq scores
  const fetchAkhlaqRecords = async () => {
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

        // Fetch existing Akhlaq records
        const { data: akhlaqData, error: akhlaqError } = await supabase
          .from('akhlaq')
          .select('*')
          .in('santri_id', santriIds)
          .eq('semester', selectedSemester)
          .eq('tahun_ajaran', selectedTahunAjaran)

        if (akhlaqError) throw akhlaqError

        const akhlaqMap = new Map<string, Akhlaq>()
        ;(akhlaqData || []).forEach(record => {
          akhlaqMap.set(record.santri_id, record)
        })

        const mappedSantri = santriData.map(s => ({
          ...s,
          akhlaqRecord: akhlaqMap.get(s.id)
        }))

        setSantriList(mappedSantri)
      } else {
        setSantriList([])
      }
    } catch (error) {
      console.error('Fetch Akhlaq data error:', error)
      toast.error('Gagal memuat nilai akhlaq santri')
    }
  }

  useEffect(() => {
    if (!userLoading) {
      fetchInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userLoading])

  useEffect(() => {
    if (halaqah && isAkhlaqActive) {
      fetchAkhlaqRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halaqah, selectedSemester, selectedTahunAjaran, isAkhlaqActive])

  const openInputModal = (santri: SantriWithAkhlaq) => {
    setSelectedSantri(santri)
    setFormNilai(santri.akhlaqRecord ? santri.akhlaqRecord.nilai.toString() : '')
    setFormSemester(selectedSemester)
    setFormTahunAjaran(selectedTahunAjaran)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri || !currentUser) return

    const nilaiNum = parseInt(formNilai)
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
      toast.error('Nilai harus antara 0 dan 100')
      return
    }

    if (!formSemester) {
      toast.error('Semester wajib dipilih')
      return
    }

    const yearRegex = /^\d{4}\/\d{4}$/
    if (!formTahunAjaran || !yearRegex.test(formTahunAjaran)) {
      toast.error('Tahun ajaran wajib diisi dengan format YYYY/YYYY (contoh: 2025/2026)')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from('akhlaq').upsert({
        santri_id: selectedSantri.id,
        pengampu_id: currentUser.id,
        semester: formSemester,
        tahun_ajaran: formTahunAjaran,
        nilai: nilaiNum,
        updated_at: new Date().toISOString()
      }, { onConflict: 'santri_id,semester,tahun_ajaran' })

      if (error) throw error

      toast.success('Nilai akhlaq berhasil disimpan')
      setIsModalOpen(false)
      fetchAkhlaqRecords()
    } catch (error) {
      console.error('Upsert akhlaq error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal menyimpan nilai akhlaq'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Table Columns
  const columns: TableColumn<SantriWithAkhlaq>[] = [
    {
      key: 'nama_santri',
      header: 'Nama Santri',
      render: (item) => (
        <span className="font-bold text-gray-900">{item.nama_lengkap}</span>
      ),
    },
    {
      key: 'kelas',
      header: 'Kelas',
      render: (item) => <span className="text-gray-700">{item.kelas}</span>,
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
      key: 'nilai_akhlaq',
      header: 'Nilai Akhlaq',
      render: (item) => {
        const record = item.akhlaqRecord
        if (record && record.nilai !== undefined && record.nilai !== null) {
          return (
            <span className="font-bold text-emerald-600 text-lg">
              {record.nilai}
            </span>
          )
        }
        return (
          <span className="text-sm italic text-gray-400 font-medium">
            Belum diisi
          </span>
        )
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => {
        const hasRecord = !!item.akhlaqRecord
        return (
          <Button
            variant={hasRecord ? 'secondary' : 'primary'}
            size="sm"
            rounded="full"
            onClick={() => openInputModal(item)}
            className="flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {hasRecord ? 'Edit Nilai' : 'Input Nilai'}
          </Button>
        )
      },
    },
  ]

  if (userLoading || (isLoading && isAkhlaqActive === null)) {
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
            Penilaian Akhlaq Santri
          </h1>
          <p className="text-sm font-semibold text-[#6B7280] mt-1">
            Halaqah: {halaqah.nama_halaqah} ({halaqah.grade.toUpperCase()})
          </p>
        </div>

        {/* Filters Selectors */}
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
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
          Daftar Nilai Akhlaq — Semester {selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} {selectedTahunAjaran}
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

      {/* Input/Edit Akhlaq Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSantri?.akhlaqRecord ? `Edit Nilai Akhlaq — ${selectedSantri.nama_lengkap}` : `Input Nilai Akhlaq — ${selectedSantri?.nama_lengkap}`}
        size="md"
      >
        {selectedSantri && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl space-y-2">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#92400E] leading-relaxed">
                  <p className="font-bold mb-1">Panduan Pengisian Akhlaq</p>
                  <p>Masukkan satu nilai representasi akhlaq santri dalam rentang 0 sampai 100.</p>
                </div>
              </div>
            </div>

            {/* Input Nilai */}
            <div className="space-y-1.5">
              <label htmlFor="nilai" className="text-xs font-semibold text-gray-700">
                Nilai Akhlaq (0-100) <span className="text-red-500">*</span>
              </label>
              <Input
                id="nilai"
                type="number"
                min="0"
                max="100"
                required
                placeholder="Contoh: 85"
                value={formNilai}
                onChange={(e) => setFormNilai(e.target.value)}
              />
            </div>

            {/* Input Semester */}
            <div className="space-y-1.5">
              <label htmlFor="semester" className="text-xs font-semibold text-gray-700">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                id="semester"
                required
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[10px_14px] text-sm focus:border-2 focus:border-[#10B981] outline-none"
                value={formSemester}
                onChange={(e) => setFormSemester(e.target.value as 'ganjil' | 'genap')}
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>

            {/* Input Tahun Ajaran */}
            <div className="space-y-1.5">
              <label htmlFor="tahunAjaran" className="text-xs font-semibold text-gray-700">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Input
                id="tahunAjaran"
                type="text"
                required
                placeholder="Format: YYYY/YYYY (contoh: 2025/2026)"
                value={formTahunAjaran}
                onChange={(e) => setFormTahunAjaran(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                rounded="full"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                rounded="full"
                isLoading={isSaving}
              >
                Simpan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
