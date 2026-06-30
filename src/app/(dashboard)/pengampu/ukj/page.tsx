'use client'

import React, { useEffect, useState } from 'react'
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
import { formatDateShort } from '@/lib/utils'
import { Plus, Edit2, AlertCircle } from 'lucide-react'
import { Santri, Halaqah, Ukj } from '@/types'

interface UkjWithSantri extends Ukj {
  santri: {
    nama_lengkap: string
    kelas: string
    grade: string
  }
}

export default function PengampuUkjPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [ukjList, setUkjList] = useState<UkjWithSantri[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUkj, setSelectedUkj] = useState<UkjWithSantri | null>(null)

  // Form states
  const [formSantriId, setFormSantriId] = useState('')
  const [formNomorJuz, setFormNomorJuz] = useState('')
  const [formNilai, setFormNilai] = useState('')
  const [formStatusSantri, setFormStatusSantri] = useState<'lulus' | 'mengulang'>('lulus')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch page data
  const fetchData = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      // 1. Get halaqah
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

        // 2. Get santri
        const { data: santriData, error: santriError } = await supabase
          .from('santri')
          .select('*')
          .eq('halaqah_id', halaqahData.id)
          .order('nama_lengkap')

        if (santriError) throw santriError
        setSantriList(santriData || [])

        if (santriData && santriData.length > 0) {
          const santriIds = santriData.map(s => s.id)
          
          // 3. Get UKJ records
          const { data: ukjData, error: ukjError } = await supabase
            .from('ukj')
            .select('*, santri(nama_lengkap, kelas, grade)')
            .in('santri_id', santriIds)
            .order('created_at', { ascending: false })

          if (ukjError) throw ukjError
          setUkjList((ukjData as unknown as UkjWithSantri[]) || [])
        } else {
          setUkjList([])
        }
      }
    } catch (error) {
      console.error('Fetch data error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal memuat data UKJ'
      toast.error(msg)
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

  const openInputModal = () => {
    if (santriList.length === 0) {
      toast.error('Tidak ada santri di halaqah Anda.')
      return
    }
    setFormSantriId(santriList[0].id)
    setFormNomorJuz('')
    setFormNilai('')
    setFormStatusSantri('lulus')
    setIsInputModalOpen(true)
  }

  const openEditModal = (ukj: UkjWithSantri) => {
    setSelectedUkj(ukj)
    setFormSantriId(ukj.santri_id)
    setFormNomorJuz(ukj.nomor_juz.toString())
    setFormNilai(ukj.nilai.toString())
    setFormStatusSantri(ukj.status_santri)
    setIsEditModalOpen(true)
  }

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Validation
    if (!formSantriId) {
      toast.error('Pilih santri terlebih dahulu')
      return
    }

    const juzNum = parseInt(formNomorJuz)
    if (isNaN(juzNum) || juzNum < 1 || juzNum > 30) {
      toast.error('Nomor juz tidak valid (harus 1-30)')
      return
    }

    const nilaiNum = parseInt(formNilai)
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
      toast.error('Nilai harus antara 0 dan 100')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('ukj').insert({
        santri_id: formSantriId,
        pengampu_id: currentUser.id,
        nomor_juz: juzNum,
        nilai: nilaiNum,
        status_santri: formStatusSantri,
        status_approval: 'pending'
      })

      if (error) throw error

      toast.success('Hasil UKJ berhasil diinput, menunggu persetujuan koordinator')
      setIsInputModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Input UKJ error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal menginput hasil UKJ'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUkj) return

    const juzNum = parseInt(formNomorJuz)
    if (isNaN(juzNum) || juzNum < 1 || juzNum > 30) {
      toast.error('Nomor juz tidak valid (harus 1-30)')
      return
    }

    const nilaiNum = parseInt(formNilai)
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
      toast.error('Nilai harus antara 0 dan 100')
      return
    }

    setIsSubmitting(true)
    try {
      // Guard Check: only update if status_approval is still 'pending'
      const { data, error } = await supabase
        .from('ukj')
        .update({
          nomor_juz: juzNum,
          nilai: nilaiNum,
          status_santri: formStatusSantri
        })
        .eq('id', selectedUkj.id)
        .eq('status_approval', 'pending')
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('UKJ sudah diproses koordinator, tidak dapat diedit')
        setIsEditModalOpen(false)
        fetchData()
      } else {
        toast.success('Hasil UKJ berhasil diubah')
        setIsEditModalOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error('Edit UKJ error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal mengedit hasil UKJ'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Define Table Columns
  const columns: TableColumn<UkjWithSantri>[] = [
    {
      key: 'nama_santri',
      header: 'Nama Santri',
      render: (item) => (
        <span className="font-semibold text-gray-900">
          {item.santri?.nama_lengkap || '-'}
        </span>
      ),
    },
    {
      key: 'kelas',
      header: 'Kelas',
      render: (item) => <span>{item.santri?.kelas || '-'}</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item) => (
        <span className="capitalize">{item.santri?.grade || '-'}</span>
      ),
    },
    {
      key: 'nomor_juz',
      header: 'Nomor Juz',
      render: (item) => (
        <span className="font-medium text-gray-800">Juz {item.nomor_juz}</span>
      ),
    },
    {
      key: 'nilai',
      header: 'Nilai',
      render: (item) => (
        <span className="font-semibold text-gray-800">{item.nilai}</span>
      ),
    },
    {
      key: 'status_santri',
      header: 'Status Santri',
      render: (item) => {
        const isLulus = item.status_santri === 'lulus'
        return (
          <Badge variant={isLulus ? 'success' : 'danger'}>
            {isLulus ? 'Lulus' : 'Mengulang'}
          </Badge>
        )
      },
    },
    {
      key: 'status_approval',
      header: 'Status Approval',
      render: (item) => {
        if (item.status_approval === 'pending') {
          return <Badge variant="warning">Menunggu Persetujuan</Badge>
        }
        if (item.status_approval === 'approved') {
          return <Badge variant="success">Disetujui</Badge>
        }
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="danger">Ditolak</Badge>
            {item.alasan_penolakan && (
              <span
                className="text-[11px] text-[#EF4444] font-medium leading-tight max-w-[180px] bg-red-50 border border-red-100 rounded px-1.5 py-0.5"
                title={item.alasan_penolakan}
              >
                Alasan: {item.alasan_penolakan}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (item) => <span>{formatDateShort(item.created_at)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => {
        if (item.status_approval === 'pending') {
          return (
            <Button
              variant="secondary"
              size="sm"
              rounded="lg"
              onClick={() => openEditModal(item)}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          )
        }
        return <span className="text-gray-400 text-xs">-</span>
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
            Ujian Kenaikan Juz (UKJ)
          </h1>
          <p className="text-sm font-semibold text-[#6B7280] mt-1">
            Halaqah: {halaqah.nama_halaqah} ({halaqah.grade.toUpperCase()})
          </p>
        </div>

        <Button
          variant="primary"
          rounded="lg"
          onClick={openInputModal}
          className="flex items-center gap-2 self-start md:self-auto bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Input UKJ
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Daftar Riwayat Ujian</h2>
        
        <Table
          columns={columns}
          data={ukjList}
          empty={{
            title: 'Belum ada data UKJ',
            description: 'Silakan input hasil Ujian Kenaikan Juz (UKJ) untuk santri di halaqah Anda.',
            action: (
              <Button variant="primary" rounded="lg" onClick={openInputModal} className="bg-[#10B981] hover:bg-[#059669]">
                Input Hasil UKJ
              </Button>
            ),
          }}
        />
      </div>

      {/* Input UKJ Modal */}
      <Modal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        title="Input Hasil UKJ"
        size="md"
      >
        <form onSubmit={handleInputSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Santri <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={formSantriId}
              onChange={(e) => setFormSantriId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px]"
              required
            >
              {santriList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_lengkap} (Kelas {s.kelas} - {s.grade.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Juz (1-30) *"
              type="number"
              min="1"
              max="30"
              placeholder="e.g. 5"
              value={formNomorJuz}
              onChange={(e) => setFormNomorJuz(e.target.value)}
              required
            />

            <Input
              label="Nilai (0-100) *"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 85"
              value={formNilai}
              onChange={(e) => setFormNilai(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Status Hasil Ujian <span className="text-[#EF4444]">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="status_santri"
                  value="lulus"
                  checked={formStatusSantri === 'lulus'}
                  onChange={() => setFormStatusSantri('lulus')}
                  className="w-4 h-4 text-[#10B981] focus:ring-[#10B981]"
                />
                Lulus
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="status_santri"
                  value="mengulang"
                  checked={formStatusSantri === 'mengulang'}
                  onChange={() => setFormStatusSantri('mengulang')}
                  className="w-4 h-4 text-[#10B981] focus:ring-[#10B981]"
                />
                Mengulang
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              rounded="lg"
              isLoading={isSubmitting}
              className="flex-1 bg-[#10B981] hover:bg-[#059669]"
            >
              Simpan Hasil Ujian
            </Button>
            <Button
              type="button"
              variant="secondary"
              rounded="lg"
              disabled={isSubmitting}
              onClick={() => setIsInputModalOpen(false)}
              className="w-[100px] border border-gray-200"
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit UKJ Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Hasil UKJ"
        size="md"
      >
        {selectedUkj && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#92400E]">
                <p className="font-bold mb-0.5">Peringatan Guard</p>
                <p>
                  Perubahan data hanya dapat dilakukan jika status approval masih{' '}
                  <strong>Menunggu Persetujuan</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Santri
              </label>
              <Input
                value={selectedUkj.santri?.nama_lengkap || ''}
                disabled
                className="bg-gray-100 border border-gray-200 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor Juz (1-30) *"
                type="number"
                min="1"
                max="30"
                value={formNomorJuz}
                onChange={(e) => setFormNomorJuz(e.target.value)}
                required
              />

              <Input
                label="Nilai (0-100) *"
                type="number"
                min="0"
                max="100"
                value={formNilai}
                onChange={(e) => setFormNilai(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Status Hasil Ujian <span className="text-[#EF4444]">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_status_santri"
                    value="lulus"
                    checked={formStatusSantri === 'lulus'}
                    onChange={() => setFormStatusSantri('lulus')}
                    className="w-4 h-4 text-[#10B981] focus:ring-[#10B981]"
                  />
                  Lulus
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_status_santri"
                    value="mengulang"
                    checked={formStatusSantri === 'mengulang'}
                    onChange={() => setFormStatusSantri('mengulang')}
                    className="w-4 h-4 text-[#10B981] focus:ring-[#10B981]"
                  />
                  Mengulang
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                rounded="lg"
                isLoading={isSubmitting}
                className="flex-1 bg-[#10B981] hover:bg-[#059669]"
              >
                Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="secondary"
                rounded="lg"
                disabled={isSubmitting}
                onClick={() => setIsEditModalOpen(false)}
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
