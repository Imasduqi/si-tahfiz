'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { useUser } from '@/hooks/use-user'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface SantriWithRelations {
  id: string
  nama_lengkap: string
  kelas: string
  grade: 'tahsin' | 'takmil' | 'tahfiz'
  halaqah_id: string
  orang_tua_id: string | null
  created_at: string
  halaqah: {
    id: string
    nama_halaqah: string
    grade: string
  } | null
  orang_tua: {
    id: string
    nama_lengkap: string
    nomor_hp: string
  } | null
}

interface HalaqahOption {
  id: string
  nama_halaqah: string
  grade: string
}

interface OrangTuaOption {
  id: string
  nama_lengkap: string
  nomor_hp: string
}

export default function TuDataSantriPage() {
  const supabase = createClient()
  const { user } = useUser()

  // Data State
  const [santriList, setSantriList] = useState<SantriWithRelations[]>([])
  const [halaqahList, setHalaqahList] = useState<HalaqahOption[]>([])
  const [orangTuaList, setOrangTuaList] = useState<OrangTuaOption[]>([])
  
  // Loading & Filter State
  const [isLoading, setIsLoading] = useState(true)
  const [halaqahFilter, setHalaqahFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Selected state
  const [selectedSantri, setSelectedSantri] = useState<SantriWithRelations | null>(null)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formKelas, setFormKelas] = useState('')
  const [formGrade, setFormGrade] = useState<'tahsin' | 'takmil' | 'tahfiz'>('tahsin')
  const [formHalaqahId, setFormHalaqahId] = useState('')
  const [formOrangTuaId, setFormOrangTuaId] = useState('')

  // Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch halaqah list
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select('id, nama_halaqah, grade')
        .order('nama_halaqah')
      if (halaqahError) throw halaqahError
      setHalaqahList(halaqahData || [])

      // 2. Fetch orang tua list
      const { data: ortuData, error: ortuError } = await supabase
        .from('orang_tua')
        .select('id, nama_lengkap, nomor_hp')
        .order('nama_lengkap')
      if (ortuError) throw ortuError
      setOrangTuaList(ortuData || [])

      // 3. Fetch santri list with joins
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select(`
          *,
          halaqah (id, nama_halaqah, grade),
          orang_tua (id, nama_lengkap, nomor_hp)
        `)
        .order('nama_lengkap')
      if (santriError) throw santriError
      setSantriList((santriData as unknown as SantriWithRelations[]) || [])

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal memuat data: ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open modals helper
  const handleOpenAdd = () => {
    setSelectedSantri(null)
    setFormName('')
    setFormKelas('')
    setFormGrade('tahsin')
    // Set default halaqah if available
    setFormHalaqahId(halaqahList[0]?.id || '')
    setFormOrangTuaId('')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenEdit = (santri: SantriWithRelations) => {
    setSelectedSantri(santri)
    setFormName(santri.nama_lengkap)
    setFormKelas(santri.kelas)
    setFormGrade(santri.grade)
    setFormHalaqahId(santri.halaqah_id)
    setFormOrangTuaId(santri.orang_tua_id || '')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenDelete = (santri: SantriWithRelations) => {
    setSelectedSantri(santri)
    setIsDeleteOpen(true)
  }

  // Handle Form Submission - Create / Update
  const handleSaveSantri = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Validation
    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi.'
    }
    if (!formKelas.trim()) {
      errors.kelas = 'Kelas wajib diisi.'
    }
    if (!formGrade) {
      errors.grade = 'Grade wajib diisi.'
    }
    if (!formHalaqahId) {
      errors.halaqah_id = 'Halaqah wajib diisi.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitLoading(true)

      const payload = {
        nama_lengkap: formName.trim(),
        kelas: formKelas.trim(),
        grade: formGrade,
        halaqah_id: formHalaqahId,
        orang_tua_id: formOrangTuaId || null
      }

      if (selectedSantri) {
        const { error } = await supabase
          .from('santri')
          .update(payload)
          .eq('id', selectedSantri.id)

        if (error) throw error
        toast.success('Data santri berhasil diperbarui.')
      } else {
        const { error } = await supabase
          .from('santri')
          .insert(payload)

        if (error) throw error
        toast.success('Santri baru berhasil ditambahkan.')
      }

      setIsAddEditOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan data: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Handle Delete
  const handleDeleteSantri = async () => {
    if (!selectedSantri) return

    try {
      setIsSubmitLoading(true)

      // Delete santri from database
      const { error } = await supabase
        .from('santri')
        .delete()
        .eq('id', selectedSantri.id)

      if (error) throw error

      // Write to audit_trail
      if (user?.id) {
        await supabase.from('audit_trail').insert({
          user_id: user.id,
          aktivitas: `Hapus santri: ${selectedSantri.nama_lengkap}`
        })
      }

      toast.success(`Data santri ${selectedSantri.nama_lengkap} berhasil dihapus.`)
      setIsDeleteOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus santri: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Client-side Filter & Search
  const filteredSantri = santriList.filter((s) => {
    const matchesHalaqah = halaqahFilter === 'all' || s.halaqah_id === halaqahFilter
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter
    const matchesSearch = s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesHalaqah && matchesGrade && matchesSearch
  })

  // Grade labels helper
  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'tahsin': return 'Tahsin'
      case 'takmil': return 'Takmil'
      case 'tahfiz': return 'Tahfiz'
      default: return grade
    }
  }

  // Empty state check for halaqah
  if (!isLoading && halaqahList.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Halaqah"
        description="Tambah halaqah terlebih dahulu di menu Data Halaqah sebelum dapat mengelola data santri."
        action={
          <Link href="/tu/data/halaqah">
            <Button className="rounded-md">Tambah Halaqah</Button>
          </Link>
        }
      />
    )
  }

  const columns = [
    {
      key: 'no',
      header: 'No',
      render: (_: unknown, index: number) => index + 1
    },
    {
      key: 'nama_lengkap',
      header: 'Nama Lengkap'
    },
    {
      key: 'kelas',
      header: 'Kelas'
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item: SantriWithRelations) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
          item.grade === 'tahsin' ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' :
          item.grade === 'takmil' ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' :
          'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
        }`}>
          {getGradeLabel(item.grade)}
        </span>
      )
    },
    {
      key: 'halaqah',
      header: 'Halaqah',
      render: (item: SantriWithRelations) => item.halaqah?.nama_halaqah || '-'
    },
    {
      key: 'orang_tua',
      header: 'Orang Tua',
      render: (item: SantriWithRelations) => 
        item.orang_tua ? `${item.orang_tua.nama_lengkap} (${item.orang_tua.nomor_hp})` : '-'
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: SantriWithRelations) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleOpenDelete(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Data Santri</h1>
          <p className="text-xs text-[#6B7280]">Kelola biodata santri, jenjang, halaqah, dan wali murid</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 py-2.5 px-4 self-start sm:self-auto rounded-md shadow-none"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Santri</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        {/* Filter by Halaqah */}
        <div className="w-full sm:w-[200px]">
          <select
            value={halaqahFilter}
            onChange={(e) => setHalaqahFilter(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
          >
            <option value="all">Semua Halaqah</option>
            {halaqahList.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nama_halaqah} ({getGradeLabel(h.grade)})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Grade */}
        <div className="w-full sm:w-[150px]">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
          >
            <option value="all">Semua Grade</option>
            <option value="tahsin">Tahsin</option>
            <option value="takmil">Takmil</option>
            <option value="tahfiz">Tahfiz</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-[13px]" />
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:pl-[39px] focus:pr-[13px] focus:py-[9px]"
          />
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4 bg-white">
          <div className="flex space-x-4">
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-8 w-1/2" />
          </div>
          <div className="space-y-2">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredSantri}
          empty="Tidak ada data santri yang cocok dengan filter atau pencarian."
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedSantri ? 'Edit Biodata Santri' : 'Tambah Santri'}
        size="md"
        className="shadow-none p-4"
      >
        <form onSubmit={handleSaveSantri} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Masukkan nama lengkap santri"
            error={formErrors.nama_lengkap}
            required
            autoFocus
          />

          <Input
            label="Kelas"
            value={formKelas}
            onChange={(e) => setFormKelas(e.target.value)}
            placeholder="Contoh: 7A, 8B"
            error={formErrors.kelas}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Grade
            </label>
            <select
              value={formGrade}
              onChange={(e) => setFormGrade(e.target.value as 'tahsin' | 'takmil' | 'tahfiz')}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              <option value="tahsin">Tahsin</option>
              <option value="takmil">Takmil</option>
              <option value="tahfiz">Tahfiz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Halaqah
            </label>
            <select
              value={formHalaqahId}
              onChange={(e) => setFormHalaqahId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              {halaqahList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nama_halaqah} ({getGradeLabel(h.grade)})
                </option>
              ))}
            </select>
            {formErrors.halaqah_id && (
              <span className="block mt-1 text-xs text-[#EF4444] font-medium">
                {formErrors.halaqah_id}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Orang Tua / Wali
            </label>
            <select
              value={formOrangTuaId}
              onChange={(e) => setFormOrangTuaId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              <option value="">-- Tanpa Hubungan Orang Tua --</option>
              {orangTuaList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama_lengkap} ({o.nomor_hp})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddEditOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitLoading}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Santri"
        size="sm"
        className="shadow-none p-4"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151]">
            Apakah Anda yakin ingin menghapus data santri <strong>{selectedSantri?.nama_lengkap}</strong>?
          </p>
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs rounded-lg font-medium leading-relaxed">
            Menghapus santri akan menghapus seluruh data setoran, absensi, tikrar, UKJ, UAS, dan akhlaq santri ini. Yakin?
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSantri}
              isLoading={isSubmitLoading}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
