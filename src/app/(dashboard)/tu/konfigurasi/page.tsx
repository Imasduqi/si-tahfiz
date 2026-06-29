'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { formatDate, cn } from '@/lib/utils'
import { Konfigurasi, HariLibur } from '@/types'

export default function TuKonfigurasiPage() {
  const supabase = createClient()

  // Data States
  const [config, setConfig] = useState<Konfigurasi | null>(null)
  const [hariLibur, setHariLibur] = useState<HariLibur[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Section 1 - Semester Dates Form State
  const [mulaiGanjil, setMulaiGanjil] = useState('')
  const [selesaiGanjil, setSelesaiGanjil] = useState('')
  const [mulaiGenap, setMulaiGenap] = useState('')
  const [selesaiGenap, setSelesaiGenap] = useState('')
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({})
  const [isSavingDates, setIsSavingDates] = useState(false)

  // Section 2 - Score Weights Form State
  const [bobotSetoran, setBobotSetoran] = useState(40)
  const [bobotUas, setBobotUas] = useState(40)
  const [bobotAkhlaq, setBobotAkhlaq] = useState(10)
  const [bobotKehadiran, setBobotKehadiran] = useState(10)
  const [isSavingBobot, setIsSavingBobot] = useState(false)

  // Section 3 - Hari Libur Form State
  const [newLiburDate, setNewLiburDate] = useState('')
  const [newLiburKeterangan, setNewLiburKeterangan] = useState('')
  const [isAddingLibur, setIsAddingLibur] = useState(false)

  // Section 4 - Maintenance Mode Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false)
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false)

  // Live total calculation for weights
  const totalBobot = bobotSetoran + bobotUas + bobotAkhlaq + bobotKehadiran
  const isTotalValid = totalBobot === 100

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch конфигураси
      const { data: configData, error: configError } = await supabase
        .from('konfigurasi')
        .select('*')
        .single()
      
      if (configError) throw configError
      
      setConfig(configData)
      if (configData) {
        setMulaiGanjil(configData.tanggal_mulai_ganjil || '')
        setSelesaiGanjil(configData.tanggal_selesai_ganjil || '')
        setMulaiGenap(configData.tanggal_mulai_genap || '')
        setSelesaiGenap(configData.tanggal_selesai_genap || '')
        
        setBobotSetoran(configData.bobot_setoran)
        setBobotUas(configData.bobot_uas)
        setBobotAkhlaq(configData.bobot_akhlaq)
        setBobotKehadiran(configData.bobot_kehadiran)
      }

      // Fetch hari libur
      const { data: liburData, error: liburError } = await supabase
        .from('hari_libur')
        .select('*')
        .order('tanggal', { ascending: true })

      if (liburError) throw liburError
      setHariLibur(liburData || [])

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal memuat konfigurasi: ' + msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Section 1 - Save Dates
  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    const errors: Record<string, string> = {}
    if (!mulaiGanjil) errors.mulaiGanjil = 'Mulai Semester Ganjil wajib diisi'
    if (!selesaiGanjil) errors.selesaiGanjil = 'Selesai Semester Ganjil wajib diisi'
    if (!mulaiGenap) errors.mulaiGenap = 'Mulai Semester Genap wajib diisi'
    if (!selesaiGenap) errors.selesaiGenap = 'Selesai Semester Genap wajib diisi'

    if (mulaiGanjil && selesaiGanjil && selesaiGanjil < mulaiGanjil) {
      errors.selesaiGanjil = 'Tanggal selesai ganjil tidak boleh kurang dari tanggal mulai'
    }
    if (mulaiGenap && selesaiGenap && selesaiGenap < mulaiGenap) {
      errors.selesaiGenap = 'Tanggal selesai genap tidak boleh kurang dari tanggal mulai'
    }

    if (Object.keys(errors).length > 0) {
      setDateErrors(errors)
      return
    }

    setDateErrors({})
    setIsSavingDates(true)

    try {
      const { error } = await supabase
        .from('konfigurasi')
        .update({
          tanggal_mulai_ganjil: mulaiGanjil,
          tanggal_selesai_ganjil: selesaiGanjil,
          tanggal_mulai_genap: mulaiGenap,
          tanggal_selesai_genap: selesaiGenap,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      toast.success('Tanggal semester berhasil disimpan')
      // Update local state
      setConfig(prev => prev ? {
        ...prev,
        tanggal_mulai_ganjil: mulaiGanjil,
        tanggal_selesai_ganjil: selesaiGanjil,
        tanggal_mulai_genap: mulaiGenap,
        tanggal_selesai_genap: selesaiGenap,
      } : null)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan tanggal semester: ' + msg)
    } finally {
      setIsSavingDates(false)
    }
  }

  // Section 2 - Save Weights
  const handleSaveBobot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return
    if (!isTotalValid) {
      toast.error('Total bobot harus tepat 100%')
      return
    }

    setIsSavingBobot(true)

    try {
      const { error } = await supabase
        .from('konfigurasi')
        .update({
          bobot_setoran: bobotSetoran,
          bobot_uas: bobotUas,
          bobot_akhlaq: bobotAkhlaq,
          bobot_kehadiran: bobotKehadiran,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      toast.success('Bobot nilai berhasil disimpan')
      // Update local state
      setConfig(prev => prev ? {
        ...prev,
        bobot_setoran: bobotSetoran,
        bobot_uas: bobotUas,
        bobot_akhlaq: bobotAkhlaq,
        bobot_kehadiran: bobotKehadiran,
      } : null)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan bobot nilai: ' + msg)
    } finally {
      setIsSavingBobot(false)
    }
  }

  // Section 3 - Add Holiday
  const handleAddHariLibur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLiburDate || !newLiburKeterangan) {
      toast.error('Tanggal dan Keterangan libur wajib diisi')
      return
    }

    setIsAddingLibur(true)

    try {
      const { data, error } = await supabase
        .from('hari_libur')
        .insert({
          tanggal: newLiburDate,
          keterangan: newLiburKeterangan
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error('Tanggal ini sudah terdaftar')
          return
        }
        throw error
      }

      toast.success('Hari libur berhasil ditambahkan')
      setHariLibur(prev => [...prev, data].sort((a, b) => a.tanggal.localeCompare(b.tanggal)))
      setNewLiburDate('')
      setNewLiburKeterangan('')

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menambahkan hari libur: ' + msg)
    } finally {
      setIsAddingLibur(false)
    }
  }

  // Section 3 - Delete Holiday
  const handleDeleteHariLibur = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('hari_libur')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Hari libur berhasil dihapus')
      setHariLibur(prev => prev.filter(item => item.id !== id))

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus hari libur: ' + msg)
    }
  }

  // Section 4 - Toggle Maintenance
  const handleToggleClick = () => {
    if (!config) return
    setPendingMaintenanceValue(!config.maintenance_mode)
    setIsMaintenanceModalOpen(true)
  }

  const handleConfirmMaintenance = async () => {
    if (!config) return
    setIsSavingMaintenance(true)

    try {
      const { error } = await supabase
        .from('konfigurasi')
        .update({
          maintenance_mode: pendingMaintenanceValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      toast.success(`Maintenance mode ${pendingMaintenanceValue ? 'diaktifkan' : 'dinonaktifkan'}`)
      setConfig(prev => prev ? { ...prev, maintenance_mode: pendingMaintenanceValue } : null)
      setIsMaintenanceModalOpen(false)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal memperbarui maintenance mode: ' + msg)
    } finally {
      setIsSavingMaintenance(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <h1 className="text-xl font-bold text-[#111827]">Konfigurasi Sistem</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-4 text-center">
        <p className="text-[#EF4444] font-medium">Gagal memuat konfigurasi sistem.</p>
      </div>
    )
  }

  // Columns for Holiday Table
  const holidayColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (item: HariLibur) => formatDate(item.tanggal),
    },
    {
      key: 'keterangan',
      header: 'Keterangan',
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: HariLibur) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteHariLibur(item.id)}
        >
          Hapus
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Konfigurasi Sistem</h1>
        <p className="text-xs text-[#6B7280]">Atur tanggal semester, bobot nilai, hari libur, dan pemeliharaan sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1 - Tanggal Semester */}
        <Card className="p-4 md:p-4">
          <h2 className="text-sm font-bold text-[#111827] mb-4">Tanggal Semester</h2>
          <form onSubmit={handleSaveDates} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Mulai Semester Ganjil"
                value={mulaiGanjil}
                onChange={(e) => setMulaiGanjil(e.target.value)}
                error={dateErrors.mulaiGanjil}
              />
              <Input
                type="date"
                label="Selesai Semester Ganjil"
                value={selesaiGanjil}
                onChange={(e) => setSelesaiGanjil(e.target.value)}
                error={dateErrors.selesaiGanjil}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Mulai Semester Genap"
                value={mulaiGenap}
                onChange={(e) => setMulaiGenap(e.target.value)}
                error={dateErrors.mulaiGenap}
              />
              <Input
                type="date"
                label="Selesai Semester Genap"
                value={selesaiGenap}
                onChange={(e) => setSelesaiGenap(e.target.value)}
                error={dateErrors.selesaiGenap}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSavingDates}>
                Simpan Tanggal
              </Button>
            </div>
          </form>
        </Card>

        {/* Section 2 - Bobot Nilai Akhir */}
        <Card className="p-4 md:p-4">
          <h2 className="text-sm font-bold text-[#111827] mb-4">Bobot Nilai Akhir</h2>
          <form onSubmit={handleSaveBobot} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Setoran Harian (%)"
                min="0"
                max="100"
                value={bobotSetoran}
                onChange={(e) => setBobotSetoran(parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                label="UAS (%)"
                min="0"
                max="100"
                value={bobotUas}
                onChange={(e) => setBobotUas(parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                label="Akhlaq (%)"
                min="0"
                max="100"
                value={bobotAkhlaq}
                onChange={(e) => setBobotAkhlaq(parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                label="Kehadiran (%)"
                min="0"
                max="100"
                value={bobotKehadiran}
                onChange={(e) => setBobotKehadiran(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-semibold">
                Total:{' '}
                <span className={cn(isTotalValid ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                  {totalBobot}%
                </span>
              </div>
              <Button
                type="submit"
                disabled={!isTotalValid}
                isLoading={isSavingBobot}
              >
                Simpan Bobot
              </Button>
            </div>
          </form>
        </Card>

        {/* Section 3 - Hari Libur */}
        <Card className="p-4 md:p-4 lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-[#111827]">Hari Libur</h2>
          
          {/* Add Inline Form */}
          <form onSubmit={handleAddHariLibur} className="flex flex-col sm:flex-row gap-4 items-end bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
            <div className="w-full sm:w-1/4">
              <Input
                type="date"
                label="Tanggal"
                value={newLiburDate}
                onChange={(e) => setNewLiburDate(e.target.value)}
              />
            </div>
            <div className="w-full sm:flex-1">
              <Input
                type="text"
                label="Keterangan"
                placeholder="Contoh: Hari Kemerdekaan RI"
                value={newLiburKeterangan}
                onChange={(e) => setNewLiburKeterangan(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Button type="submit" className="w-full" isLoading={isAddingLibur}>
                Tambah
              </Button>
            </div>
          </form>

          {/* Holidays List */}
          <div className="max-h-60 overflow-y-auto">
            <Table
              columns={holidayColumns}
              data={hariLibur}
              empty="Belum ada hari libur yang terdaftar"
            />
          </div>
        </Card>

        {/* Section 4 - Maintenance Mode */}
        <Card className="p-4 md:p-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#111827]">Maintenance Mode</h2>
                <Badge variant={config.maintenance_mode ? 'danger' : 'success'}>
                  {config.maintenance_mode ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280]">
                Jika aktif, seluruh pengguna selain Staff TU akan dialihkan ke halaman pemeliharaan dan tidak dapat mengakses aplikasi.
              </p>
            </div>

            {/* Custom Toggle Switch */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleToggleClick}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2",
                  config.maintenance_mode ? "bg-[#10B981]" : "bg-[#D1D5DB]"
                )}
                role="switch"
                aria-checked={config.maintenance_mode}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    config.maintenance_mode ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Maintenance Confirmation Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title={pendingMaintenanceValue ? "Aktifkan Maintenance Mode" : "Nonaktifkan Maintenance Mode"}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151] leading-relaxed">
            {pendingMaintenanceValue
              ? "Seluruh pengguna selain TU akan dialihkan ke halaman maintenance. Lanjutkan?"
              : "Maintenance mode akan dinonaktifkan. Seluruh pengguna dapat kembali mengakses sistem. Lanjutkan?"}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsMaintenanceModalOpen(false)}
              disabled={isSavingMaintenance}
            >
              Batal
            </Button>
            <Button
              variant={pendingMaintenanceValue ? "danger" : "primary"}
              onClick={handleConfirmMaintenance}
              isLoading={isSavingMaintenance}
            >
              Ya, {pendingMaintenanceValue ? "Aktifkan" : "Nonaktifkan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
