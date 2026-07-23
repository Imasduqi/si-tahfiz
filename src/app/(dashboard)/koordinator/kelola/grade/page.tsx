'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Table, TableColumn } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonTable } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { Edit3, Info, ToggleLeft, ToggleRight, Sliders, Heart, Search } from 'lucide-react'
import { Santri, TargetGrade, Konfigurasi } from '@/types'

interface SantriWithHalaqah extends Santri {
  halaqah: {
    nama_halaqah: string
    grade: string
  } | null
}

export default function KoordinatorGradePage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Data States
  const [santriList, setSantriList] = useState<SantriWithHalaqah[]>([])
  const [targetGrades, setTargetGrades] = useState<TargetGrade[]>([])
  const [halaqahList, setHalaqahList] = useState<{ id: string; nama_halaqah: string }[]>([])
  const [config, setConfig] = useState<Konfigurasi | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [filterHalaqah, setFilterHalaqah] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [searchName, setSearchName] = useState('')

  // Modals state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<SantriWithHalaqah | null>(null)
  const [newGrade, setNewGrade] = useState<string>('')

  const [isToggleConfirmModalOpen, setIsToggleConfirmModalOpen] = useState(false)
  const [pendingToggleValue, setPendingToggleValue] = useState<boolean>(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all page data
  const fetchData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch konfigurasi
      const { data: configData, error: configError } = await supabase
        .from('konfigurasi')
        .select('*')
        .single()
      if (configError) throw configError
      setConfig(configData)

      // 2. Fetch target grades
      const { data: targetData, error: targetError } = await supabase
        .from('target_grade')
        .select('*')
        .order('tipe_setoran')
        .order('grade')
      if (targetError) throw targetError
      setTargetGrades(targetData || [])

      // 3. Fetch halaqah list for filter
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select('id, nama_halaqah')
        .order('nama_halaqah')
      if (halaqahError) throw halaqahError
      setHalaqahList(halaqahData || [])

      // 4. Fetch santri list
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap, kelas, grade, halaqah_id, halaqah(nama_halaqah, grade)')
        .order('nama_lengkap')
      if (santriError) throw santriError
      setSantriList((santriData as unknown as SantriWithHalaqah[]) || [])

    } catch (error) {
      console.error('Fetch grade management data error:', error)
      toast.error('Gagal memuat data pengelolaan grade')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userLoading) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userLoading])

  // Refetch santri list only
  const refetchSantriList = async () => {
    try {
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap, kelas, grade, halaqah_id, halaqah(nama_halaqah, grade)')
        .order('nama_lengkap')
      if (santriError) throw santriError
      setSantriList((santriData as unknown as SantriWithHalaqah[]) || [])
    } catch (error) {
      console.error('Refetch santri list error:', error)
    }
  }

  // Filter and search logic
  const filteredSantri = santriList.filter(s => {
    const matchesHalaqah = filterHalaqah === 'all' || s.halaqah_id === filterHalaqah
    const matchesGrade = filterGrade === 'all' || s.grade === filterGrade
    const matchesSearch = s.nama_lengkap.toLowerCase().includes(searchName.toLowerCase())
    return matchesHalaqah && matchesGrade && matchesSearch
  })

  // Target limit display helper
  const getTargetText = (grade: string) => {
    const sabak = targetGrades.find(tg => tg.grade === grade && tg.tipe_setoran === 'sabak')
    const sabki = targetGrades.find(tg => tg.grade === grade && tg.tipe_setoran === 'sabki')
    const manzil = targetGrades.find(tg => tg.grade === grade && tg.tipe_setoran === 'manzil')

    if (!sabak && !sabki && !manzil) return '-'

    const formatVal = (t?: TargetGrade) => {
      if (!t) return '-'
      return t.target_max !== null && t.target_max !== undefined
        ? `${t.target_min}-${t.target_max}`
        : `${t.target_min}`
    }

    return (
      <div className="flex flex-col gap-0.5 text-xs py-1">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-semibold w-12">Sabak:</span>
          <span className="font-medium text-gray-800">{formatVal(sabak)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-semibold w-12">Sabki:</span>
          <span className="font-medium text-gray-800">{formatVal(sabki)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-semibold w-12">Manzil:</span>
          <span className="font-medium text-gray-800">{formatVal(manzil)}</span>
        </div>
      </div>
    )
  }

  // Ubah Grade Modal functions
  const openGradeModal = (santri: SantriWithHalaqah) => {
    setSelectedSantri(santri)
    setNewGrade(santri.grade)
    setIsGradeModalOpen(true)
  }

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri) return

    if (newGrade === selectedSantri.grade) {
      toast.error('Grade tidak berubah')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('santri')
        .update({ grade: newGrade })
        .eq('id', selectedSantri.id)

      if (error) throw error

      // Audit trail insertion
      if (currentUser) {
        const { error: auditError } = await supabase.from('audit_trail').insert({
          user_id: currentUser.id,
          aktivitas: `Mengubah grade santri ${selectedSantri.nama_lengkap} dari ${selectedSantri.grade.toUpperCase()} ke ${newGrade.toUpperCase()}`
        })
        if (auditError) {
          console.error('Gagal mencatat audit trail:', auditError)
          toast.error('Aksi berhasil, namun gagal mencatat ke audit trail', { duration: 3000 })
        }
      }

      toast.success('Grade santri berhasil diperbarui')
      setIsGradeModalOpen(false)
      refetchSantriList()
    } catch (error) {
      console.error('Update grade error:', error)
      toast.error('Gagal memperbarui grade santri')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Target editing is managed by Staff TU. Read-only on Koordinator dashboard.

  // Toggle feature functions
  const handleToggleClick = (currentState: boolean) => {
    setPendingToggleValue(!currentState)
    setIsToggleConfirmModalOpen(true)
  }

  const handleToggleConfirm = async () => {
    if (!config) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('konfigurasi')
        .update({
          fitur_akhlaq_aktif: pendingToggleValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      // Audit trail insertion
      if (currentUser) {
        const { error: auditError } = await supabase.from('audit_trail').insert({
          user_id: currentUser.id,
          aktivitas: `${pendingToggleValue ? 'Mengaktifkan' : 'Menonaktifkan'} fitur penilaian akhlaq`
        })
        if (auditError) {
          console.error('Gagal mencatat audit trail:', auditError)
          toast.error('Aksi berhasil, namun gagal mencatat ke audit trail', { duration: 3000 })
        }
      }

      toast.success(`Fitur akhlaq berhasil ${pendingToggleValue ? 'diaktifkan' : 'dinonaktifkan'}`)
      
      // Update local state
      setConfig(prev => prev ? { ...prev, fitur_akhlaq_aktif: pendingToggleValue } : null)
      setIsToggleConfirmModalOpen(false)
    } catch (error) {
      console.error('Toggle fitur akhlaq error:', error)
      toast.error('Gagal mengubah pengaturan fitur akhlaq')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Table Columns
  const columns: TableColumn<SantriWithHalaqah>[] = [
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
      render: (item) => <span className="text-gray-700">{item.kelas}</span>,
    },
    {
      key: 'halaqah',
      header: 'Halaqah',
      render: (item) => (
        <span className="text-gray-700">
          {item.halaqah?.nama_halaqah || <span className="italic text-gray-400">Belum ada halaqah</span>}
        </span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade Saat Ini',
      render: (item) => (
        <Badge variant={item.grade === 'tahfiz' ? 'success' : item.grade === 'takmil' ? 'info' : 'warning'} className="capitalize">
          {item.grade}
        </Badge>
      ),
    },
    {
      key: 'target',
      header: 'Target Baris/Hari',
      render: (item) => getTargetText(item.grade),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openGradeModal(item)}
          className="flex items-center gap-1 text-xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Ubah Grade
        </Button>
      ),
    },
  ]

  if (userLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <LoadingSkeleton className="h-8 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="h-32 w-full" />
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
          Kelola Grade Santri
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Atur marhalah/grade (Tahsin, Takmil, Tahfiz), konfigurasi target hafalan harian, dan kontrol fitur penilaian akhlaq.
        </p>
      </div>

      {/* Top Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Konfigurasi Target Grade */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Konfigurasi Target Grade
            </h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-medium">
                Target dapat diubah oleh Staff TU di menu Konfigurasi.
              </p>
            </div>
            <div className="space-y-4">
              {['sabak', 'sabki', 'manzil'].map((tipe) => {
                const list = targetGrades.filter((t) => t.tipe_setoran === tipe)
                return (
                  <div key={tipe} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                      {tipe === 'sabak' ? 'Sabaq' : tipe === 'sabki' ? 'Sabqi' : 'Manzil'}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {list.map((target) => (
                        <div key={target.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-center">
                          <span className="text-xs font-semibold capitalize text-gray-700 block mb-0.5">{target.grade}</span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {target.target_max ? `${target.target_min}-${target.target_max}` : target.target_min} Baris
                          </span>
                        </div>
                      ))}
                      {list.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Belum ada data</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Fitur Penilaian Akhlaq */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              Fitur Penilaian Akhlaq
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Pengaturan ini mengontrol visibilitas menu penilaian Akhlaq pada dashboard Pengampu. Saat dinonaktifkan, Pengampu tidak dapat melakukan penginputan nilai Akhlaq santri.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Status fitur:</span>
              <Badge variant={config?.fitur_akhlaq_aktif ? 'success' : 'danger'}>
                {config?.fitur_akhlaq_aktif ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            
            <button
              onClick={() => handleToggleClick(!!config?.fitur_akhlaq_aktif)}
              className="focus:outline-none transition-colors"
              aria-label="Toggle Fitur Akhlaq"
            >
              {config?.fitur_akhlaq_aktif ? (
                <ToggleRight className="w-12 h-12 text-[#10B981] cursor-pointer hover:text-[#059669]" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-300 cursor-pointer hover:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Daftar Grade Santri
        </h2>

        {/* Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-[10px] text-sm focus:border-2 focus:border-[#10B981] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>

          <div>
            <select
              value={filterHalaqah}
              onChange={(e) => setFilterHalaqah(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-[10px] text-sm focus:border-2 focus:border-[#10B981] outline-none cursor-pointer"
            >
              <option value="all">Semua Halaqah</option>
              {halaqahList.map(h => (
                <option key={h.id} value={h.id}>{h.nama_halaqah}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-[10px] text-sm focus:border-2 focus:border-[#10B981] outline-none cursor-pointer"
            >
              <option value="all">Semua Grade</option>
              <option value="tahsin">Tahsin</option>
              <option value="takmil">Takmil</option>
              <option value="tahfiz">Tahfiz</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredSantri}
          empty={{
            title: 'Santri tidak ditemukan',
            description: 'Tidak ada data santri yang memenuhi filter pencarian Anda.',
          }}
        />
      </div>

      {/* Ubah Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`Ubah Grade — ${selectedSantri?.nama_lengkap}`}
        size="md"
      >
        {selectedSantri && (
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Grade Saat Ini:</span>
              <Badge variant={selectedSantri.grade === 'tahfiz' ? 'success' : selectedSantri.grade === 'takmil' ? 'info' : 'warning'} className="capitalize text-sm px-3 py-1">
                {selectedSantri.grade}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="gradeBaru" className="text-xs font-semibold text-gray-700">
                Pilih Grade Baru <span className="text-red-500">*</span>
              </label>
              <select
                id="gradeBaru"
                required
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[10px_14px] text-sm focus:border-2 focus:border-[#10B981] outline-none"
              >
                <option value="tahsin">Tahsin</option>
                <option value="takmil">Takmil</option>
                <option value="tahfiz">Tahfiz</option>
              </select>
            </div>

            {newGrade === selectedSantri.grade && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-lg text-xs text-[#991B1B] font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#EF4444]" />
                Grade tidak berubah
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsGradeModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={newGrade === selectedSantri.grade}
                isLoading={isSubmitting}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>


      {/* Toggle Confirmation Modal */}
      <Modal
        isOpen={isToggleConfirmModalOpen}
        onClose={() => setIsToggleConfirmModalOpen(false)}
        title={pendingToggleValue ? 'Aktifkan Fitur Penilaian Akhlaq?' : 'Nonaktifkan Fitur Penilaian Akhlaq?'}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-lg">
            <Info className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#92400E] leading-relaxed">
              <p className="font-bold mb-1">
                {pendingToggleValue ? 'Akan Mengaktifkan Fitur' : 'Akan Menonaktifkan Fitur'}
              </p>
              <p>
                {pendingToggleValue 
                  ? 'Fitur penilaian akhlaq akan diaktifkan. Menu akhlaq akan muncul di halaman pengampu. Lanjutkan?'
                  : 'Fitur penilaian akhlaq akan dinonaktifkan. Menu akhlaq akan disembunyikan dari halaman pengampu. Data akhlaq yang sudah diinput tetap tersimpan. Lanjutkan?'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsToggleConfirmModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleToggleConfirm}
              isLoading={isSubmitting}
              className="bg-[#10B981] hover:bg-[#059669] text-white"
            >
              Ya, Lanjutkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
