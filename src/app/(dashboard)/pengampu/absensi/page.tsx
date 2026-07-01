'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { getTodayString, formatDateWithDay, formatDateShort } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Santri, Halaqah } from '@/types'
import { sendAlphaPushNotification } from '@/lib/actions/push-notification'


export default function PengampuAbsensiPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Date and Data States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [absensiMap, setAbsensiMap] = useState<Record<string, 'alpha' | 'sakit' | 'izin'>>({})
  
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Fetch Halaqah & Santri once on load
  useEffect(() => {
    let active = true

    async function initPage() {
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

        if (active && halaqahData) {
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

  // Fetch absensi records for selected date
  const fetchAbsensi = useCallback(async (date: string) => {
    if (!currentUser || santriList.length === 0) {
      setAbsensiMap({})
      return
    }

    setIsDataFetching(true)
    try {
      const santriIds = santriList.map(s => s.id)

      const { data: absensiData, error: absensiError } = await supabase
        .from('absensi')
        .select('santri_id, status')
        .eq('tanggal', date)
        .in('santri_id', santriIds)

      if (absensiError) throw absensiError

      const mappedAbsensi = Object.fromEntries(
        (absensiData || []).map(a => [a.santri_id, a.status as 'alpha' | 'sakit' | 'izin'])
      )
      setAbsensiMap(mappedAbsensi)
    } catch (err) {
      console.error('Fetch absensi error:', err)
      toast.error('Gagal memuat data absensi')
    } finally {
      setIsDataFetching(false)
    }
  }, [currentUser, santriList, supabase])

  // Refetch when selectedDate or santriList changes
  useEffect(() => {
    fetchAbsensi(selectedDate)
  }, [selectedDate, santriList, fetchAbsensi])

  // Date Navigation Actions
  const handlePrevDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toLocaleDateString('sv')) // YYYY-MM-DD
  }

  const handleNextDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toLocaleDateString('sv'))
  }

  // Calculate statistics
  const countStats = () => {
    const total = santriList.length
    let alpha = 0
    let sakit = 0
    let izin = 0
    
    Object.values(absensiMap).forEach(status => {
      if (status === 'alpha') alpha++
      else if (status === 'sakit') sakit++
      else if (status === 'izin') izin++
    })

    const hadir = total - (alpha + sakit + izin)

    return { total, hadir, alpha, sakit, izin }
  }

  const { hadir, alpha, sakit, izin } = countStats()

  // Save/Update Absensi Status
  const handleUpdateStatus = async (status: 'alpha' | 'sakit' | 'izin' | null) => {
    if (!selectedSantri) return
    setIsSaving(true)
    try {
      if (status === null) {
        // Delete record (back to Hadir)
        const { error } = await supabase
          .from('absensi')
          .delete()
          .eq('santri_id', selectedSantri.id)
          .eq('tanggal', selectedDate)
        
        if (error) throw error
        toast.success("Absensi berhasil disimpan")
      } else {
        // Upsert record
        const { error } = await supabase
          .from('absensi')
          .upsert({
            santri_id: selectedSantri.id,
            tanggal: selectedDate,
            status: status
          }, { onConflict: 'santri_id,tanggal' })

        if (error) throw error

        // Realtime notification to Orang Tua if Alpha
        if (status === 'alpha' && selectedSantri.orang_tua_id) {
          try {
            await supabase
              .channel(`notif-ortu-${selectedSantri.orang_tua_id}`)
              .send({
                type: 'broadcast',
                event: 'alpha_notification',
                payload: {
                  santri_nama: selectedSantri.nama_lengkap,
                  tanggal: selectedDate
                }
              })
          } catch (notifErr) {
            // Silently log and ignore notification errors to avoid blocking the save
            console.error('Notification failed:', notifErr)
          }

          // NEW: push notification for devices where app is closed
          sendAlphaPushNotification(
            selectedSantri.orang_tua_id,
            selectedSantri.nama_lengkap,
            selectedDate
          ).catch(() => {}) // fire and forget — never block UI
        }

        toast.success("Absensi berhasil disimpan")
      }

      setSelectedSantri(null)
      // Refetch absensi records for current date
      await fetchAbsensi(selectedDate)
    } catch (err) {
      console.error('Error saving absensi:', err)
      toast.error('Gagal menyimpan absensi')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading indicator for full page initial load
  if (userLoading || isPageLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <LoadingSkeleton className="h-8 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Not logged in state
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

  // No halaqah assigned
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
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Absensi Santri
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
              id="absensi-date-picker-input"
            />
            <label
              htmlFor="absensi-date-picker-input"
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

      {/* Summary Count Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Hadir</p>
            <h3 className="text-2xl font-bold text-[#10B981] mt-1">{hadir}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#10B981] font-bold">
            H
          </div>
        </Card>

        <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Alpha</p>
            <h3 className="text-2xl font-bold text-[#EF4444] mt-1">{alpha}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] font-bold">
            A
          </div>
        </Card>

        <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Sakit</p>
            <h3 className="text-2xl font-bold text-[#A855F7] mt-1">{sakit}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#A855F7] font-bold">
            S
          </div>
        </Card>

        <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Izin</p>
            <h3 className="text-2xl font-bold text-[#3B82F6] mt-1">{izin}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#3B82F6] font-bold">
            I
          </div>
        </Card>
      </div>

      {/* Santri List Container */}
      <Card className="rounded-2xl shadow-md p-6 border border-[#E5E7EB] bg-white space-y-4">
        <div className="border-b border-[#E5E7EB] pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">Daftar Kehadiran</h2>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Klik nama santri untuk memperbarui status kehadiran pada {formatDateShort(selectedDate)}
            </p>
          </div>
        </div>

        {isDataFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : santriList.length === 0 ? (
          <EmptyState
            title="Tidak Ada Santri"
            description="Tidak ada data santri yang terdaftar dalam halaqah ini."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {santriList.map((santri) => {
              const status = absensiMap[santri.id] // alpha, sakit, izin, or undefined (Hadir)
              
              // Define style mapping for badges
              let badgeVariant: 'success' | 'danger' | 'sakit' | 'izin' = 'success'
              let statusLabel = 'Hadir'
              
              if (status === 'alpha') {
                badgeVariant = 'danger'
                statusLabel = 'Alpha'
              } else if (status === 'sakit') {
                badgeVariant = 'sakit'
                statusLabel = 'Sakit'
              } else if (status === 'izin') {
                badgeVariant = 'izin'
                statusLabel = 'Izin'
              }

              return (
                <div
                  key={santri.id}
                  onClick={() => setSelectedSantri(santri)}
                  className="group relative flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white hover:border-[#10B981] hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#4B5563] font-bold group-hover:bg-[#D1FAE5] group-hover:text-[#10B981] transition-colors">
                      {santri.nama_lengkap.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#111827] text-sm leading-tight">
                        {santri.nama_lengkap}
                      </h4>
                      <p className="text-xs text-[#6B7280] font-medium mt-1">
                        Kelas {santri.kelas}
                      </p>
                      <span className="inline-block text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mt-0.5 bg-[#E5E7EB]/50 px-1.5 py-0.5 rounded-sm">
                        {santri.grade}
                      </span>
                    </div>
                  </div>

                  <Badge variant={badgeVariant} className="flex-shrink-0">
                    {statusLabel}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Absensi Action sheet / modal */}
      <Modal
        isOpen={!!selectedSantri}
        onClose={() => setSelectedSantri(null)}
        title={selectedSantri ? `Absensi: ${selectedSantri.nama_lengkap}` : 'Absensi'}
      >
        {selectedSantri && (
          <div className="space-y-6 py-2">
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#6B7280]">Informasi Santri</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-[#111827]">{selectedSantri.nama_lengkap}</p>
                <p className="text-xs text-[#6B7280]">Kelas: {selectedSantri.kelas} | Grade: {selectedSantri.grade.toUpperCase()}</p>
                <p className="text-xs text-[#6B7280]">
                  Status saat ini:{' '}
                  <span className="font-bold">
                    {absensiMap[selectedSantri.id] ? absensiMap[selectedSantri.id]?.toUpperCase() : 'HADIR'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex flex-col space-y-3">
              {/* Option: Alpha */}
              {absensiMap[selectedSantri.id] !== 'alpha' && (
                <Button
                  onClick={() => handleUpdateStatus('alpha')}
                  variant="danger"
                  rounded="lg"
                  isLoading={isSaving}
                  className="w-full justify-start text-left px-4"
                >
                  Tandai Alpha
                </Button>
              )}

              {/* Option: Sakit */}
              {absensiMap[selectedSantri.id] !== 'sakit' && (
                <Button
                  onClick={() => handleUpdateStatus('sakit')}
                  variant="secondary"
                  rounded="lg"
                  isLoading={isSaving}
                  className="w-full justify-start text-left px-4 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Tandai Sakit
                </Button>
              )}

              {/* Option: Izin */}
              {absensiMap[selectedSantri.id] !== 'izin' && (
                <Button
                  onClick={() => handleUpdateStatus('izin')}
                  variant="secondary"
                  rounded="lg"
                  isLoading={isSaving}
                  className="w-full justify-start text-left px-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Tandai Izin
                </Button>
              )}

              {/* Option: Hapus (Hadir) if record exists */}
              {absensiMap[selectedSantri.id] !== undefined && (
                <Button
                  onClick={() => handleUpdateStatus(null)}
                  variant="primary"
                  rounded="lg"
                  isLoading={isSaving}
                  className="w-full justify-start text-left px-4 bg-[#10B981] hover:bg-[#059669]"
                >
                  Kembalikan ke Hadir (Hapus Record)
                </Button>
              )}

              <Button
                onClick={() => setSelectedSantri(null)}
                variant="ghost"
                rounded="lg"
                disabled={isSaving}
                className="w-full border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#4B5563]"
              >
                Batal
              </Button>
            </div>
            
            {/* Realtime Alert Footer */}
            {selectedSantri.orang_tua_id ? (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-start space-x-2 text-[11px] text-[#065F46] font-medium leading-relaxed">
                <Info className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                <span>
                  Catatan: Status Alpha akan mengirimkan notifikasi realtime langsung ke akun Orang Tua.
                </span>
              </div>
            ) : (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-start space-x-2 text-[11px] text-[#92400E] font-medium leading-relaxed">
                <Info className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <span>
                  Catatan: Santri ini belum terhubung dengan akun Orang Tua. Notifikasi realtime akan dilewati secara otomatis.
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  )
}
