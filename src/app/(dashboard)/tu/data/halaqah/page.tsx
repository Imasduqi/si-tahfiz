'use client'

import React, { useEffect, useState , useMemo} from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { useUser } from '@/hooks/use-user'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface HalaqahWithRelations {
  id: string
  nama_halaqah: string
  grade: 'tahsin' | 'takmil' | 'tahfiz'
  pengampu_id: string
  created_at: string
  profiles: {
    nama_lengkap: string
  } | null
  santri: {
    count: number
  }[] | null
}

interface PengampuOption {
  id: string
  nama_lengkap: string
}

export default function TuDataHalaqahPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()

  // State
  const [halaqahList, setHalaqahList] = useState<HalaqahWithRelations[]>([])
  const [pengampuList, setPengampuList] = useState<PengampuOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Selected state
  const [selectedHalaqah, setSelectedHalaqah] = useState<HalaqahWithRelations | null>(null)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formGrade, setFormGrade] = useState<'tahsin' | 'takmil' | 'tahfiz'>('tahsin')
  const [formPengampuId, setFormPengampuId] = useState('')

  // Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch Halaqah & Pengampu lists
  const fetchData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch pengampu profiles
      const { data: pengampuData, error: pengampuError } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('role', 'pengampu')
        .order('nama_lengkap')

      if (pengampuError) throw pengampuError
      setPengampuList(pengampuData || [])

      // 2. Fetch halaqah list with joins and santri counts
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select(`
          *,
          profiles (nama_lengkap),
          santri (count)
        `)
        .order('nama_halaqah')

      if (halaqahError) throw halaqahError
      setHalaqahList((halaqahData as unknown as HalaqahWithRelations[]) || [])

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengambil data: ' + errorMsg)
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
    setSelectedHalaqah(null)
    setFormName('')
    setFormGrade('tahsin')
    setFormPengampuId(pengampuList[0]?.id || '')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenEdit = (halaqah: HalaqahWithRelations) => {
    setSelectedHalaqah(halaqah)
    setFormName(halaqah.nama_halaqah)
    setFormGrade(halaqah.grade)
    setFormPengampuId(halaqah.pengampu_id)
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  // Check santri count before showing delete confirmation
  const handleInitiateDelete = async (halaqah: HalaqahWithRelations) => {
    try {
      const { count, error } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .eq('halaqah_id', halaqah.id)

      if (error) throw error

      if (count && count > 0) {
        toast.error('Halaqah tidak dapat dihapus karena masih memiliki santri aktif')
        return
      }

      // If count is 0, proceed to open delete confirmation modal
      setSelectedHalaqah(halaqah)
      setIsDeleteOpen(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal memeriksa jumlah santri: ' + errorMsg)
    }
  }

  // Handle Form Submission - Create / Update
  const handleSaveHalaqah = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Validation
    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.nama_halaqah = 'Nama halaqah wajib diisi.'
    }
    if (!formGrade) {
      errors.grade = 'Grade wajib diisi.'
    }
    if (!formPengampuId) {
      errors.pengampu_id = 'Pengampu wajib dipilih.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitLoading(true)

      const payload = {
        nama_halaqah: formName.trim(),
        grade: formGrade,
        pengampu_id: formPengampuId
      }

      if (selectedHalaqah) {
        const { error } = await supabase
          .from('halaqah')
          .update(payload)
          .eq('id', selectedHalaqah.id)

        if (error) throw error
        toast.success('Halaqah berhasil diperbarui.')
      } else {
        const { error } = await supabase
          .from('halaqah')
          .insert(payload)

        if (error) throw error
        toast.success('Halaqah baru berhasil ditambahkan.')
      }

      setIsAddEditOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan data halaqah: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Handle Delete
  const handleDeleteHalaqah = async () => {
    if (!selectedHalaqah) return

    try {
      setIsSubmitLoading(true)

      const { error } = await supabase
        .from('halaqah')
        .delete()
        .eq('id', selectedHalaqah.id)

      if (error) throw error

      // Write to audit_trail
      if (user?.id) {
        await supabase.from('audit_trail').insert({
          user_id: user.id,
          aktivitas: `Hapus halaqah: ${selectedHalaqah.nama_halaqah}`
        })
      }

      toast.success(`Halaqah ${selectedHalaqah.nama_halaqah} berhasil dihapus.`)
      setIsDeleteOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus halaqah: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Grade labels helper
  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'tahsin': return 'Tahsin'
      case 'takmil': return 'Takmil'
      case 'tahfiz': return 'Tahfiz'
      default: return grade
    }
  }

  // Empty state check for pengampu
  if (!isLoading && pengampuList.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Akun Pengampu"
        description="Tambah akun pengampu terlebih dahulu di menu Akun sebelum dapat mengelola data halaqah."
        action={
          <Link href="/tu/akun">
            <Button className="rounded-md">Kelola Akun</Button>
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
      key: 'nama_halaqah',
      header: 'Nama Halaqah'
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item: HalaqahWithRelations) => (
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
      key: 'pengampu',
      header: 'Pengampu',
      render: (item: HalaqahWithRelations) => item.profiles?.nama_lengkap || '-'
    },
    {
      key: 'jumlah_santri',
      header: 'Jumlah Santri',
      render: (item: HalaqahWithRelations) => item.santri?.[0]?.count ?? 0
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: HalaqahWithRelations) => (
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
            onClick={() => handleInitiateDelete(item)}
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
          <h1 className="text-xl font-bold text-[#111827]">Data Halaqah</h1>
          <p className="text-xs text-[#6B7280]">Kelola rombongan belajar halaqah beserta pengampunya</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 py-2.5 px-4 self-start sm:self-auto rounded-md shadow-none"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Halaqah</span>
        </Button>
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
          data={halaqahList}
          empty="Belum ada data halaqah."
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedHalaqah ? 'Edit Halaqah' : 'Tambah Halaqah'}
        size="md"
        className="shadow-none p-4"
      >
        <form onSubmit={handleSaveHalaqah} className="space-y-4">
          <Input
            label="Nama Halaqah"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Masukkan nama halaqah (contoh: Halaqah Al-Fatih)"
            error={formErrors.nama_halaqah}
            required
            autoFocus
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
              Pengampu
            </label>
            <select
              value={formPengampuId}
              onChange={(e) => setFormPengampuId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              {pengampuList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_lengkap}
                </option>
              ))}
            </select>
            {formErrors.pengampu_id && (
              <span className="block mt-1 text-xs text-[#EF4444] font-medium">
                {formErrors.pengampu_id}
              </span>
            )}
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
        title="Konfirmasi Hapus Halaqah"
        size="sm"
        className="shadow-none p-4"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151]">
            Apakah Anda yakin ingin menghapus halaqah <strong>{selectedHalaqah?.nama_halaqah}</strong>?
          </p>
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs rounded-lg font-medium leading-relaxed">
            Halaqah yang dihapus tidak memiliki santri aktif. Tindakan ini permanen dan tidak dapat dibatalkan.
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
              onClick={handleDeleteHalaqah}
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
