'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { SkeletonCard } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { getTodayString, formatDate, formatDateWithDay } from '@/lib/utils'
import { BookMarked, AlertTriangle, Info, Save, Clock } from 'lucide-react'
import { Santri, Setoran } from '@/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type RiwayatManzil = Pick<
  Setoran,
  'tanggal' | 'jumlah_baris' | 'halaman_awal' | 'halaman_akhir' | 'created_at'
>

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrtuManzilPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // ── Children & selection ─────────────────────────────────────────────────
  const [anakList, setAnakList] = useState<Santri[]>([])
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null)

  // ── Syahrul Quran ────────────────────────────────────────────────────────
  const [isSyahrulQuran, setIsSyahrulQuran] = useState<boolean>(false)

  // ── Date ─────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())

  // ── Form fields ──────────────────────────────────────────────────────────
  const [jumlahBaris, setJumlahBaris] = useState<string>('')
  const [halamanAwal, setHalamanAwal] = useState<string>('')
  const [halamanAkhir, setHalamanAkhir] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Existing record ──────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  // ── Riwayat ──────────────────────────────────────────────────────────────
  const [riwayat, setRiwayat] = useState<RiwayatManzil[]>([])

  // ── Loading flags ─────────────────────────────────────────────────────────
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // ──────────────────────────────────────────────────────────────────────────
  // Initial load: fetch children + Syahrul Quran check
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true

    async function initPage() {
      if (!currentUser) return
      setIsPageLoading(true)

      try {
        const today = getTodayString()

        // Parallel: children list + syahrul quran active check
        const [anakResult, syahrulResult] = await Promise.all([
          supabase
            .from('santri')
            .select('*')
            .eq('orang_tua_id', currentUser.id)
            .order('nama_lengkap'),
          supabase
            .from('syahrul_quran')
            .select('id')
            .lte('tanggal_mulai', today)
            .gte('tanggal_selesai', today)
            .maybeSingle(),
        ])

        if (!active) return

        if (anakResult.error) throw anakResult.error

        const children = (anakResult.data as Santri[]) || []
        setAnakList(children)
        setIsSyahrulQuran(!!syahrulResult.data)

        // Select first child by default
        if (children.length > 0) {
          setSelectedAnakId(children[0].id)
        }
      } catch (err) {
        console.error('Init error:', err)
        toast.error('Gagal memuat data. Silakan refresh halaman.')
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
  }, [currentUser, userLoading])

  // ──────────────────────────────────────────────────────────────────────────
  // Fetch existing manzil record + riwayat when child or date changes
  // ──────────────────────────────────────────────────────────────────────────
  const fetchFormData = useCallback(
    async (anakId: string, date: string) => {
      setIsFormLoading(true)
      // Reset form
      setJumlahBaris('')
      setHalamanAwal('')
      setHalamanAkhir('')
      setErrors({})
      setIsEditMode(false)
      setRiwayat([])

      try {
        const [existingResult, riwayatResult] = await Promise.all([
          supabase
            .from('setoran')
            .select('*')
            .eq('santri_id', anakId)
            .eq('tipe', 'manzil')
            .eq('tanggal', date)
            .maybeSingle(),
          supabase
            .from('setoran')
            .select('tanggal, jumlah_baris, halaman_awal, halaman_akhir, created_at')
            .eq('santri_id', anakId)
            .eq('tipe', 'manzil')
            .order('tanggal', { ascending: false })
            .limit(30),
        ])

        if (existingResult.data) {
          const existing = existingResult.data as Setoran
          setIsEditMode(true)
          setJumlahBaris(String(existing.jumlah_baris))
          setHalamanAwal(String(existing.halaman_awal))
          setHalamanAkhir(String(existing.halaman_akhir))
        }

        setRiwayat((riwayatResult.data as RiwayatManzil[]) || [])
      } catch (err) {
        console.error('Fetch form data error:', err)
        toast.error('Gagal memuat data setoran.')
      } finally {
        setIsFormLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    if (selectedAnakId && selectedDate) {
      fetchFormData(selectedAnakId, selectedDate)
    }
  }, [selectedAnakId, selectedDate, fetchFormData])

  // ──────────────────────────────────────────────────────────────────────────
  // Tab switch handler
  // ──────────────────────────────────────────────────────────────────────────
  function handleTabSwitch(anakId: string) {
    if (anakId === selectedAnakId) return
    setSelectedAnakId(anakId)
    // Reset date back to today when switching child
    setSelectedDate(getTodayString())
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!jumlahBaris || jumlahBaris.trim() === '') {
      newErrors.jumlahBaris = 'Field ini wajib diisi'
    } else if (parseInt(jumlahBaris, 10) < 1) {
      newErrors.jumlahBaris = 'Jumlah baris minimal 1'
    }

    if (!halamanAwal || halamanAwal.trim() === '') {
      newErrors.halamanAwal = 'Field ini wajib diisi'
    } else if (parseInt(halamanAwal, 10) < 1) {
      newErrors.halamanAwal = 'Halaman awal minimal 1'
    }

    if (!halamanAkhir || halamanAkhir.trim() === '') {
      newErrors.halamanAkhir = 'Field ini wajib diisi'
    } else if (
      halamanAwal &&
      parseInt(halamanAkhir, 10) < parseInt(halamanAwal, 10)
    ) {
      newErrors.halamanAkhir = 'Halaman akhir tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Submit / Upsert
  // ──────────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser || !selectedAnakId) return
    if (!validate()) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from('setoran').upsert(
        {
          santri_id: selectedAnakId,
          tipe: 'manzil',
          tanggal: selectedDate,
          jumlah_baris: parseInt(jumlahBaris, 10),
          halaman_awal: parseInt(halamanAwal, 10),
          halaman_akhir: parseInt(halamanAkhir, 10),
          jumlah_kesalahan: null,
          status: 'lulus',
          input_oleh: currentUser.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'santri_id,tipe,tanggal' }
      )

      if (error) throw error

      toast.success('Manzil berhasil disimpan')
      // Refresh form data to reflect edit mode and updated riwayat
      await fetchFormData(selectedAnakId, selectedDate)
    } catch (err) {
      console.error('Upsert error:', err)
      toast.error('Gagal menyimpan manzil. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Riwayat table columns
  // ──────────────────────────────────────────────────────────────────────────
  const riwayatColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row: RiwayatManzil) => (
        <span className="font-medium text-[#111827]">{formatDate(row.tanggal)}</span>
      ),
    },
    {
      key: 'jumlah_baris',
      header: 'Baris',
      render: (row: RiwayatManzil) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
          {row.jumlah_baris} baris
        </span>
      ),
    },
    {
      key: 'halaman',
      header: 'Halaman',
      render: (row: RiwayatManzil) => (
        <span className="text-[#374151]">
          {row.halaman_awal} – {row.halaman_akhir}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Waktu Input',
      render: (row: RiwayatManzil) => (
        <span className="text-[#6B7280] text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(row.created_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ]

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Page loading
  // ──────────────────────────────────────────────────────────────────────────
  if (isPageLoading || userLoading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  // No children linked
  if (anakList.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-6 rounded-2xl shadow-md text-center">
          <BookMarked className="w-16 h-16 text-[#D1D5DB] mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-[#374151] mb-2">Tidak Ada Anak Terdaftar</h2>
          <p className="text-sm text-[#6B7280]">
            Akun Anda belum terhubung dengan data santri. Hubungi pihak sekolah untuk informasi lebih lanjut.
          </p>
        </Card>
      </div>
    )
  }

  const selectedAnak = anakList.find((a) => a.id === selectedAnakId)

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Main page
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto pb-24">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
          <BookMarked className="w-5 h-5 text-[#10B981]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Setoran Manzil</h1>
          <p className="text-sm text-[#6B7280]">Input hafalan manzil harian</p>
        </div>
      </div>

      {/* ── Child Tabs (only if > 1 child) ── */}
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

      {/* ── Syahrul Quran Banner ── */}
      {isSyahrulQuran ? (
        <Card className="rounded-2xl shadow-md p-6 bg-[#FFFBEB] border-[#FCD34D]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#92400E] mb-1">Periode Syahrul Quran Aktif</h3>
              <p className="text-sm text-[#92400E] leading-relaxed">
                Setoran Manzil tidak tersedia selama periode Syahrul Quran. Silakan kembali setelah periode berakhir.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* ── Input Form Card ── */}
          <Card className="rounded-2xl shadow-md p-6">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                  {isEditMode ? 'Edit Manzil' : 'Input Manzil'}
                </h2>
                {selectedAnak && (
                  <p className="text-sm text-[#6B7280] mt-0.5">
                    {selectedAnak.nama_lengkap}
                  </p>
                )}
              </div>
              {isEditMode && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                  <Info className="w-3 h-3" />
                  Mode Edit
                </span>
              )}
            </div>

            {isFormLoading ? (
              <div className="space-y-4">
                <div className="h-12 bg-[#F3F4F6] animate-pulse rounded-lg" />
                <div className="h-12 bg-[#F3F4F6] animate-pulse rounded-lg" />
                <div className="h-12 bg-[#F3F4F6] animate-pulse rounded-lg" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" id="form-manzil">
                {/* Date Selector */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Tanggal
                  </label>
                  <input
                    id="input-tanggal"
                    type="date"
                    value={selectedDate}
                    max={getTodayString()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px]"
                  />
                  <p className="mt-1.5 text-xs text-[#6B7280]">
                    {selectedDate ? formatDateWithDay(selectedDate) : ''}
                  </p>
                </div>

                {/* Jumlah Baris */}
                <Input
                  id="input-jumlah-baris"
                  type="number"
                  label="Jumlah Baris"
                  placeholder="Contoh: 20"
                  min={1}
                  value={jumlahBaris}
                  onChange={(e) => {
                    setJumlahBaris(e.target.value)
                    if (errors.jumlahBaris) setErrors((prev) => ({ ...prev, jumlahBaris: '' }))
                  }}
                  error={errors.jumlahBaris}
                />

                {/* Halaman Awal & Akhir */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="input-halaman-awal"
                    type="number"
                    label="Halaman Awal"
                    placeholder="Contoh: 1"
                    min={1}
                    value={halamanAwal}
                    onChange={(e) => {
                      setHalamanAwal(e.target.value)
                      if (errors.halamanAwal) setErrors((prev) => ({ ...prev, halamanAwal: '' }))
                    }}
                    error={errors.halamanAwal}
                  />
                  <Input
                    id="input-halaman-akhir"
                    type="number"
                    label="Halaman Akhir"
                    placeholder="Contoh: 5"
                    min={1}
                    value={halamanAkhir}
                    onChange={(e) => {
                      setHalamanAkhir(e.target.value)
                      if (errors.halamanAkhir) setErrors((prev) => ({ ...prev, halamanAkhir: '' }))
                    }}
                    error={errors.halamanAkhir}
                  />
                </div>

                {/* Status info */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0" />
                  <p className="text-xs font-medium text-[#065F46]">
                    Status otomatis: <span className="font-bold">Lulus</span> — Manzil tidak memiliki status mengulang.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  id="btn-simpan-manzil"
                  type="submit"
                  variant="primary"
                  rounded="full"
                  className="w-full"
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Simpan Perubahan' : 'Simpan Manzil'}
                </Button>
              </form>
            )}
          </Card>

          {/* ── Riwayat Manzil Card ── */}
          <Card className="rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-[#111827]">Riwayat Manzil</h2>
              {riwayat.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
                  {riwayat.length} entri
                </span>
              )}
            </div>

            <Table
              columns={riwayatColumns}
              data={riwayat}
              isLoading={isFormLoading}
              empty={{
                title: 'Belum ada riwayat',
                description: `${selectedAnak?.nama_lengkap ?? 'Anak'} belum memiliki catatan manzil. Mulai input manzil pertama di atas.`,
              }}
            />
          </Card>
        </>
      )}
    </div>
  )
}
