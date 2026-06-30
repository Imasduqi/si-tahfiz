'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Table, TableColumn } from '@/components/ui/table'
import { toast } from 'sonner'
import { getTodayString, formatDate } from '@/lib/utils'
import { Calendar, Plus, Power, AlertTriangle, History } from 'lucide-react'

interface SyahrulQuranPeriod {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  dibuat_oleh: string
  created_at: string
  profiles?: {
    nama_lengkap: string
  } | null
}

export default function KoordinatorKelolaSyahrulQuranPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Data States
  const [periodeAktif, setPeriodeAktif] = useState<SyahrulQuranPeriod | null>(null)
  const [riwayat, setRiwayat] = useState<SyahrulQuranPeriod[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false)

  // Form States
  const [tanggalMulai, setTanggalMulai] = useState<string>('')
  const [tanggalSelesai, setTanggalSelesai] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const today = getTodayString()

      // Fetch Active Syahrul Quran
      const { data: activeData, error: activeError } = await supabase
        .from('syahrul_quran')
        .select('*, profiles(nama_lengkap)')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today)
        .maybeSingle()

      if (activeError) throw activeError
      setPeriodeAktif(activeData as unknown as SyahrulQuranPeriod)

      // Fetch Historical Periods
      const { data: historyData, error: historyError } = await supabase
        .from('syahrul_quran')
        .select('*, profiles(nama_lengkap)')
        .order('created_at', { ascending: false })

      if (historyError) throw historyError
      setRiwayat((historyData as unknown as SyahrulQuranPeriod[]) || [])

    } catch (error) {
      console.error('Fetch Syahrul Quran error:', error)
      toast.error('Gagal memuat data Syahrul Quran')
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

  const handleOpenCreateModal = () => {
    setTanggalMulai(getTodayString())
    setTanggalSelesai('')
    setIsCreateModalOpen(true)
  }

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tanggalMulai || !tanggalSelesai) {
      toast.error('Semua tanggal harus diisi')
      return
    }

    if (tanggalSelesai < tanggalMulai) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai')
      return
    }

    if (!currentUser) {
      toast.error('Sesi user tidak ditemukan')
      return
    }

    setIsSubmitting(true)
    try {
      const today = getTodayString()

      // 1. Cek apakah ada periode aktif
      const { data: existingAktif, error: existingError } = await supabase
        .from('syahrul_quran')
        .select('id')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingAktif) {
        toast.error('Sudah ada periode Syahrul Quran yang aktif. Akhiri periode ini terlebih dahulu.')
        setIsSubmitting(false)
        return
      }

      // 2. Cek overlap dengan periode yang ada
      const { data: overlap, error: overlapError } = await supabase
        .from('syahrul_quran')
        .select('id')
        .lte('tanggal_mulai', tanggalSelesai)
        .gte('tanggal_selesai', tanggalMulai)
        .maybeSingle()

      if (overlapError) throw overlapError
      if (overlap) {
        toast.error('Periode ini bertumpang tindih dengan periode yang sudah ada.')
        setIsSubmitting(false)
        return
      }

      // 3. Simpan periode baru
      const { error: insertError } = await supabase
        .from('syahrul_quran')
        .insert({
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          dibuat_oleh: currentUser.id
        })

      if (insertError) throw insertError

      toast.success('Periode Syahrul Quran berhasil ditetapkan')
      setIsCreateModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Insert Syahrul Quran error:', error)
      toast.error('Gagal menetapkan periode baru')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEndPeriod = async () => {
    if (!periodeAktif) return

    setIsSubmitting(true)
    try {
      const today = getTodayString()

      const { error: updateError } = await supabase
        .from('syahrul_quran')
        .update({ tanggal_selesai: today })
        .eq('id', periodeAktif.id)

      if (updateError) throw updateError

      toast.success('Periode Syahrul Quran telah diakhiri')
      setIsEndModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('End Syahrul Quran error:', error)
      toast.error('Gagal mengakhiri periode Syahrul Quran')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDuration = (start: string, end: string) => {
    const sDate = new Date(start)
    const eDate = new Date(end)
    const diffTime = eDate.getTime() - sDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? `${diffDays} Hari` : '-'
  }

  const columns: TableColumn<SyahrulQuranPeriod>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, index) => <span className="font-medium text-gray-600">{index + 1}</span>
    },
    {
      key: 'tanggal_mulai',
      header: 'Tanggal Mulai',
      render: (item) => <span>{formatDate(item.tanggal_mulai)}</span>
    },
    {
      key: 'tanggal_selesai',
      header: 'Tanggal Selesai',
      render: (item) => <span>{formatDate(item.tanggal_selesai)}</span>
    },
    {
      key: 'durasi',
      header: 'Durasi',
      render: (item) => <span>{calculateDuration(item.tanggal_mulai, item.tanggal_selesai)}</span>
    },
    {
      key: 'dibuat_oleh',
      header: 'Dibuat Oleh',
      render: (item) => <span>{item.profiles?.nama_lengkap || 'System'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const today = getTodayString()
        const isActive = item.tanggal_mulai <= today && item.tanggal_selesai >= today
        return (
          <Badge variant={isActive ? 'success' : 'info'}>
            {isActive ? 'Aktif' : 'Selesai'}
          </Badge>
        )
      }
    }
  ]

  if (isLoading && riwayat.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-44 w-full bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const hasActivePeriod = !!periodeAktif

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Syahrul Quran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tetapkan dan pantau periode pelaksanaan Syahrul Quran. Selama periode aktif, setoran Sabki dan Manzil ditiadakan.
        </p>
      </div>

      {/* Status Card */}
      {hasActivePeriod ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success">Periode Aktif</Badge>
              <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Berlangsung
              </span>
            </div>
            <h2 className="text-lg font-bold text-emerald-950">
              Syahrul Quran Sedang Aktif
            </h2>
            <p className="text-sm text-emerald-800">
              Tanggal Pelaksanaan: <span className="font-semibold">{formatDate(periodeAktif.tanggal_mulai)}</span> s/d <span className="font-semibold">{formatDate(periodeAktif.tanggal_selesai)}</span>
            </p>
            <p className="text-xs text-emerald-700">
              Dibuat oleh: {periodeAktif.profiles?.nama_lengkap || 'System'} ({calculateDuration(periodeAktif.tanggal_mulai, periodeAktif.tanggal_selesai)})
            </p>
          </div>
          <div>
            <Button
              variant="danger"
              className="w-full md:w-auto shadow-xs flex items-center justify-center gap-2"
              onClick={() => setIsEndModalOpen(true)}
            >
              <Power className="w-4 h-4" /> Akhiri Periode Sekarang
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="danger" className="bg-gray-200 text-gray-700">Tidak Ada Periode Aktif</Badge>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-2">
              Tidak Ada Periode Syahrul Quran yang Aktif
            </h2>
            <p className="text-sm text-gray-600">
              Tetapkan periode pelaksanaan baru agar sistem menyesuaikan input setoran pengampu secara otomatis.
            </p>
          </div>
          <div>
            <Button
              variant="primary"
              className="w-full md:w-auto shadow-xs flex items-center justify-center gap-2"
              onClick={handleOpenCreateModal}
            >
              <Plus className="w-4 h-4" /> Tetapkan Periode Baru
            </Button>
          </div>
        </div>
      )}

      {/* Riwayat Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Riwayat Periode Syahrul Quran</h2>
        </div>
        
        <Table
          columns={columns}
          data={riwayat}
          isLoading={isLoading}
          empty={{
            title: 'Belum ada riwayat periode',
            description: 'Periode Syahrul Quran belum pernah ditetapkan sebelumnya.'
          }}
        />
      </div>

      {/* Modal: Tetapkan Periode Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tetapkan Periode Syahrul Quran Baru"
        size="md"
      >
        <form onSubmit={handleCreatePeriod} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-900">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 leading-relaxed">
              <p className="font-semibold">Informasi Pelaksanaan</p>
              <p>Selama periode Syahrul Quran aktif, seluruh pengampu hanya dapat memasukkan setoran tipe Sabak. Fitur Sabki dan Manzil dinonaktifkan sementara dari antarmuka setoran.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              required
            />

            <Input
              type="date"
              label="Tanggal Selesai"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              required
              min={tanggalMulai}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Akhiri Periode Sekarang */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="Akhiri Periode Syahrul Quran"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex gap-4 items-start text-red-800">
            <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900">Apakah Anda yakin ingin mengakhiri periode ini?</h4>
              <p className="text-sm leading-relaxed text-gray-600">
                Periode Syahrul Quran akan diakhiri hari ini. Sabki dan Manzil akan kembali tersedia untuk diinput oleh Pengampu. Lanjutkan?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEndModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleEndPeriod}
              isLoading={isSubmitting}
            >
              Akhiri Periode
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
