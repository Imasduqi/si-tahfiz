'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { getTodayString, formatDateWithDay } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Check, Minus, Info } from 'lucide-react'
import { Santri, Setoran, Halaqah } from '@/types'

export default function PengampuSetoranPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Date and Data States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [setoranList, setSetoranList] = useState<Setoran[]>([])
  const [isSyahrulQuran, setIsSyahrulQuran] = useState<boolean>(false)
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)

  // Pekan Murajaah States
  const [isPekanMurajaah, setIsPekanMurajaah] = useState<boolean>(false)
  const [pekanMurajaahId, setPekanMurajaahId] = useState<string | null>(null)
  const [targetMurajaah, setTargetMurajaah] = useState<number | null>(null)
  const [inputTargetVal, setInputTargetVal] = useState<string>('')
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null)
  const [existingSabakId, setExistingSabakId] = useState<string | null>(null)
  const [existingSabkiId, setExistingSabkiId] = useState<string | null>(null)

  // Form Field States
  const [sabakJumlahBaris, setSabakJumlahBaris] = useState<string>('')
  const [sabakHalamanAwal, setSabakHalamanAwal] = useState<string>('')
  const [sabakHalamanAkhir, setSabakHalamanAkhir] = useState<string>('')
  const [sabakJumlahKesalahan, setSabakJumlahKesalahan] = useState<string>('0')

  const [sabkiJumlahBaris, setSabkiJumlahBaris] = useState<string>('')
  const [sabkiHalamanAwal, setSabkiHalamanAwal] = useState<string>('')
  const [sabkiHalamanAkhir, setSabkiHalamanAkhir] = useState<string>('')
  const [sabkiJumlahKesalahan, setSabkiJumlahKesalahan] = useState<string>('0')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Fetch Pekan Murajaah Status
  const fetchPekanMurajaahStatus = useCallback(async (halaqahId: string) => {
    try {
      const today = getTodayString()
      const { data: pekanAktif, error: pekanError } = await supabase
        .from('pekan_murajaah')
        .select('id')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today)
        .maybeSingle()

      if (pekanError) throw pekanError

      if (pekanAktif) {
        setIsPekanMurajaah(true)
        setPekanMurajaahId(pekanAktif.id)

        const { data: myTarget, error: targetError } = await supabase
          .from('target_murajaah')
          .select('target_baris_per_hari')
          .eq('pekan_murajaah_id', pekanAktif.id)
          .eq('halaqah_id', halaqahId)
          .maybeSingle()

        if (targetError) throw targetError
        if (myTarget) {
          setTargetMurajaah(myTarget.target_baris_per_hari)
          setInputTargetVal(myTarget.target_baris_per_hari.toString())
        } else {
          setTargetMurajaah(null)
          setInputTargetVal('')
        }
      } else {
        setIsPekanMurajaah(false)
        setPekanMurajaahId(null)
        setTargetMurajaah(null)
      }
    } catch (err) {
      console.error('Fetch pekan murajaah status error:', err)
    }
  }, [supabase])

  const handleSaveTarget = async () => {
    if (!pekanMurajaahId || !halaqah || !inputTargetVal) return
    const targetVal = parseInt(inputTargetVal, 10)
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error('Target baris harus lebih besar dari 0')
      return
    }

    setIsSavingTarget(true)
    try {
      const { error } = await supabase
        .from('target_murajaah')
        .upsert({
          pekan_murajaah_id: pekanMurajaahId,
          halaqah_id: halaqah.id,
          target_baris_per_hari: targetVal
        }, { onConflict: 'pekan_murajaah_id,halaqah_id' })

      if (error) throw error

      toast.success('Target murajaah berhasil disimpan')
      setTargetMurajaah(targetVal)
    } catch (err) {
      console.error('Save target error:', err)
      toast.error('Gagal menyimpan target murajaah')
    } finally {
      setIsSavingTarget(false)
    }
  }

  // Check Syahrul Quran & Fetch Halaqah + Santri list (Run once when user is loaded)
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
          await fetchPekanMurajaahStatus(halaqahData.id)

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
  }, [currentUser, userLoading, supabase, fetchPekanMurajaahStatus])

  // Fetch Setorans for the selected date and Syahrul Quran period
  const fetchSetorans = useCallback(async (date: string) => {
    if (!currentUser || santriList.length === 0) {
      setSetoranList([])
      return
    }

    setIsDataFetching(true)
    try {
      const santriIds = santriList.map(s => s.id)

      // Fetch Syahrul Quran for selected date
      const { data: syahrul } = await supabase
        .from('syahrul_quran')
        .select('id')
        .lte('tanggal_mulai', date)
        .gte('tanggal_selesai', date)
        .maybeSingle()

      setIsSyahrulQuran(!!syahrul)

      // Fetch Setorans for selected date
      const { data: setoranData, error: setoranError } = await supabase
        .from('setoran')
        .select('*')
        .in('santri_id', santriIds)
        .eq('tanggal', date)

      if (setoranError) throw setoranError
      setSetoranList(setoranData || [])
    } catch (err) {
      console.error('Fetch setoran error:', err)
      toast.error('Gagal mengambil data setoran harian')
    } finally {
      setIsDataFetching(false)
    }
  }, [currentUser, santriList, supabase])

  // Re-run setoran fetching when selected date or santri list changes
  useEffect(() => {
    fetchSetorans(selectedDate)
  }, [selectedDate, santriList, fetchSetorans])

  // Date Navigation Actions
  const handlePrevDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toLocaleDateString('sv')) // 'sv' locale formats to YYYY-MM-DD
  }

  const handleNextDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toLocaleDateString('sv'))
  }

  // Modal open helpers
  const openInputModal = (santri: Santri) => {
    setSelectedSantri(santri)
    setExistingSabakId(null)
    setExistingSabkiId(null)

    // Default empty values for insertion
    setSabakJumlahBaris('')
    setSabakHalamanAwal('')
    setSabakHalamanAkhir('')
    setSabakJumlahKesalahan('0')

    setSabkiJumlahBaris('')
    setSabkiHalamanAwal('')
    setSabkiHalamanAkhir('')
    setSabkiJumlahKesalahan('0')

    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (santri: Santri) => {
    setSelectedSantri(santri)

    const sabak = setoranList.find(s => s.santri_id === santri.id && s.tipe === 'sabak')
    const sabki = setoranList.find(s => s.santri_id === santri.id && s.tipe === 'sabki')

    if (sabak) {
      setExistingSabakId(sabak.id)
      setSabakJumlahBaris(sabak.jumlah_baris.toString())
      setSabakHalamanAwal(sabak.halaman_awal.toString())
      setSabakHalamanAkhir(sabak.halaman_akhir.toString())
      setSabakJumlahKesalahan(sabak.jumlah_kesalahan !== null ? sabak.jumlah_kesalahan.toString() : '0')
    } else {
      setExistingSabakId(null)
      setSabakJumlahBaris('')
      setSabakHalamanAwal('')
      setSabakHalamanAkhir('')
      setSabakJumlahKesalahan('0')
    }

    if (sabki) {
      setExistingSabkiId(sabki.id)
      setSabkiJumlahBaris(sabki.jumlah_baris.toString())
      setSabkiHalamanAwal(sabki.halaman_awal.toString())
      setSabkiHalamanAkhir(sabki.halaman_akhir.toString())
      setSabkiJumlahKesalahan(sabki.jumlah_kesalahan !== null ? sabki.jumlah_kesalahan.toString() : '0')
    } else {
      setExistingSabkiId(null)
      setSabkiJumlahBaris('')
      setSabkiHalamanAwal('')
      setSabkiHalamanAkhir('')
      setSabkiJumlahKesalahan('0')
    }

    setErrors({})
    setIsModalOpen(true)
  }

  // Reactive Status Auto-calculator
  const getCalculatedStatus = (awal: string, akhir: string, kesalahan: string) => {
    const aw = Number(awal)
    const ak = Number(akhir)
    const kes = Number(kesalahan)

    if (isNaN(aw) || isNaN(ak) || isNaN(kes) || aw <= 0 || ak < aw || kes < 0) {
      return '—'
    }

    const totalHalaman = ak - aw + 1
    const batasKesalahan = totalHalaman * 2
    return kes > batasKesalahan ? 'mengulang' : 'lulus'
  }

  const sabakStatusVal = getCalculatedStatus(sabakHalamanAwal, sabakHalamanAkhir, sabakJumlahKesalahan)
  const sabkiStatusVal = getCalculatedStatus(sabkiHalamanAwal, sabkiHalamanAkhir, sabkiJumlahKesalahan)

  // Input Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Sabak Validations
    if (!sabakJumlahBaris || Number(sabakJumlahBaris) <= 0) {
      newErrors.sabakJumlahBaris = 'Jumlah baris harus > 0'
    }
    if (!sabakHalamanAwal || Number(sabakHalamanAwal) <= 0) {
      newErrors.sabakHalamanAwal = 'Halaman awal harus > 0'
    }
    if (!sabakHalamanAkhir || Number(sabakHalamanAkhir) <= 0) {
      newErrors.sabakHalamanAkhir = 'Halaman akhir harus > 0'
    } else if (Number(sabakHalamanAkhir) < Number(sabakHalamanAwal)) {
      newErrors.sabakHalamanAkhir = 'Halaman akhir harus >= halaman awal'
    }
    if (sabakJumlahKesalahan === '' || Number(sabakJumlahKesalahan) < 0) {
      newErrors.sabakJumlahKesalahan = 'Jumlah kesalahan harus >= 0'
    }

    // Sabki Validations (Only if Syahrul Quran is not active)
    if (!isSyahrulQuran) {
      if (!sabkiJumlahBaris || Number(sabkiJumlahBaris) <= 0) {
        newErrors.sabkiJumlahBaris = 'Jumlah baris harus > 0'
      }
      if (!sabkiHalamanAwal || Number(sabkiHalamanAwal) <= 0) {
        newErrors.sabkiHalamanAwal = 'Halaman awal harus > 0'
      }
      if (!sabkiHalamanAkhir || Number(sabkiHalamanAkhir) <= 0) {
        newErrors.sabkiHalamanAkhir = 'Halaman akhir harus > 0'
      } else if (Number(sabkiHalamanAkhir) < Number(sabkiHalamanAwal)) {
        newErrors.sabkiHalamanAkhir = 'Halaman akhir harus >= halaman awal'
      }
      if (sabkiJumlahKesalahan === '' || Number(sabkiJumlahKesalahan) < 0) {
        newErrors.sabkiJumlahKesalahan = 'Jumlah kesalahan harus >= 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Form Submission (Save/Update Setorans & Auto Tikrar)
  const handleSaveSetoran = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !selectedSantri) return

    if (!validateForm()) {
      toast.error('Harap lengkapi semua field dengan benar')
      return
    }

    setIsSaving(true)

    try {
      // 1. Process Sabak Setoran
      const sabakStatus = sabakStatusVal as 'lulus' | 'mengulang'
      let sabakSuccess = false
      let sabakErrorMsg = ''

      if (existingSabakId) {
        // Edit Sabak
        const { error: err } = await supabase
          .from('setoran')
          .update({
            jumlah_baris: Number(sabakJumlahBaris),
            halaman_awal: Number(sabakHalamanAwal),
            halaman_akhir: Number(sabakHalamanAkhir),
            jumlah_kesalahan: Number(sabakJumlahKesalahan),
            status: sabakStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSabakId)

        if (err) {
          sabakErrorMsg = err.message
        } else {
          sabakSuccess = true
        }
      } else {
        // Insert Sabak
        const { error: err } = await supabase
          .from('setoran')
          .insert({
            santri_id: selectedSantri.id,
            tipe: 'sabak',
            tanggal: selectedDate,
            jumlah_baris: Number(sabakJumlahBaris),
            halaman_awal: Number(sabakHalamanAwal),
            halaman_akhir: Number(sabakHalamanAkhir),
            jumlah_kesalahan: Number(sabakJumlahKesalahan),
            status: sabakStatus,
            input_oleh: currentUser.id
          })

        if (err) {
          if (err.code === '23505') {
            sabakErrorMsg = 'Setoran Sabak sudah ada untuk santri ini pada tanggal ini'
          } else {
            sabakErrorMsg = err.message
          }
        } else {
          sabakSuccess = true
        }
      }

      // Auto-create Tikrar for Sabak if status is 'mengulang'
      if (sabakSuccess && sabakStatus === 'mengulang') {
        try {
          await supabase.from('tikrar').insert({
            santri_id: selectedSantri.id,
            tanggal: selectedDate,
            surah: `Hal. ${sabakHalamanAwal}-${sabakHalamanAkhir}`,
            status: 'wajib_sekolah'
          })
        } catch (tikrarErr) {
          console.error('Failed to create Tikrar for Sabak:', tikrarErr)
          toast.warning('Setoran Sabak disimpan, tetapi gagal membuat Tikrar otomatis')
        }
      }

      // 2. Process Sabki Setoran (if Syahrul Quran is not active)
      let sabkiSuccess = false
      let sabkiErrorMsg = ''

      if (!isSyahrulQuran) {
        const sabkiStatus = sabkiStatusVal as 'lulus' | 'mengulang'

        if (existingSabkiId) {
          // Edit Sabki
          const { error: err } = await supabase
            .from('setoran')
            .update({
              jumlah_baris: Number(sabkiJumlahBaris),
              halaman_awal: Number(sabkiHalamanAwal),
              halaman_akhir: Number(sabkiHalamanAkhir),
              jumlah_kesalahan: Number(sabkiJumlahKesalahan),
              status: sabkiStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSabkiId)

          if (err) {
            sabkiErrorMsg = err.message
          } else {
            sabkiSuccess = true
          }
        } else {
          // Insert Sabki
          const { error: err } = await supabase
            .from('setoran')
            .insert({
              santri_id: selectedSantri.id,
              tipe: 'sabki',
              tanggal: selectedDate,
              jumlah_baris: Number(sabkiJumlahBaris),
              halaman_awal: Number(sabkiHalamanAwal),
              halaman_akhir: Number(sabkiHalamanAkhir),
              jumlah_kesalahan: Number(sabkiJumlahKesalahan),
              status: sabkiStatus,
              input_oleh: currentUser.id
            })

          if (err) {
            if (err.code === '23505') {
              sabkiErrorMsg = 'Setoran Sabki sudah ada untuk santri ini pada tanggal ini'
            } else {
              sabkiErrorMsg = err.message
            }
          } else {
            sabkiSuccess = true
          }
        }

        // Auto-create Tikrar for Sabki if status is 'mengulang'
        if (sabkiSuccess && sabkiStatus === 'mengulang') {
          try {
            await supabase.from('tikrar').insert({
              santri_id: selectedSantri.id,
              tanggal: selectedDate,
              surah: `Hal. ${sabkiHalamanAwal}-${sabkiHalamanAkhir}`,
              status: 'wajib_sekolah'
            })
          } catch (tikrarErr) {
            console.error('Failed to create Tikrar for Sabki:', tikrarErr)
            toast.warning('Setoran Sabki disimpan, tetapi gagal membuat Tikrar otomatis')
          }
        }
      } else {
        // If Syahrul Quran is active, Sabki is hidden and we treat it as "skipped successfully"
        sabkiSuccess = true
      }

      // 3. Status Reporting & Toast Feedbacks
      if (isSyahrulQuran) {
        if (sabakSuccess) {
          toast.success('Setoran berhasil disimpan')
          setIsModalOpen(false)
          fetchSetorans(selectedDate)
        } else {
          toast.error(sabakErrorMsg || 'Gagal menyimpan setoran Sabak')
        }
      } else {
        if (sabakSuccess && sabkiSuccess) {
          toast.success('Setoran berhasil disimpan')
          setIsModalOpen(false)
          fetchSetorans(selectedDate)
        } else if (sabakSuccess && !sabkiSuccess) {
          toast.success('Sabak disimpan')
          if (sabkiErrorMsg.includes('sudah ada')) {
            toast.error('Sabki sudah ada, silakan edit')
          } else {
            toast.error('Gagal menyimpan Sabki: ' + sabkiErrorMsg)
          }
          setIsModalOpen(false)
          fetchSetorans(selectedDate)
        } else if (!sabakSuccess && sabkiSuccess) {
          toast.success('Sabki disimpan')
          toast.error('Gagal menyimpan Sabak: ' + sabakErrorMsg)
          setIsModalOpen(false)
          fetchSetorans(selectedDate)
        } else {
          toast.error(sabakErrorMsg || 'Gagal menyimpan setoran')
        }
      }
    } catch (err) {
      console.error('On submit error:', err)
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsSaving(false)
    }
  }

  // Render Loader if User is still being loaded
  if (userLoading || isPageLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <LoadingSkeleton className="h-8 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Setoran Harian
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

      {/* Syahrul Quran Banner */}
      {isSyahrulQuran && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] p-4 rounded-2xl flex items-start space-x-3 shadow-xs animate-fade-in">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Periode Syahrul Quran aktif</h4>
            <p className="text-xs font-medium mt-0.5 opacity-90">
              Sabki dan Manzil tidak tersedia. Seluruh santri hanya melakukan setoran Sabak.
            </p>
          </div>
        </div>
      )}

      {/* Pekan Murajaah Banner */}
      {isPekanMurajaah && (
        targetMurajaah !== null ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <h4 className="text-sm font-bold">Pekan Murajaah Aktif</h4>
                <p className="text-xs font-medium mt-0.5 text-blue-800">
                  Pekan Murajaah aktif — Target: {targetMurajaah} baris/hari
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputTargetVal}
                onChange={(e) => setInputTargetVal(e.target.value)}
                className="w-16 bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs text-blue-950 focus:outline-none focus:border-blue-500 font-semibold"
                min="1"
                placeholder="Target"
              />
              <Button
                variant="secondary"
                size="sm"
                className="py-1 px-3 text-xs shrink-0"
                onClick={handleSaveTarget}
                isLoading={isSavingTarget}
              >
                Ubah
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] p-4 rounded-2xl flex flex-col md:flex-row md:items-start md:justify-between gap-4 shadow-xs animate-fade-in">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#D97706]" />
              <div>
                <h4 className="text-sm font-bold">Pekan Murajaah Aktif</h4>
                <p className="text-xs font-medium mt-0.5 opacity-90">
                  Pekan Murajaah aktif — belum ada target harian. Koordinator akan menginformasikan target.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <input
                type="number"
                value={inputTargetVal}
                onChange={(e) => setInputTargetVal(e.target.value)}
                className="w-24 bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-amber-950 focus:outline-none focus:border-amber-500 font-semibold"
                min="1"
                placeholder="Baris/hari"
              />
              <Button
                variant="primary"
                size="sm"
                className="py-1.5 px-3 text-xs shrink-0"
                onClick={handleSaveTarget}
                isLoading={isSavingTarget}
              >
                Set Target
              </Button>
            </div>
          </div>
        )
      )}

      {/* Main Content Area */}
      {isDataFetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : santriList.length === 0 ? (
        <EmptyState
          title="Tidak Ada Santri"
          description="Halaqah ini belum memiliki santri terdaftar."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {santriList.map((santri) => {
            const hasSabak = setoranList.some(
              (s) => s.santri_id === santri.id && s.tipe === 'sabak'
            )
            const hasSabki = setoranList.some(
              (s) => s.santri_id === santri.id && s.tipe === 'sabki'
            )
            const existsAny = hasSabak || hasSabki

            return (
              <Card
                key={santri.id}
                shadow="md"
                className="rounded-2xl p-6 flex flex-col justify-between border border-[#E5E7EB] bg-white transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                <div>
                  {/* Top Row: Name and Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#111827] line-clamp-1">
                        {santri.nama_lengkap}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge variant="info">Kelas {santri.kelas}</Badge>
                        <Badge variant="success">{santri.grade}</Badge>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div>
                      {existsAny ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          rounded="lg"
                          onClick={() => openEditModal(santri)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          rounded="lg"
                          onClick={() => openInputModal(santri)}
                        >
                          Input
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Divider */}
                  <div className="border-t border-[#E5E7EB] my-4" />

                  {/* Bottom Row: Setoran Completion Statuses */}
                  <div className="flex items-center gap-6 select-none">
                    {/* Sabak Completion Icon */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#6B7280]">Sabak:</span>
                      {hasSabak ? (
                        <div className="flex items-center space-x-1 bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sudah</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full text-xs font-medium">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Belum</span>
                        </div>
                      )}
                    </div>

                    {/* Sabki Completion Icon (Hidden completely during Syahrul Quran) */}
                    {!isSyahrulQuran && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[#6B7280]">Sabki:</span>
                        {hasSabki ? (
                          <div className="flex items-center space-x-1 bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full text-xs font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Sudah</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full text-xs font-medium">
                            <Minus className="w-3.5 h-3.5" />
                            <span>Belum</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Input/Edit Modal */}
      {selectedSantri && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`${existingSabakId || existingSabkiId ? 'Edit' : 'Input'} Setoran — ${selectedSantri.nama_lengkap}`}
          size="lg"
        >
          <form onSubmit={handleSaveSetoran} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sabak Fields Panel */}
              <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-4 bg-white">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <h4 className="font-bold text-[#111827] text-sm">SETORAN SABAK</h4>
                  <Badge variant={sabakStatusVal === 'lulus' ? 'success' : sabakStatusVal === 'mengulang' ? 'danger' : 'info'}>
                    Status: {sabakStatusVal}
                  </Badge>
                </div>

                <div className="space-y-3.5">
                  <Input
                    label="Jumlah Baris"
                    type="number"
                    min="1"
                    placeholder="Contoh: 15"
                    value={sabakJumlahBaris}
                    onChange={(e) => setSabakJumlahBaris(e.target.value)}
                    error={errors.sabakJumlahBaris}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Halaman Awal"
                      type="number"
                      min="1"
                      placeholder="Hal. Awal"
                      value={sabakHalamanAwal}
                      onChange={(e) => setSabakHalamanAwal(e.target.value)}
                      error={errors.sabakHalamanAwal}
                      required
                    />

                    <Input
                      label="Halaman Akhir"
                      type="number"
                      min="1"
                      placeholder="Hal. Akhir"
                      value={sabakHalamanAkhir}
                      onChange={(e) => setSabakHalamanAkhir(e.target.value)}
                      error={errors.sabakHalamanAkhir}
                      required
                    />
                  </div>

                  <Input
                    label="Jumlah Kesalahan"
                    type="number"
                    min="0"
                    placeholder="Contoh: 2"
                    value={sabakJumlahKesalahan}
                    onChange={(e) => setSabakJumlahKesalahan(e.target.value)}
                    error={errors.sabakJumlahKesalahan}
                    required
                  />
                </div>
              </div>

              {/* Sabki Fields Panel (Completely hidden if Syahrul Quran is active) */}
              {!isSyahrulQuran && (
                <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-4 bg-white">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                    <h4 className="font-bold text-[#111827] text-sm">SETORAN SABKI</h4>
                    <Badge variant={sabkiStatusVal === 'lulus' ? 'success' : sabkiStatusVal === 'mengulang' ? 'danger' : 'info'}>
                      Status: {sabkiStatusVal}
                    </Badge>
                  </div>

                  <div className="space-y-3.5">
                    <Input
                      label="Jumlah Baris"
                      type="number"
                      min="1"
                      placeholder="Contoh: 15"
                      value={sabkiJumlahBaris}
                      onChange={(e) => setSabkiJumlahBaris(e.target.value)}
                      error={errors.sabkiJumlahBaris}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Halaman Awal"
                        type="number"
                        min="1"
                        placeholder="Hal. Awal"
                        value={sabkiHalamanAwal}
                        onChange={(e) => setSabkiHalamanAwal(e.target.value)}
                        error={errors.sabkiHalamanAwal}
                        required
                      />

                      <Input
                        label="Halaman Akhir"
                        type="number"
                        min="1"
                        placeholder="Hal. Akhir"
                        value={sabkiHalamanAkhir}
                        onChange={(e) => setSabkiHalamanAkhir(e.target.value)}
                        error={errors.sabkiHalamanAkhir}
                        required
                      />
                    </div>

                    <Input
                      label="Jumlah Kesalahan"
                      type="number"
                      min="0"
                      placeholder="Contoh: 2"
                      value={sabkiJumlahKesalahan}
                      onChange={(e) => setSabkiJumlahKesalahan(e.target.value)}
                      error={errors.sabkiJumlahKesalahan}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="secondary"
                rounded="lg"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                rounded="lg"
                isLoading={isSaving}
              >
                Simpan Setoran
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
