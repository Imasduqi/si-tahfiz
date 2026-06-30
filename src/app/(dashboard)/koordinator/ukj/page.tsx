'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Table, TableColumn } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonTable } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { formatDateShort } from '@/lib/utils'
import { Check, X, AlertCircle } from 'lucide-react'
import { Ukj } from '@/types'

interface UkjWithDetails extends Ukj {
  santri: {
    nama_lengkap: string
    kelas: string
    grade: string
    halaqah: {
      nama_halaqah: string
    }
  }
  profiles: {
    nama_lengkap: string
  }
}

export default function KoordinatorUkjPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [ukjList, setUkjList] = useState<UkjWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'riwayat'>('pending')

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedUkj, setSelectedUkj] = useState<UkjWithDetails | null>(null)
  
  // Rejection reason form state
  const [alasanPenolakan, setAlasanPenolakan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all UKJ records across all halaqah
  const fetchUkjList = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('ukj')
        .select(`
          *,
          santri(nama_lengkap, kelas, grade, halaqah(nama_halaqah)),
          profiles!ukj_pengampu_id_fkey(nama_lengkap)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUkjList((data as unknown as UkjWithDetails[]) || [])
    } catch (error) {
      console.error('Fetch UKJ error:', error)
      toast.error('Gagal memuat data UKJ')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userLoading) {
      fetchUkjList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userLoading])

  const pendingList = ukjList.filter(item => item.status_approval === 'pending')
  const riwayatList = ukjList.filter(item => item.status_approval === 'approved' || item.status_approval === 'rejected')

  const openApproveModal = (ukj: UkjWithDetails) => {
    setSelectedUkj(ukj)
    setIsApproveModalOpen(true)
  }

  const openRejectModal = (ukj: UkjWithDetails) => {
    setSelectedUkj(ukj)
    setAlasanPenolakan('')
    setIsRejectModalOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedUkj || !currentUser) return

    setIsSubmitting(true)
    try {
      // Guard Check: only update if status_approval is still 'pending'
      const { data, error } = await supabase
        .from('ukj')
        .update({
          status_approval: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedUkj.id)
        .eq('status_approval', 'pending')
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('UKJ gagal disetujui. Mungkin data sudah diproses atau diubah.')
        setIsApproveModalOpen(false)
        fetchUkjList()
      } else {
        // Insert to audit_trail
        await supabase.from('audit_trail').insert({
          user_id: currentUser.id,
          aktivitas: `Approve UKJ: ${selectedUkj.santri?.nama_lengkap} Juz ${selectedUkj.nomor_juz}`
        })

        toast.success(`Berhasil menyetujui UKJ ${selectedUkj.santri?.nama_lengkap}`)
        setIsApproveModalOpen(false)
        fetchUkjList()
      }
    } catch (error) {
      console.error('Approve error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal memproses persetujuan'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUkj || !currentUser) return

    if (alasanPenolakan.trim().length < 10) {
      toast.error('Alasan penolakan minimal 10 karakter')
      return
    }

    setIsSubmitting(true)
    try {
      // Guard Check: only update if status_approval is still 'pending'
      const { data, error } = await supabase
        .from('ukj')
        .update({
          status_approval: 'rejected',
          alasan_penolakan: alasanPenolakan.trim(),
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedUkj.id)
        .eq('status_approval', 'pending')
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('UKJ gagal ditolak. Mungkin data sudah diproses atau diubah.')
        setIsRejectModalOpen(false)
        fetchUkjList()
      } else {
        // Insert to audit_trail
        await supabase.from('audit_trail').insert({
          user_id: currentUser.id,
          aktivitas: `Reject UKJ: ${selectedUkj.santri?.nama_lengkap} Juz ${selectedUkj.nomor_juz} — ${alasanPenolakan.trim()}`
        })

        toast.success(`Berhasil menolak UKJ ${selectedUkj.santri?.nama_lengkap}`)
        setIsRejectModalOpen(false)
        fetchUkjList()
      }
    } catch (error) {
      console.error('Reject error:', error)
      const msg = error instanceof Error ? error.message : 'Gagal memproses penolakan'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pending Table Columns
  const pendingColumns: TableColumn<UkjWithDetails>[] = [
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
      key: 'halaqah',
      header: 'Halaqah',
      render: (item) => (
        <span>{item.santri?.halaqah?.nama_halaqah || '-'}</span>
      ),
    },
    {
      key: 'pengampu',
      header: 'Pengampu',
      render: (item) => <span>{item.profiles?.nama_lengkap || '-'}</span>,
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
      key: 'created_at',
      header: 'Tanggal Input',
      render: (item) => <span>{formatDateShort(item.created_at)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            rounded="lg"
            onClick={() => openApproveModal(item)}
            className="flex items-center gap-1 bg-[#10B981] hover:bg-[#059669] text-white py-1 px-2.5"
          >
            <Check className="w-3.5 h-3.5" />
            Setujui
          </Button>
          <Button
            variant="danger"
            size="sm"
            rounded="lg"
            onClick={() => openRejectModal(item)}
            className="flex items-center gap-1 bg-[#EF4444] hover:bg-[#DC2626] text-white py-1 px-2.5"
          >
            <X className="w-3.5 h-3.5" />
            Tolak
          </Button>
        </div>
      ),
    },
  ]

  // Riwayat Table Columns
  const riwayatColumns: TableColumn<UkjWithDetails>[] = [
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
      key: 'halaqah',
      header: 'Halaqah',
      render: (item) => (
        <span>{item.santri?.halaqah?.nama_halaqah || '-'}</span>
      ),
    },
    {
      key: 'pengampu',
      header: 'Pengampu',
      render: (item) => <span>{item.profiles?.nama_lengkap || '-'}</span>,
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
        const isApproved = item.status_approval === 'approved'
        return (
          <Badge variant={isApproved ? 'success' : 'danger'}>
            {isApproved ? 'Disetujui' : 'Ditolak'}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Tanggal Input',
      render: (item) => <span>{formatDateShort(item.created_at)}</span>,
    },
    {
      key: 'alasan_penolakan',
      header: 'Alasan Penolakan / Catatan',
      render: (item) => {
        if (item.status_approval === 'rejected') {
          return (
            <span className="text-sm text-red-600 font-medium">
              {item.alasan_penolakan || '-'}
            </span>
          )
        }
        return <span className="text-gray-400">-</span>
      },
    },
  ]

  if (userLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-6">
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
      <div className="max-w-7xl mx-auto p-8 text-center">
        <EmptyState
          title="Akses Ditolak"
          description="Silakan log in terlebih dahulu untuk mengakses halaman ini."
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
          Approval UKJ
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Kelola persetujuan hasil Ujian Kenaikan Juz (UKJ) santri dari seluruh halaqah.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E5E7EB] bg-gray-50">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-[#10B981] text-[#10B981] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending
            {pendingList.length > 0 && (
              <span className="bg-[#FEF3C7] text-[#92400E] text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'riwayat'
                ? 'border-[#10B981] text-[#10B981] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Riwayat
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pending' ? (
            <Table
              columns={pendingColumns}
              data={pendingList}
              empty={{
                title: 'Tidak ada UKJ yang menunggu persetujuan',
                description: 'Semua hasil ujian kenaikan juz yang diinput pengampu telah diproses.',
              }}
            />
          ) : (
            <Table
              columns={riwayatColumns}
              data={riwayatList}
              empty={{
                title: 'Belum ada riwayat persetujuan',
                description: 'Data UKJ yang telah disetujui atau ditolak akan tampil di sini.',
              }}
            />
          )}
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Setujui Hasil UKJ"
        size="md"
      >
        {selectedUkj && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
              <p>Apakah Anda yakin ingin menyetujui hasil UKJ berikut?</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1.5 text-xs font-medium text-gray-700">
                <p>Nama Santri: <span className="font-bold text-gray-900">{selectedUkj.santri?.nama_lengkap}</span></p>
                <p>Halaqah: <span className="font-bold text-gray-900">{selectedUkj.santri?.halaqah?.nama_halaqah}</span></p>
                <p>Pengampu: <span className="font-bold text-gray-900">{selectedUkj.profiles?.nama_lengkap}</span></p>
                <p>Nomor Juz: <span className="font-bold text-gray-900">Juz {selectedUkj.nomor_juz}</span></p>
                <p>Nilai: <span className="font-bold text-gray-900">{selectedUkj.nilai}</span></p>
                <p>Status: <span className="font-bold text-gray-900 capitalize">{selectedUkj.status_santri}</span></p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                rounded="lg"
                isLoading={isSubmitting}
                onClick={handleApprove}
                className="flex-1 bg-[#10B981] hover:bg-[#059669]"
              >
                Ya, Setujui
              </Button>
              <Button
                variant="secondary"
                rounded="lg"
                disabled={isSubmitting}
                onClick={() => setIsApproveModalOpen(false)}
                className="w-[100px] border border-gray-200"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Hasil UKJ"
        size="md"
      >
        {selectedUkj && (
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-red-50 border border-red-100 p-3.5 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 leading-relaxed">
                <p className="font-bold mb-0.5">Tindakan Penolakan</p>
                <p>
                  Anda akan menolak hasil UKJ untuk <strong>{selectedUkj.santri?.nama_lengkap}</strong> (Juz {selectedUkj.nomor_juz}).
                  Silakan berikan alasan penolakan yang jelas agar pengampu dapat melakukan perbaikan.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Alasan Penolakan <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={alasanPenolakan}
                onChange={(e) => setAlasanPenolakan(e.target.value)}
                className="w-full min-h-[100px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] resize-y"
                placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
                required
              />
              <span className="block mt-1 text-[11px] text-gray-500">
                Karakter saat ini: {alasanPenolakan.length} (minimal 10)
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="danger"
                rounded="lg"
                isLoading={isSubmitting}
                disabled={alasanPenolakan.trim().length < 10}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626]"
              >
                Tolak Hasil Ujian
              </Button>
              <Button
                type="button"
                variant="secondary"
                rounded="lg"
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
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
