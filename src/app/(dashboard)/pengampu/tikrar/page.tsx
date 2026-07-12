'use client'

import React, { useEffect, useState, useCallback , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { getTodayString, formatDateWithDay, formatDateShort } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Check, Minus } from 'lucide-react'
import { Santri, Setoran, Tikrar, Halaqah } from '@/types'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullIndicator } from '@/components/ui/pull-indicator'

export default function PengampuTikrarPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Date and Data States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [manzilMap, setManzilMap] = useState<Record<string, Setoran>>({})
  const [tikrarList, setTikrarList] = useState<(Tikrar & { santri: { nama_lengkap: string, kelas: string } })[]>([])
  
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)

  // Confirmation Action State
  const [confirmAction, setConfirmAction] = useState<{
    tikrarId: string
    action: 'selesai_sekolah' | 'alihkan_rumah'
    santriNama: string
    surah: string
  } | null>(null)
  const [isUpdatingTikrar, setIsUpdatingTikrar] = useState<boolean>(false)

  // Fetch Halaqah & Santri (Run once when user is loaded)
  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setIsPageLoading(true)

    try {
      // 1. Get pengampu's halaqah
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

        // 2. Get santri in that halaqah
        const { data: santriData, error: santriError } = await supabase
          .from('santri')
          .select('*')
          .eq('halaqah_id', halaqahData.id)
          .order('nama_lengkap')

        if (santriError) throw santriError
        setSantriList(santriData || [])
      }
    } catch (err) {
      console.error('Initialization error:', err)
      const msg = err instanceof Error ? err.message : 'Gagal memuat data halaqah'
      toast.error(msg)
    } finally {
      setIsPageLoading(false)
    }
  }, [currentUser, supabase])

  useEffect(() => {
    if (!userLoading) {
      fetchData()
    }
  }, [userLoading, fetchData])

  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await fetchData()
      if (selectedDate) {
        await fetchManzilAndTikrar(selectedDate)
      }
    }
  })


  // Fetch Manzil & Tikrar records
  const fetchManzilAndTikrar = useCallback(async (date: string) => {
    if (!currentUser || santriList.length === 0) {
      setManzilMap({})
      setTikrarList([])
      return
    }

    setIsDataFetching(true)
    try {
      const santriIds = santriList.map(s => s.id)

      // 1. Fetch Manzil Setorans for selected date
      const { data: manzilData, error: manzilError } = await supabase
        .from('setoran')
        .select('id, santri_id, tipe, tanggal, jumlah_baris, halaman_awal, halaman_akhir, status, input_oleh, created_at, updated_at')
        .eq('tipe', 'manzil')
        .eq('tanggal', date)
        .in('santri_id', santriIds)

      if (manzilError) throw manzilError

      const mappedManzil = Object.fromEntries(
        (manzilData || []).map(m => [m.santri_id, m as Setoran])
      )
      setManzilMap(mappedManzil)

      // 2. Fetch Active Tikrars (status != 'selesai_rumah')
      const { data: tikrarData, error: tikrarError } = await supabase
        .from('tikrar')
        .select('*, santri(nama_lengkap, kelas)')
        .in('santri_id', santriIds)
        .neq('status', 'selesai_rumah')
        .order('created_at', { ascending: false })

      if (tikrarError) throw tikrarError

      // Transform raw query results to handle joined relation types
      const transformedTikrars = ((tikrarData ?? []) as unknown as {
        id: string
        santri_id: string
        tanggal: string
        surah: string
        status: 'wajib_sekolah' | 'selesai_sekolah' | 'wajib_rumah' | 'selesai_rumah'
        diselesaikan_pengampu_at: string | null
        dialihkan_rumah_at: string | null
        diselesaikan_ortu_at: string | null
        created_at: string
        santri: {
          nama_lengkap: string | null
          kelas: string | null
        } | null
      }[]).map((t) => ({
        ...t,
        santri: {
          nama_lengkap: t.santri?.nama_lengkap || '—',
          kelas: t.santri?.kelas || '—'
        }
      }))
      setTikrarList(transformedTikrars)
    } catch (err) {
      console.error('Fetch Manzil & Tikrar error:', err)
      toast.error('Gagal memuat status Manzil dan Tikrar')
    } finally {
      setIsDataFetching(false)
    }
  }, [currentUser, santriList, supabase])

  // Refetch when selectedDate or santriList changes
  useEffect(() => {
    fetchManzilAndTikrar(selectedDate)
  }, [selectedDate, santriList, fetchManzilAndTikrar])

  // Date Navigation Actions
  const handlePrevDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toLocaleDateString('sv')) // Swedish formats to YYYY-MM-DD
  }

  const handleNextDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toLocaleDateString('sv'))
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setIsUpdatingTikrar(true)
    try {
      const { tikrarId, action } = confirmAction
      if (action === 'selesai_sekolah') {
        const { error } = await supabase
          .from('tikrar')
          .update({
            status: 'selesai_sekolah',
            diselesaikan_pengampu_at: new Date().toISOString()
          })
          .eq('id', tikrarId)
          .eq('status', 'wajib_sekolah') // Guard

        if (error) throw error
        toast.success("Tikrar berhasil ditandai selesai di sekolah")
      } else if (action === 'alihkan_rumah') {
        const { error } = await supabase
          .from('tikrar')
          .update({
            status: 'wajib_rumah',
            dialihkan_rumah_at: new Date().toISOString()
          })
          .eq('id', tikrarId)
          .eq('status', 'selesai_sekolah') // Guard

        if (error) throw error
        toast.success("Tikrar berhasil dialihkan ke rumah")
      }

      setConfirmAction(null)
      await fetchManzilAndTikrar(selectedDate)
    } catch (err) {
      console.error('Error updating tikrar:', err)
      toast.error('Gagal memperbarui status Tikrar')
    } finally {
      setIsUpdatingTikrar(false)
    }
  }

  // Tikrar Table Columns configuration
  const tikrarColumns = [
    {
      key: 'santri_nama',
      header: 'Nama Santri',
      render: (item: typeof tikrarList[0]) => (
        <span className="font-bold text-[#111827]">{item.santri.nama_lengkap}</span>
      )
    },
    {
      key: 'kelas',
      header: 'Kelas',
      render: (item: typeof tikrarList[0]) => (
        <span className="text-[#374151] font-medium">Kelas {item.santri.kelas}</span>
      )
    },
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (item: typeof tikrarList[0]) => (
        <span className="text-[#6B7280] font-medium">{formatDateShort(item.tanggal)}</span>
      )
    },
    {
      key: 'surah',
      header: 'Surah/Halaman',
      render: (item: typeof tikrarList[0]) => (
        <span className="font-semibold text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded-lg text-xs border border-[#E5E7EB]">
          {item.surah}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof tikrarList[0]) => {
        if (item.status === 'wajib_sekolah') {
          return <Badge variant="warning">Wajib Sekolah</Badge>
        }
        if (item.status === 'selesai_sekolah') {
          return <Badge variant="info">Selesai di Sekolah</Badge>
        }
        if (item.status === 'wajib_rumah') {
          return <Badge variant="warning">Wajib Rumah</Badge>
        }
        return <Badge variant="info">{item.status}</Badge>
      }
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: typeof tikrarList[0]) => {
        if (item.status === 'wajib_sekolah') {
          return (
            <Button
              size="sm"
              variant="primary"
              rounded="lg"
              onClick={() =>
                setConfirmAction({
                  tikrarId: item.id,
                  action: 'selesai_sekolah',
                  santriNama: item.santri.nama_lengkap,
                  surah: item.surah,
                })
              }
            >
              Selesai di Sekolah
            </Button>
          )
        }
        if (item.status === 'selesai_sekolah') {
          return (
            <Button
              size="sm"
              variant="secondary"
              rounded="lg"
              className="border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5]"
              onClick={() =>
                setConfirmAction({
                  tikrarId: item.id,
                  action: 'alihkan_rumah',
                  santriNama: item.santri.nama_lengkap,
                  surah: item.surah,
                })
              }
            >
              Alihkan ke Rumah
            </Button>
          )
        }
        if (item.status === 'wajib_rumah') {
          return (
            <span className="text-xs text-[#6B7280] font-medium italic">
              Menunggu Orang Tua
            </span>
          )
        }
        return null
      }
    }
  ]

  // Render Loader if User profile is loading
  if (userLoading || isPageLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <LoadingSkeleton className="h-8 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Unauthorized page state if no user or role is not pengampu
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
          description="Anda belum memiliki halaqah terdaftar. Hubungi administrator/koordinator untuk memasangkan akun Anda dengan halaqah."
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PullIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Tikrar & Status Manzil
          </h1>
          <p className="text-sm font-semibold text-[#6B7280] mt-1">
            Halaqah: {halaqah.nama_halaqah} ({halaqah.grade.toUpperCase()})
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-2 shadow-xs space-x-3">
          <button
            onClick={handlePrevDate}
            className="p-2 hover:bg-[#E5E7EB] rounded-xl transition-colors text-[#6B7280] hover:text-[#111827]"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 relative select-none">
            <span className="text-sm font-bold text-[#111827] min-w-[180px] text-center">
              {formatDateWithDay(selectedDate)}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="date-picker-input"
            />
            <label
              htmlFor="date-picker-input"
              className="cursor-pointer text-[#10B981] hover:text-[#059669] p-1 rounded-lg hover:bg-[#D1FAE5] transition-colors"
              title="Pilih Tanggal"
            >
              <Calendar className="w-5 h-5" />
            </label>
          </div>

          <button
            onClick={handleNextDate}
            className="p-2 hover:bg-[#E5E7EB] rounded-xl transition-colors text-[#6B7280] hover:text-[#111827]"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Section 1: Status Manzil */}
        <Card shadow="md" className="rounded-2xl p-6 border border-[#E5E7EB] bg-white space-y-4">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h2 className="text-xl font-extrabold text-[#111827]">
              Status Manzil Santri
            </h2>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Status setoran Manzil pada tanggal {formatDateShort(selectedDate)}
            </p>
          </div>

          {isDataFetching ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          ) : santriList.length === 0 ? (
            <EmptyState
              title="Belum ada data"
              description="Tidak ada santri terdaftar di halaqah ini."
            />
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {santriList.map((santri) => {
                const manzil = manzilMap[santri.id]

                return (
                  <div
                    key={santri.id}
                    className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <span className="font-bold text-[#111827] text-[15px]">
                        {santri.nama_lengkap}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="info">Kelas {santri.kelas}</Badge>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {manzil ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-1 bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-full text-xs font-bold select-none">
                            <Check className="w-3.5 h-3.5" />
                            <span>Sudah Manzil</span>
                          </div>
                          <span className="text-[11px] text-[#6B7280] font-bold mt-1">
                            Hal. {manzil.halaman_awal}-{manzil.halaman_akhir} ({manzil.jumlah_baris} baris)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-[#F3F4F6] text-[#6B7280] px-2.5 py-1 rounded-full text-xs font-medium select-none">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Belum Manzil</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Section 2: Tikrar Status */}
        <Card shadow="md" className="rounded-2xl p-6 border border-[#E5E7EB] bg-white space-y-4">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h2 className="text-xl font-extrabold text-[#111827]">
              Daftar Tikrar Aktif
            </h2>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Seluruh target Tikrar santri yang belum selesai di rumah
            </p>
          </div>

          <div className="overflow-hidden">
            <Table
              columns={tikrarColumns}
              data={tikrarList}
              isLoading={isDataFetching}
              empty={{
                title: "Tidak ada Tikrar aktif",
                description: "Semua santri telah menyelesaikan target Tikrar mereka atau belum memiliki target baru."
              }}
            />
          </div>
        </Card>

      </div>

      {/* Modal Konfirmasi Aksi Tikrar */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === 'selesai_sekolah' ? 'Konfirmasi Selesai di Sekolah' : 'Konfirmasi Alihkan ke Rumah'}
      >
        {confirmAction && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-[#374151] leading-relaxed">
              {confirmAction.action === 'selesai_sekolah' ? (
                <>Apakah Anda yakin ingin menandai Tikrar <strong>{confirmAction.surah}</strong> untuk santri <strong>{confirmAction.santriNama}</strong> selesai di sekolah?</>
              ) : (
                <>Apakah Anda yakin ingin mengalihkan Tikrar <strong>{confirmAction.surah}</strong> untuk santri <strong>{confirmAction.santriNama}</strong> ke rumah agar diselesaikan oleh Orang Tua?</>
              )}
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="secondary"
                rounded="lg"
                onClick={() => setConfirmAction(null)}
                disabled={isUpdatingTikrar}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                rounded="lg"
                onClick={handleConfirmAction}
                isLoading={isUpdatingTikrar}
              >
                Ya, Lanjutkan
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
