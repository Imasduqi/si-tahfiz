'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Table } from '@/components/ui/table'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { formatDateShort } from '@/lib/utils'
import { RefreshCw, CheckCircle, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react'
import { Santri, Tikrar } from '@/types'

export default function OrtuTikrarPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Children & Selected Child States
  const [anakList, setAnakList] = useState<Santri[]>([])
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null)

  // Tikrar Data States
  const [tikrarList, setTikrarList] = useState<Tikrar[]>([])
  const [historyList, setHistoryList] = useState<Tikrar[]>([])
  
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)
  const [confirmTikrar, setConfirmTikrar] = useState<Tikrar | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)

  // Initial load: Fetch Orang Tua's children
  useEffect(() => {
    let active = true

    async function initPage() {
      if (!currentUser) return
      setIsPageLoading(true)

      try {
        const { data: anakData, error: anakError } = await supabase
          .from('santri')
          .select('*')
          .eq('orang_tua_id', currentUser.id)
          .order('nama_lengkap')

        if (anakError) throw anakError

        if (active) {
          const children = anakData || []
          setAnakList(children)
          
          if (children.length > 0) {
            setSelectedAnakId(children[0].id)
          }
        }
      } catch (err) {
        console.error('Init page error:', err)
        toast.error('Gagal memuat data anak')
      } finally {
        if (active) setIsPageLoading(false)
      }
    }

    if (!userLoading) {
      initPage()
    }

    return () => {
      active = false
    }
  }, [currentUser, userLoading, supabase])

  // Fetch active & completed history Tikrars for a child
  const fetchTikrarData = useCallback(async (anakId: string) => {
    setIsDataFetching(true)
    try {
      // 1. Fetch active tikrars (status = 'wajib_rumah')
      const { data: activeData, error: activeError } = await supabase
        .from('tikrar')
        .select('*')
        .eq('santri_id', anakId)
        .eq('status', 'wajib_rumah')
        .order('tanggal', { ascending: false })

      if (activeError) throw activeError
      setTikrarList(activeData || [])

      // 2. Fetch completed tikrars (status = 'selesai_rumah') in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0]

      const { data: historyData, error: historyError } = await supabase
        .from('tikrar')
        .select('*')
        .eq('santri_id', anakId)
        .eq('status', 'selesai_rumah')
        .gte('tanggal', thirtyDaysAgoString)
        .order('tanggal', { ascending: false })

      if (historyError) throw historyError
      setHistoryList(historyData || [])
    } catch (err) {
      console.error('Fetch tikrar data error:', err)
      toast.error('Gagal memuat data Tikrar')
    } finally {
      setIsDataFetching(false)
    }
  }, [supabase])

  // Refetch whenever selectedAnakId changes
  useEffect(() => {
    if (selectedAnakId) {
      fetchTikrarData(selectedAnakId)
    }
  }, [selectedAnakId, fetchTikrarData])

  // Tab switch helper
  const handleTabSwitch = (anakId: string) => {
    setSelectedAnakId(anakId)
  }

  // Validate & update Tikrar to selesai_rumah
  const handleConfirmSelesai = async () => {
    if (!confirmTikrar || !selectedAnakId) return
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('tikrar')
        .update({
          status: 'selesai_rumah',
          diselesaikan_ortu_at: new Date().toISOString()
        })
        .eq('id', confirmTikrar.id)
        .eq('status', 'wajib_rumah') // Guard
        .select()

      if (error) throw error

      // If data is empty array, guard failed — status already changed
      if (!data || data.length === 0) {
        toast.error('Status Tikrar sudah berubah, memuat ulang data...')
        await fetchTikrarData(selectedAnakId)
        setConfirmTikrar(null)
        return
      }

      toast.success('Tikrar berhasil ditandai selesai di rumah')
      setConfirmTikrar(null)
      await fetchTikrarData(selectedAnakId)
    } catch (err) {
      console.error('Error validating tikrar:', err)
      toast.error('Gagal memproses validasi Tikrar')
    } finally {
      setIsSaving(false)
    }
  }

  // Active Tikrar Table Columns
  const activeColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (item: Tikrar) => (
        <span className="text-[#6B7280] font-medium">{formatDateShort(item.tanggal)}</span>
      )
    },
    {
      key: 'surah',
      header: 'Surah/Halaman',
      render: (item: Tikrar) => (
        <span className="font-semibold text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded-lg text-xs border border-[#E5E7EB]">
          {item.surah}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <Badge variant="warning">Wajib Rumah</Badge>
      )
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: Tikrar) => (
        <Button
          size="sm"
          variant="primary"
          rounded="full"
          onClick={() => setConfirmTikrar(item)}
        >
          Tandai Selesai di Rumah
        </Button>
      )
    }
  ]

  // Completed History Table Columns
  const historyColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (item: Tikrar) => (
        <span className="text-[#6B7280] font-medium">{formatDateShort(item.tanggal)}</span>
      )
    },
    {
      key: 'surah',
      header: 'Surah/Halaman',
      render: (item: Tikrar) => (
        <span className="font-semibold text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded-lg text-xs border border-[#E5E7EB]">
          {item.surah}
        </span>
      )
    },
    {
      key: 'selesai_at',
      header: 'Waktu Selesai',
      render: (item: Tikrar) => (
        <span className="text-[#6B7280] text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {item.diselesaikan_ortu_at ? new Date(item.diselesaikan_ortu_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <Badge variant="success">Selesai di Rumah</Badge>
      )
    }
  ]

  // Loading skeleton on initial page load
  if (userLoading || isPageLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <LoadingSkeleton className="h-6 w-1/4" />
            <LoadingSkeleton className="h-4 w-1/3" />
          </div>
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <EmptyState
          title="Akses Ditolak"
          description="Silakan log in terlebih dahulu untuk mengakses halaman ini."
        />
      </div>
    )
  }

  // No children connected
  if (anakList.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <EmptyState
          title="Tidak Ada Anak Terdaftar"
          description="Akun Anda belum terhubung dengan data santri. Hubungi pihak sekolah untuk informasi lebih lanjut."
        />
      </div>
    )
  }

  const selectedAnak = anakList.find(a => a.id === selectedAnakId)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-[#F59E0B]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Validasi Tikrar Rumah</h1>
          <p className="text-sm text-[#6B7280]">Konfirmasi hafalan tikrar mandiri anak di rumah</p>
        </div>
      </div>

      {/* Child Tabs (only if > 1 child) */}
      {anakList.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {anakList.map((anak) => (
            <button
              key={anak.id}
              id={`tab-anak-${anak.id}`}
              onClick={() => handleTabSwitch(anak.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                selectedAnakId === anak.id
                  ? 'bg-[#10B981] text-white border-[#10B981] shadow-md'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#10B981] hover:text-[#10B981]'
              }`}
            >
              {anak.nama_lengkap}
            </button>
          ))}
        </div>
      )}

      {/* Main Card - Active Tikrar */}
      <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">
            Tikrar Perlu Divalidasi
          </h2>
          {selectedAnak && (
            <p className="text-xs text-[#6B7280] font-medium mt-0.5">
              Menampilkan target Tikrar rumah untuk {selectedAnak.nama_lengkap}
            </p>
          )}
        </div>

        <div className="overflow-hidden">
          <Table
            columns={activeColumns}
            data={tikrarList}
            isLoading={isDataFetching}
            empty={{
              title: "Tidak ada Tikrar rumah",
              description: "Tidak ada Tikrar yang perlu diselesaikan di rumah untuk saat ini."
            }}
          />
        </div>
      </Card>

      {/* Completed History Section */}
      <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white space-y-4">
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="flex w-full items-center justify-between py-1 focus:outline-none text-left"
        >
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              Riwayat Tikrar Selesai
            </h2>
            <p className="text-xs text-[#6B7280] font-medium mt-0.5">
              Daftar Tikrar rumah yang telah divalidasi dalam 30 hari terakhir
            </p>
          </div>
          {isHistoryOpen ? (
            <ChevronUp className="w-5 h-5 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#6B7280]" />
          )}
        </button>

        {isHistoryOpen && (
          <div className="pt-2 border-t border-[#E5E7EB] overflow-hidden">
            <Table
              columns={historyColumns}
              data={historyList}
              isLoading={isDataFetching}
              empty={{
                title: "Belum ada riwayat",
                description: "Belum ada Tikrar rumah yang divalidasi dalam 30 hari terakhir."
              }}
            />
          </div>
        )}
      </Card>

      {/* Modal Confirmation Validation */}
      <Modal
        isOpen={!!confirmTikrar}
        onClose={() => setConfirmTikrar(null)}
        title="Validasi Tikrar Rumah"
      >
        {confirmTikrar && (
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-3 bg-[#FFFBEB] p-4 rounded-xl border border-[#FCD34D] text-[#92400E]">
              <CheckCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Konfirmasi Penyelesaian</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  Apakah Tikrar surah <strong>{confirmTikrar.surah}</strong> tanggal <strong>{formatDateShort(confirmTikrar.tanggal)}</strong> benar-benar sudah diselesaikan dengan baik di rumah?
                </p>
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#E5E7EB] flex items-start space-x-2 text-[11px] text-[#4B5563]">
              <Info className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span>
                Menyetujui aksi ini akan memindahkan status Tikrar secara permanen ke &quot;Selesai di Rumah&quot;.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                rounded="full"
                onClick={() => setConfirmTikrar(null)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                rounded="full"
                onClick={handleConfirmSelesai}
                isLoading={isSaving}
              >
                Ya, Sudah Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
