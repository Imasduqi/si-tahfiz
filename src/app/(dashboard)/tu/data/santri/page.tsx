'use client'

import React, { useEffect, useRef, useState , useMemo} from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { useUser } from '@/hooks/use-user'
import { Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// ─── Existing Interfaces ────────────────────────────────────────────────────

interface SantriWithRelations {
  id: string
  nama_lengkap: string
  kelas: string
  grade: 'tahsin' | 'takmil' | 'tahfiz'
  halaqah_id: string
  orang_tua_id: string | null
  created_at: string
  halaqah: {
    id: string
    nama_halaqah: string
    grade: string
  } | null
  orang_tua: {
    id: string
    nama_lengkap: string
    nomor_hp: string
  } | null
}

interface HalaqahOption {
  id: string
  nama_halaqah: string
  grade: string
}

interface OrangTuaOption {
  id: string
  nama_lengkap: string
  nomor_hp: string
}

// ─── Import Interfaces ──────────────────────────────────────────────────────

interface ImportRow {
  rowNumber: number
  nama: string
  kelas: string
  grade: string
  halaqahNama: string
  halaqahId: string | null
  nomorHpOrtu: string
  ortuId: string | null
  status: 'valid' | 'error'
  errorMessage?: string
}

interface ImportFinalResult {
  success: number
  failed: number
  errors: { nama: string; reason: string }[]
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function TuDataSantriPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()

  // Data State
  const [santriList, setSantriList] = useState<SantriWithRelations[]>([])
  const [halaqahList, setHalaqahList] = useState<HalaqahOption[]>([])
  const [orangTuaList, setOrangTuaList] = useState<OrangTuaOption[]>([])

  // Loading & Filter State
  const [isLoading, setIsLoading] = useState(true)
  const [halaqahFilter, setHalaqahFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state — existing CRUD
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Selected state
  const [selectedSantri, setSelectedSantri] = useState<SantriWithRelations | null>(null)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formKelas, setFormKelas] = useState('')
  const [formGrade, setFormGrade] = useState<'tahsin' | 'takmil' | 'tahfiz'>('tahsin')
  const [formHalaqahId, setFormHalaqahId] = useState('')
  const [formOrangTuaId, setFormOrangTuaId] = useState('')

  // Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Import State ─────────────────────────────────────────────────────────
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [importResults, setImportResults] = useState<ImportRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importFinalResult, setImportFinalResult] = useState<ImportFinalResult | null>(null)

  // Import step: 'upload' | 'preview' | 'done'
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'done'>('upload')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch all necessary data ─────────────────────────────────────────────
  const fetchSantriList = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch halaqah list
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select('id, nama_halaqah, grade')
        .order('nama_halaqah')
      if (halaqahError) throw halaqahError
      setHalaqahList(halaqahData || [])

      // 2. Fetch orang tua list
      const { data: ortuData, error: ortuError } = await supabase
        .from('orang_tua')
        .select('id, nama_lengkap, nomor_hp')
        .order('nama_lengkap')
      if (ortuError) throw ortuError
      setOrangTuaList(ortuData || [])

      // 3. Fetch santri list with joins
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select(`
          *,
          halaqah (id, nama_halaqah, grade),
          orang_tua (id, nama_lengkap, nomor_hp)
        `)
        .order('nama_lengkap')
      if (santriError) throw santriError
      setSantriList((santriData as unknown as SantriWithRelations[]) || [])

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal memuat data: ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSantriList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Open modals helper (existing) ────────────────────────────────────────
  const handleOpenAdd = () => {
    setSelectedSantri(null)
    setFormName('')
    setFormKelas('')
    setFormGrade('tahsin')
    setFormHalaqahId(halaqahList[0]?.id || '')
    setFormOrangTuaId('')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenEdit = (santri: SantriWithRelations) => {
    setSelectedSantri(santri)
    setFormName(santri.nama_lengkap)
    setFormKelas(santri.kelas)
    setFormGrade(santri.grade)
    setFormHalaqahId(santri.halaqah_id)
    setFormOrangTuaId(santri.orang_tua_id || '')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenDelete = (santri: SantriWithRelations) => {
    setSelectedSantri(santri)
    setIsDeleteOpen(true)
  }

  // ── Handle Form Submission - Create / Update (existing) ──────────────────
  const handleSaveSantri = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi.'
    }
    if (!formKelas.trim()) {
      errors.kelas = 'Kelas wajib diisi.'
    }
    if (!formGrade) {
      errors.grade = 'Grade wajib diisi.'
    }
    if (!formHalaqahId) {
      errors.halaqah_id = 'Halaqah wajib diisi.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitLoading(true)

      const payload = {
        nama_lengkap: formName.trim(),
        kelas: formKelas.trim(),
        grade: formGrade,
        halaqah_id: formHalaqahId,
        orang_tua_id: formOrangTuaId || null
      }

      if (selectedSantri) {
        const { error } = await supabase
          .from('santri')
          .update(payload)
          .eq('id', selectedSantri.id)

        if (error) throw error
        toast.success('Data santri berhasil diperbarui.')
      } else {
        const { error } = await supabase
          .from('santri')
          .insert(payload)

        if (error) throw error
        toast.success('Santri baru berhasil ditambahkan.')
      }

      setIsAddEditOpen(false)
      fetchSantriList()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan data: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // ── Handle Delete (existing) ─────────────────────────────────────────────
  const handleDeleteSantri = async () => {
    if (!selectedSantri) return

    try {
      setIsSubmitLoading(true)

      const { error } = await supabase
        .from('santri')
        .delete()
        .eq('id', selectedSantri.id)

      if (error) throw error

      if (user?.id) {
        await supabase.from('audit_trail').insert({
          user_id: user.id,
          aktivitas: `Hapus santri: ${selectedSantri.nama_lengkap}`
        })
      }

      toast.success(`Data santri ${selectedSantri.nama_lengkap} berhasil dihapus.`)
      setIsDeleteOpen(false)
      fetchSantriList()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus santri: ' + errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // ── Client-side Filter & Search ──────────────────────────────────────────
  const filteredSantri = santriList.filter((s) => {
    const matchesHalaqah = halaqahFilter === 'all' || s.halaqah_id === halaqahFilter
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter
    const matchesSearch = s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesHalaqah && matchesGrade && matchesSearch
  })

  // ── Grade labels helper ──────────────────────────────────────────────────
  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'tahsin': return 'Tahsin'
      case 'takmil': return 'Takmil'
      case 'tahfiz': return 'Tahfiz'
      default: return grade
    }
  }

  // ── IMPORT: Download Template ────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama', 'Kelas', 'Grade', 'Halaqah', 'Nomor HP Orang Tua'],
      ['Contoh: Ahmad Fauzi', '7A', 'Tahsin', 'Halaqah Al-Fatih', '081234567890']
    ])
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Santri')
    XLSX.writeFile(wb, 'Template_Import_Santri.xlsx')
  }

  // ── IMPORT: Open Import Modal ────────────────────────────────────────────
  const handleOpenImport = () => {
    setImportFile(null)
    setImportResults([])
    setImportFinalResult(null)
    setImportStep('upload')
    setIsImportModalOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── IMPORT: Validate rows ────────────────────────────────────────────────
  const validateRows = async (rows: Record<string, string | number | undefined>[]) => {
    // Fetch reference data once
    const { data: halaqahData } = await supabase
      .from('halaqah')
      .select('id, nama_halaqah')

    const { data: ortuData } = await supabase
      .from('orang_tua')
      .select('id, nomor_hp')

    const { data: existingSantri } = await supabase
      .from('santri')
      .select('nama_lengkap, kelas, grade, orang_tua_id')

    const halaqahMap = new Map(
      (halaqahData ?? []).map((h) => [h.nama_halaqah.toLowerCase().trim(), h.id])
    )
    const ortuMap = new Map(
      (ortuData ?? []).map((o) => [o.nomor_hp, o.id])
    )

    const validGrades = ['tahsin', 'takmil', 'tahfiz']
    const results: ImportRow[] = []
    const seenInFile = new Set<string>()

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const nama = String(row['Nama'] ?? '').trim()
      const kelas = String(row['Kelas'] ?? '').trim()
      const gradeRaw = String(row['Grade'] ?? '').trim().toLowerCase()
      const halaqahNama = String(row['Halaqah'] ?? '').trim()
      const nomorHpOrtu = String(row['Nomor HP Orang Tua'] ?? '')
        .trim()
        .replace(/[^0-9]/g, '')

      if (!nama) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId: null, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: 'Nama wajib diisi' })
        return
      }

      if (!kelas) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId: null, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: 'Kelas wajib diisi' })
        return
      }

      if (!validGrades.includes(gradeRaw)) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId: null, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: `Grade '${row['Grade']}' tidak valid. Gunakan: Tahsin, Takmil, atau Tahfiz` })
        return
      }

      const halaqahId = halaqahMap.get(halaqahNama.toLowerCase()) ?? null
      if (!halaqahId) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId: null, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: `Halaqah '${halaqahNama}' tidak ditemukan` })
        return
      }

      if (!nomorHpOrtu) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: 'Nomor HP Orang Tua wajib diisi' })
        return
      }

      const ortuId = ortuMap.get(nomorHpOrtu) ?? null
      if (!ortuId) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId, nomorHpOrtu, ortuId: null, status: 'error', errorMessage: `Orang tua dengan nomor HP ${nomorHpOrtu} belum terdaftar, daftarkan dulu di menu Akun` })
        return
      }

      // Duplicate check against existing DB records
      const existsInDb = (existingSantri ?? []).some(
        (s) =>
          s.nama_lengkap.toLowerCase() === nama.toLowerCase() &&
          s.orang_tua_id === ortuId &&
          s.kelas.toLowerCase() === kelas.toLowerCase() &&
          s.grade === gradeRaw
      )

      if (existsInDb) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId, nomorHpOrtu, ortuId, status: 'error', errorMessage: 'Santri ini sudah ada/duplikat' })
        return
      }

      // Duplicate within file
      const duplicateKey = `${nama.toLowerCase()}|${nomorHpOrtu}|${kelas.toLowerCase()}|${gradeRaw}`
      if (seenInFile.has(duplicateKey)) {
        results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId, nomorHpOrtu, ortuId, status: 'error', errorMessage: 'Santri ini sudah ada/duplikat (duplikat di file ini)' })
        return
      }

      seenInFile.add(duplicateKey)
      results.push({ rowNumber, nama, kelas, grade: gradeRaw, halaqahNama, halaqahId, nomorHpOrtu, ortuId, status: 'valid' })
    })

    setImportResults(results)
    setImportStep('preview')
  }

  // ── IMPORT: Parse File ───────────────────────────────────────────────────
  const handleParseFile = async () => {
    if (!importFile) return
    setIsParsingFile(true)
    try {
      const buffer = await importFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number | undefined>>(ws)
      const validRows = rows.filter(
        (r) => r['Nama'] && !String(r['Nama']).startsWith('Contoh:')
      )
      if (validRows.length === 0) {
        toast.error('File tidak memiliki baris data yang valid.')
        setIsParsingFile(false)
        return
      }
      await validateRows(validRows)
    } catch {
      toast.error('Gagal membaca file. Pastikan format file adalah .xlsx atau .xls.')
    } finally {
      setIsParsingFile(false)
    }
  }

  // ── IMPORT: Confirm Bulk Insert ──────────────────────────────────────────
  const handleConfirmImport = async () => {
    setIsImporting(true)

    const validRows = importResults.filter((r) => r.status === 'valid')
    const results: ImportFinalResult = { success: 0, failed: 0, errors: [] }

    for (const row of validRows) {
      const { error } = await supabase.from('santri').insert({
        nama_lengkap: row.nama,
        kelas: row.kelas,
        grade: row.grade,
        halaqah_id: row.halaqahId,
        orang_tua_id: row.ortuId
      })

      if (error) {
        results.failed++
        results.errors.push({ nama: row.nama, reason: error.message })
      } else {
        results.success++
      }
    }

    setIsImporting(false)
    setImportFinalResult(results)
    setImportStep('done')

    toast.success(
      `${results.success} santri berhasil diimport${results.failed > 0 ? `, ${results.failed} gagal` : ''}`
    )

    await fetchSantriList()
  }

  // ── IMPORT: Close & Reset ────────────────────────────────────────────────
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false)
    setImportFile(null)
    setImportResults([])
    setImportFinalResult(null)
    setImportStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Derived Import counts ────────────────────────────────────────────────
  const validCount = importResults.filter((r) => r.status === 'valid').length
  const errorCount = importResults.filter((r) => r.status === 'error').length

  // ── Empty state check for halaqah ────────────────────────────────────────
  if (!isLoading && halaqahList.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Halaqah"
        description="Tambah halaqah terlebih dahulu di menu Data Halaqah sebelum dapat mengelola data santri."
        action={
          <Link href="/tu/data/halaqah">
            <Button className="rounded-md">Tambah Halaqah</Button>
          </Link>
        }
      />
    )
  }

  const columns = [
    {
      key: 'no',
      header: 'No',
      render: (_: unknown, index: number) => index + 1
    },
    {
      key: 'nama_lengkap',
      header: 'Nama Lengkap'
    },
    {
      key: 'kelas',
      header: 'Kelas'
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (item: SantriWithRelations) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
          item.grade === 'tahsin' ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' :
          item.grade === 'takmil' ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' :
          'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
        }`}>
          {getGradeLabel(item.grade)}
        </span>
      )
    },
    {
      key: 'halaqah',
      header: 'Halaqah',
      render: (item: SantriWithRelations) => item.halaqah?.nama_halaqah || '-'
    },
    {
      key: 'orang_tua',
      header: 'Orang Tua',
      render: (item: SantriWithRelations) =>
        item.orang_tua ? `${item.orang_tua.nama_lengkap} (${item.orang_tua.nomor_hp})` : '-'
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: SantriWithRelations) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleOpenDelete(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Data Santri</h1>
          <p className="text-xs text-[#6B7280]">Kelola biodata santri, jenjang, halaqah, dan wali murid</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-auto">
          {/* Download Template */}
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 py-2.5 px-4 rounded-md shadow-none text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </Button>

          {/* Import dari Excel */}
          <Button
            variant="secondary"
            onClick={handleOpenImport}
            className="flex items-center space-x-1.5 py-2.5 px-4 rounded-md shadow-none text-sm border-[#10B981] text-[#059669]"
          >
            <Upload className="w-4 h-4" />
            <span>Import dari Excel</span>
          </Button>

          {/* Tambah Santri */}
          <Button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 py-2.5 px-4 rounded-md shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri</span>
          </Button>
        </div>
      </div>

      {/* Import template note */}
      <p className="text-xs text-[#6B7280] bg-[#F0FDF4] border border-[#A7F3D0] rounded-lg px-3 py-2 leading-relaxed">
        <span className="font-semibold text-[#065F46]">Catatan Import:</span>{' '}
        Pastikan nama Halaqah sesuai dengan yang sudah terdaftar di sistem dan nomor HP Orang Tua sudah terdaftar di menu Akun sebelum import.
      </p>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        {/* Filter by Halaqah */}
        <div className="w-full sm:w-[200px]">
          <select
            value={halaqahFilter}
            onChange={(e) => setHalaqahFilter(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
          >
            <option value="all">Semua Halaqah</option>
            {halaqahList.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nama_halaqah} ({getGradeLabel(h.grade)})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Grade */}
        <div className="w-full sm:w-[150px]">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
          >
            <option value="all">Semua Grade</option>
            <option value="tahsin">Tahsin</option>
            <option value="takmil">Takmil</option>
            <option value="tahfiz">Tahfiz</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-[13px]" />
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:pl-[39px] focus:pr-[13px] focus:py-[9px]"
          />
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4 bg-white">
          <div className="flex space-x-4">
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-8 w-1/2" />
          </div>
          <div className="space-y-2">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredSantri}
          empty="Tidak ada data santri yang cocok dengan filter atau pencarian."
        />
      )}

      {/* ── Add / Edit Modal (existing) ── */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedSantri ? 'Edit Biodata Santri' : 'Tambah Santri'}
        size="md"
        className="shadow-none p-4"
      >
        <form onSubmit={handleSaveSantri} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Masukkan nama lengkap santri"
            error={formErrors.nama_lengkap}
            required
            autoFocus
          />

          <Input
            label="Kelas"
            value={formKelas}
            onChange={(e) => setFormKelas(e.target.value)}
            placeholder="Contoh: 7A, 8B"
            error={formErrors.kelas}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Grade
            </label>
            <select
              value={formGrade}
              onChange={(e) => setFormGrade(e.target.value as 'tahsin' | 'takmil' | 'tahfiz')}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              <option value="tahsin">Tahsin</option>
              <option value="takmil">Takmil</option>
              <option value="tahfiz">Tahfiz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Halaqah
            </label>
            <select
              value={formHalaqahId}
              onChange={(e) => setFormHalaqahId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              {halaqahList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nama_halaqah} ({getGradeLabel(h.grade)})
                </option>
              ))}
            </select>
            {formErrors.halaqah_id && (
              <span className="block mt-1 text-xs text-[#EF4444] font-medium">
                {formErrors.halaqah_id}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Orang Tua / Wali
            </label>
            <select
              value={formOrangTuaId}
              onChange={(e) => setFormOrangTuaId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
            >
              <option value="">-- Tanpa Hubungan Orang Tua --</option>
              {orangTuaList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama_lengkap} ({o.nomor_hp})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddEditOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitLoading}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal (existing) ── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Santri"
        size="sm"
        className="shadow-none p-4"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151]">
            Apakah Anda yakin ingin menghapus data santri <strong>{selectedSantri?.nama_lengkap}</strong>?
          </p>
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs rounded-lg font-medium leading-relaxed">
            Menghapus santri akan menghapus seluruh data setoran, absensi, tikrar, UKJ, UAS, dan akhlaq santri ini. Yakin?
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSantri}
              isLoading={isSubmitLoading}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title={
          importStep === 'upload'
            ? 'Import Santri dari Excel'
            : importStep === 'preview'
            ? 'Pratinjau Data Import'
            : 'Hasil Import'
        }
        size="lg"
        className="shadow-none p-4"
      >
        {/* STEP: Upload */}
        {importStep === 'upload' && (
          <div className="space-y-5">
            {/* File Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-2">
                Pilih File Excel (.xlsx / .xls)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  importFile
                    ? 'border-[#10B981] bg-[#F0FDF4]'
                    : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#10B981] hover:bg-[#F0FDF4]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setImportFile(f)
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  id="import-file-input"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                {importFile ? (
                  <div>
                    <p className="text-sm font-semibold text-[#065F46]">{importFile.name}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-[#374151]">
                      Klik atau seret file Excel ke sini
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Format: .xlsx atau .xls</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-2 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#B45309] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#92400E] leading-relaxed">
                Pastikan nama Halaqah sesuai dengan yang sudah terdaftar di sistem dan nomor HP Orang Tua sudah terdaftar di menu Akun sebelum import.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseImportModal}
                disabled={isParsingFile}
              >
                Batal
              </Button>
              <Button
                onClick={handleParseFile}
                disabled={!importFile || isParsingFile}
                isLoading={isParsingFile}
                className="rounded-md shadow-none"
              >
                Proses File
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {importStep === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg">
                <CheckCircle className="w-4 h-4 text-[#065F46]" />
                <span className="text-xs font-semibold text-[#065F46]">{validCount} baris valid</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
                <XCircle className="w-4 h-4 text-[#991B1B]" />
                <span className="text-xs font-semibold text-[#991B1B]">{errorCount} baris error</span>
              </div>
              <span className="text-xs text-[#6B7280]">Total: {importResults.length} baris dibaca</span>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280] w-12">Baris</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Nama</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Kelas</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Grade</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Halaqah</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">No HP Ortu</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importResults.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-[#E5E7EB] last:border-0 ${
                        row.status === 'error' ? 'bg-[#FFF5F5]' : 'bg-white'
                      }`}
                    >
                      <td className="px-3 py-2 text-[#6B7280]">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-[#111827]">{row.nama || <span className="text-[#9CA3AF] italic">kosong</span>}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.kelas || '-'}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.grade ? getGradeLabel(row.grade) : '-'}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.halaqahNama || '-'}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.nomorHpOrtu || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          <Badge variant={row.status === 'valid' ? 'success' : 'danger'}>
                            {row.status === 'valid' ? 'Valid' : 'Error'}
                          </Badge>
                          {row.errorMessage && (
                            <p className="text-[#EF4444] text-[10px] leading-snug max-w-[200px]">
                              {row.errorMessage}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setImportStep('upload')
                  setImportResults([])
                  setImportFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={isImporting}
              >
                Kembali
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isImporting}
                isLoading={isImporting}
                className="rounded-md shadow-none"
              >
                Import {validCount} Santri Valid
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {importStep === 'done' && importFinalResult && (
          <div className="space-y-4">
            {/* Result Summary */}
            <div className="text-center py-4">
              {importFinalResult.success > 0 && importFinalResult.failed === 0 ? (
                <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
              ) : importFinalResult.success === 0 ? (
                <XCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-3" />
              ) : (
                <AlertCircle className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
              )}
              <h4 className="text-base font-bold text-[#111827]">Import Selesai</h4>
              <p className="text-sm text-[#6B7280] mt-1">
                {importFinalResult.success} santri berhasil diimport
                {importFinalResult.failed > 0 && `, ${importFinalResult.failed} santri gagal`}
              </p>
            </div>

            {/* Success / Failed Counters */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg text-center">
                <p className="text-xl font-bold text-[#065F46]">{importFinalResult.success}</p>
                <p className="text-xs text-[#065F46] font-medium">Berhasil</p>
              </div>
              {importFinalResult.failed > 0 && (
                <div className="flex-1 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-center">
                  <p className="text-xl font-bold text-[#991B1B]">{importFinalResult.failed}</p>
                  <p className="text-xs text-[#991B1B] font-medium">Gagal</p>
                </div>
              )}
            </div>

            {/* Error Details */}
            {importFinalResult.errors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#374151] mb-2">Detail Kegagalan:</p>
                <div className="border border-[#FEE2E2] rounded-lg overflow-hidden">
                  {importFinalResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 px-3 py-2 border-b border-[#FEE2E2] last:border-0 bg-[#FFF5F5]"
                    >
                      <XCircle className="w-3.5 h-3.5 text-[#EF4444] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#374151]">{err.nama}</p>
                        <p className="text-[10px] text-[#6B7280]">{err.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <Button
                onClick={handleCloseImportModal}
                className="rounded-md shadow-none"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
