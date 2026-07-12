'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Table, TableColumn } from '@/components/ui/table'
import { toast } from 'sonner'
import { getTodayString, formatDate } from '@/lib/utils'
import { Calendar, Plus, Power, AlertTriangle, History, Info, Edit3, Settings } from 'lucide-react'

interface PekanMurajaahPeriod {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  dibuat_oleh: string
  created_at: string
  profiles?: {
    nama_lengkap: string
  } | null
}

interface HalaqahWithPengampu {
  id: string
  nama_halaqah: string
  grade: 'tahsin' | 'takmil' | 'tahfiz'
  profiles?: {
    nama_lengkap: string
  } | null
}

interface TargetMurajaah {
  id: string
  pekan_murajaah_id: string
  halaqah_id: string
  target_baris_per_hari: number
}

export default function KoordinatorKelolaPekanMurajaahPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Data States
  const [periodeAktif, setPeriodeAktif] = useState<PekanMurajaahPeriod | null>(null)
  const [riwayat, setRiwayat] = useState<PekanMurajaahPeriod[]>([])
  const [halaqahList, setHalaqahList] = useState<HalaqahWithPengampu[]>([])
  const [targets, setTargets] = useState<Record<string, TargetMurajaah>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false)

  // Form States
  const [tanggalMulai, setTanggalMulai] = useState<string>('')
  const [tanggalSelesai, setTanggalSelesai] = useState<string>('')
  const [selectedHalaqah, setSelectedHalaqah] = useState<HalaqahWithPengampu | null>(null)
  const [targetBaris, setTargetBaris] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const today = getTodayString()

      // Fetch Active Pekan Murajaah
      const { data: activeData, error: activeError } = await supabase
        .from('pekan_murajaah')
        .select('*, profiles(nama_lengkap)')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today)
        .maybeSingle()

      if (activeError) throw activeError
      setPeriodeAktif(activeData as unknown as PekanMurajaahPeriod)

      // Fetch Historical Periods
      const { data: historyData, error: historyError } = await supabase
        .from('pekan_murajaah')
        .select('*, profiles(nama_lengkap)')
        .order('created_at', { ascending: false })

      if (historyError) throw historyError
      setRiwayat((historyData as unknown as PekanMurajaahPeriod[]) || [])

      // Fetch all Halaqahs
      const { data: halData, error: halError } = await supabase
        .from('halaqah')
        .select('id, nama_halaqah, grade, profiles(nama_lengkap)')
        .order('nama_halaqah')

      if (halError) throw halError
      setHalaqahList((halData as unknown as HalaqahWithPengampu[]) || [])

      // Fetch existing targets for the active period
      if (activeData) {
        const { data: targetData, error: targetError } = await supabase
          .from('target_murajaah')
          .select('*')
          .eq('pekan_murajaah_id', activeData.id)

        if (targetError) throw targetError
        const targetMap = Object.fromEntries((targetData || []).map(t => [t.halaqah_id, t]))
        setTargets(targetMap)
      } else {
        setTargets({})
      }

    } catch (error) {
      console.error('Fetch Pekan Murajaah error:', error)
      toast.error('Gagal memuat data Pekan Murajaah')
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
        .from('pekan_murajaah')
        .select('id')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingAktif) {
        toast.error('Sudah ada Pekan Murajaah yang aktif.')
        setIsSubmitting(false)
        return
      }

      // 2. Cek overlap dengan periode yang ada
      const { data: overlap, error: overlapError } = await supabase
        .from('pekan_murajaah')
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
        .from('pekan_murajaah')
        .insert({
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          dibuat_oleh: currentUser.id
        })

      if (insertError) {
        if (insertError.code === '23P01') {
          toast.error('Periode ini bertumpang tindih dengan Pekan Murajaah lain yang sudah ada')
        } else {
          toast.error('Gagal membuat periode: ' + insertError.message)
        }
        setIsSubmitting(false)
        return
      }

      toast.success('Pekan Murajaah berhasil ditetapkan')
      setIsCreateModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Insert Pekan Murajaah error:', error)
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
        .from('pekan_murajaah')
        .update({ tanggal_selesai: today })
        .eq('id', periodeAktif.id)

      if (updateError) throw updateError

      toast.success('Pekan Murajaah telah diakhiri')
      setIsEndModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('End Pekan Murajaah error:', error)
      toast.error('Gagal mengakhiri Pekan Murajaah')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenTargetModal = (halaqah: HalaqahWithPengampu) => {
    setSelectedHalaqah(halaqah)
    const existingTarget = targets[halaqah.id]
    setTargetBaris(existingTarget ? existingTarget.target_baris_per_hari.toString() : '')
    setIsTargetModalOpen(true)
  }

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodeAktif || !selectedHalaqah || !targetBaris) return

    const targetVal = parseInt(targetBaris, 10)
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error('Target baris harus berupa angka lebih besar dari 0')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: upsertError } = await supabase
        .from('target_murajaah')
        .upsert({
          pekan_murajaah_id: periodeAktif.id,
          halaqah_id: selectedHalaqah.id,
          target_baris_per_hari: targetVal
        }, { onConflict: 'pekan_murajaah_id,halaqah_id' })

      if (upsertError) throw upsertError

      toast.success('Target berhasil disimpan')
      setIsTargetModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Save target murajaah error:', error)
      toast.error('Gagal menyimpan target murajaah')
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

  const riwayatColumns: TableColumn<PekanMurajaahPeriod>[] = [
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

  const targetColumns: TableColumn<HalaqahWithPengampu>[] = [
    {
      key: 'nama_halaqah',
      header: 'Nama Halaqah',
      render: (item) => <span className="font-semibold text-gray-950">{item.nama_halaqah}</span>
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item) => <span className="uppercase text-xs font-semibold text-gray-600">{item.grade}</span>
    },
    {
      key: 'pengampu',
      header: 'Pengampu',
      render: (item) => <span>{item.profiles?.nama_lengkap || '-'}</span>
    },
    {
      key: 'target',
      header: 'Target Harian',
      render: (item) => {
        const target = targets[item.id]
        return target ? (
          <span className="font-medium text-emerald-700">{target.target_baris_per_hari} Baris / Hari</span>
        ) : (
          <span className="text-gray-400 italic">Belum diset</span>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isSet = !!targets[item.id]
        return (
          <Badge variant={isSet ? 'success' : 'warning'}>
            {isSet ? 'Sudah diset' : 'Belum diset'}
          </Badge>
        )
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => {
        const isSet = !!targets[item.id]
        return (
          <Button
            size="sm"
            variant={isSet ? 'secondary' : 'primary'}
            onClick={() => handleOpenTargetModal(item)}
            className="flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isSet ? 'Ubah Target' : 'Set Target'}
          </Button>
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
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pekan Murajaah</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tetapkan periode Pekan Murajaah dan atur target harian per halaqah.
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
              Pekan Murajaah Sedang Aktif
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
              Tidak Ada Pekan Murajaah yang Aktif
            </h2>
            <p className="text-sm text-gray-600">
              Tetapkan periode pelaksanaan baru agar pengampu dapat menginput target murajaah harian untuk halaqahnya masing-masing.
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

      {/* Info Card when active */}
      {hasActivePeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-900">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1 leading-relaxed">
            <p className="font-semibold">Langkah Selanjutnya:</p>
            <p>Informasikan target harian ke masing-masing pengampu. Pengampu juga dapat menginput target di halaman setoran mereka sendiri. Koordinator dapat memasukkan target secara langsung di bawah ini.</p>
          </div>
        </div>
      )}

      {/* Target per Halaqah Section (Active Only) */}
      {hasActivePeriod && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Target Per Halaqah</h2>
          </div>
          <Table
            columns={targetColumns}
            data={halaqahList}
            isLoading={isLoading}
            empty={{
              title: 'Halaqah tidak ditemukan',
              description: 'Tidak ada data halaqah yang terdaftar dalam sistem.'
            }}
          />
        </div>
      )}

      {/* Riwayat Table */}
      <div className="space-y-4 border-t border-gray-100 pt-8">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Riwayat Pekan Murajaah</h2>
        </div>
        
        <Table
          columns={riwayatColumns}
          data={riwayat}
          isLoading={isLoading}
          empty={{
            title: 'Belum ada riwayat pekan murajaah',
            description: 'Pekan Murajaah belum pernah ditetapkan sebelumnya.'
          }}
        />
      </div>

      {/* Modal: Tetapkan Periode Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tetapkan Pekan Murajaah Baru"
        size="md"
      >
        <form onSubmit={handleCreatePeriod} className="space-y-6">
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
        title="Akhiri Pekan Murajaah"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex gap-4 items-start text-red-800">
            <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900">Apakah Anda yakin ingin mengakhiri pekan murajaah ini?</h4>
              <p className="text-sm leading-relaxed text-gray-600">
                Pekan Murajaah akan diakhiri hari ini. Target harian per halaqah akan dibekukan dan sistem kembali ke mode setoran normal. Lanjutkan?
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

      {/* Modal: Set/Edit Target */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title={`Set Target Murajaah — ${selectedHalaqah?.nama_halaqah || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveTarget} className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-900">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 leading-relaxed">
              <p className="font-semibold">Panduan Target Murajaah:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Santri dengan hafalan &gt; 3 Juz: <strong>2 Lembar / Hari</strong> (±30 baris)</li>
                <li>Santri dengan hafalan &le; 3 Juz: <strong>Total Hafalan &divide; 15 Baris</strong></li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="number"
              label="Target Baris Per Hari"
              placeholder="Contoh: 30"
              value={targetBaris}
              onChange={(e) => setTargetBaris(e.target.value)}
              required
              min="1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTargetModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Simpan Target
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
