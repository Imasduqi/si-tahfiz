'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Search, Plus, Edit, KeyRound, Trash2, Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Profile, OrangTua } from '@/types'
import {
  createUserAction,
  updateUserAction,
  resetPasswordAction,
  deleteUserAction,
} from '@/lib/actions/tu-akun'
import { bulkCreateOrangTua, type ImportPayload, type ImportResult } from '@/lib/actions/tu-import-ortu'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MergedAccount {
  id: string
  nama_lengkap: string
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
  email_or_phone: string
  created_at: string
}

interface ImportRow {
  rowNumber: number
  namaLengkap: string
  nomorHp: string
  status: 'valid' | 'error'
  errorMessage?: string
}

// Import modal step
type ImportStep = 'upload' | 'preview' | 'result'

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TuAkunPage() {
  console.log('[TuAkunPage] Component rendered')
  const supabase = createClient()

  // ── Existing CRUD State ─────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<MergedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Selected account for edit/reset/delete
  const [selectedAccount, setSelectedAccount] = useState<MergedAccount | null>(null)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'>('tu')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formNewPassword, setFormNewPassword] = useState('')

  // Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Import State ────────────────────────────────────────────────────────────
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep>('upload')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [importResults, setImportResults] = useState<ImportRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importFinalResult, setImportFinalResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Data Fetching ───────────────────────────────────────────────────────────
  const fetchAccounts = async () => {
    try {
      setIsLoading(true)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) throw profilesError

      const { data: orangTua, error: orangTuaError } = await supabase
        .from('orang_tua')
        .select('*')

      if (orangTuaError) throw orangTuaError

      const merged: MergedAccount[] = [
        ...(profiles || []).map((p: Profile) => ({
          id: p.id,
          nama_lengkap: p.nama_lengkap,
          role: p.role,
          email_or_phone: p.email,
          created_at: p.created_at,
        })),
        ...(orangTua || []).map((o: OrangTua) => ({
          id: o.id,
          nama_lengkap: o.nama_lengkap,
          role: 'orang_tua' as const,
          email_or_phone: o.nomor_hp,
          created_at: o.created_at,
        })),
      ]

      // Sort by created_at desc
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAccounts(merged)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengambil data akun: ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Existing CRUD Handlers ──────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setSelectedAccount(null)
    setFormName('')
    setFormRole('tu')
    setFormEmail('')
    setFormPhone('')
    setFormPassword('')
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenEdit = (account: MergedAccount) => {
    setSelectedAccount(account)
    setFormName(account.nama_lengkap)
    setFormRole(account.role)
    if (account.role === 'orang_tua') {
      setFormPhone(account.email_or_phone)
      setFormEmail('')
    } else {
      setFormEmail(account.email_or_phone)
      setFormPhone('')
    }
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleOpenReset = (account: MergedAccount) => {
    setSelectedAccount(account)
    setFormNewPassword('')
    setFormErrors({})
    setIsResetOpen(true)
  }

  const handleOpenDelete = (account: MergedAccount) => {
    setSelectedAccount(account)
    setIsDeleteOpen(true)
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[handleSaveAccount] Called — selectedAccount:', selectedAccount?.id ?? 'NEW')
    console.log('[handleSaveAccount] formRole:', formRole, 'formName:', formName)
    setFormErrors({})

    // Client-side Validation
    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi.'
    }

    if (!selectedAccount) {
      if (formRole === 'orang_tua') {
        if (!formPhone.trim()) {
          errors.nomor_hp = 'Nomor HP wajib diisi.'
        } else if (!/^\d+$/.test(formPhone)) {
          errors.nomor_hp = 'Nomor HP harus berupa angka.'
        } else if (formPhone.length < 10) {
          errors.nomor_hp = 'Nomor HP minimal 10 digit.'
        }
      } else {
        if (!formEmail.trim()) {
          errors.email = 'Email wajib diisi.'
        } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
          errors.email = 'Format email tidak valid.'
        }

        if (!formPassword) {
          errors.password = 'Password wajib diisi.'
        } else if (formPassword.length < 8) {
          errors.password = 'Password minimal 8 karakter.'
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitLoading(true)

      if (selectedAccount) {
        const res = await updateUserAction({
          id: selectedAccount.id,
          nama_lengkap: formName,
          role: selectedAccount.role,
        })

        if (!res.success) throw new Error(res.error)

        toast.success('Nama akun berhasil diperbarui.')
      } else {
        const res = await createUserAction({
          nama_lengkap: formName,
          role: formRole,
          email: formRole === 'orang_tua' ? undefined : formEmail,
          nomor_hp: formRole === 'orang_tua' ? formPhone : undefined,
          password: formRole === 'orang_tua' ? undefined : formPassword,
        })

        if (!res.success) throw new Error(res.error)

        toast.success('Akun baru berhasil dibuat.')
      }

      setIsAddEditOpen(false)
      fetchAccounts()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    if (!formNewPassword) {
      setFormErrors({ password_baru: 'Password baru wajib diisi.' })
      return
    }
    if (formNewPassword.length < 8) {
      setFormErrors({ password_baru: 'Password baru minimal 8 karakter.' })
      return
    }

    if (!selectedAccount) return

    try {
      setIsSubmitLoading(true)
      const res = await resetPasswordAction({
        id: selectedAccount.id,
        password_baru: formNewPassword,
      })

      if (!res.success) throw new Error(res.error)

      toast.success(`Password untuk ${selectedAccount.nama_lengkap} berhasil direset.`)
      setIsResetOpen(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return

    try {
      setIsSubmitLoading(true)
      const res = await deleteUserAction({
        id: selectedAccount.id,
        nama_lengkap: selectedAccount.nama_lengkap,
        role: selectedAccount.role,
      })

      if (!res.success) throw new Error(res.error)

      toast.success(`Akun ${selectedAccount.nama_lengkap} berhasil dihapus.`)
      setIsDeleteOpen(false)
      fetchAccounts()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(errorMsg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // ── Import Handlers ─────────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama Lengkap', 'Nomor HP'],
      ['Contoh: Budi Santoso', '081234567890'],
    ])
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Akun Ortu')
    XLSX.writeFile(wb, 'Template_Import_Akun_OrangTua.xlsx')
    toast.success('Template berhasil diunduh.')
  }

  const handleOpenImport = () => {
    setImportStep('upload')
    setImportFile(null)
    setImportResults([])
    setImportFinalResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsImportOpen(true)
  }

  const handleCloseImport = () => {
    setIsImportOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImportFile(file)
  }

  const validateRows = async (rows: { 'Nama Lengkap': string; 'Nomor HP': string | number }[]) => {
    // Fetch all existing nomor_hp once to avoid N queries
    const { data: existingOrtu } = await supabase
      .from('orang_tua')
      .select('nomor_hp')

    const existingPhones = new Set((existingOrtu ?? []).map((o: { nomor_hp: string }) => o.nomor_hp))

    const results: ImportRow[] = []
    const seenInFile = new Set<string>() // catch duplicates within the same file

    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2: row 1 is header, data starts row 2
      const nama = String(row['Nama Lengkap'] ?? '').trim()
      const nomorHp = String(row['Nomor HP'] ?? '').trim().replace(/[^0-9]/g, '')

      if (!nama) {
        results.push({ rowNumber, namaLengkap: nama, nomorHp, status: 'error', errorMessage: 'Nama lengkap wajib diisi' })
        return
      }

      if (!nomorHp || nomorHp.length < 10) {
        results.push({ rowNumber, namaLengkap: nama, nomorHp, status: 'error', errorMessage: 'Nomor HP tidak valid (minimal 10 digit)' })
        return
      }

      if (existingPhones.has(nomorHp)) {
        results.push({ rowNumber, namaLengkap: nama, nomorHp, status: 'error', errorMessage: 'Nomor HP sudah terdaftar' })
        return
      }

      if (seenInFile.has(nomorHp)) {
        results.push({ rowNumber, namaLengkap: nama, nomorHp, status: 'error', errorMessage: 'Nomor HP duplikat di file ini' })
        return
      }

      seenInFile.add(nomorHp)
      results.push({ rowNumber, namaLengkap: nama, nomorHp, status: 'valid' })
    })

    setImportResults(results)
  }

  const handleParseFile = async () => {
    if (!importFile) return
    setIsParsing(true)
    try {
      const buffer = await importFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<{ 'Nama Lengkap': string; 'Nomor HP': string | number }>(ws)

      // Skip the example row if user didn't delete it
      const validRows = rows.filter(
        (r) => r['Nama Lengkap'] && !String(r['Nama Lengkap']).startsWith('Contoh:')
      )

      if (validRows.length === 0) {
        toast.error('File tidak memiliki data. Pastikan file sesuai template dan isi data di bawah baris header.')
        setIsParsing(false)
        return
      }

      await validateRows(validRows)
      setImportStep('preview')
    } catch {
      toast.error('Gagal membaca file. Pastikan file adalah format .xlsx atau .xls yang valid.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirmImport = async () => {
    setIsImporting(true)

    const validRows: ImportPayload[] = importResults
      .filter((r) => r.status === 'valid')
      .map((r) => ({ namaLengkap: r.namaLengkap, nomorHp: r.nomorHp }))

    const result = await bulkCreateOrangTua(validRows)

    setIsImporting(false)
    setImportFinalResult(result)
    setImportStep('result')

    if (result.success > 0) {
      toast.success(
        `${result.success} akun berhasil dibuat${result.failed > 0 ? `, ${result.failed} gagal` : ''}`
      )
    } else {
      toast.error(`Semua ${result.failed} akun gagal dibuat. Periksa detail error.`)
    }

    // Refresh the main account list in background
    await fetchAccounts()
  }

  // ── Derived Data ────────────────────────────────────────────────────────────

  const filteredAccounts = accounts.filter((acc) => {
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter
    const matchesSearch = acc.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  const validCount = importResults.filter((r) => r.status === 'valid').length
  const errorCount = importResults.filter((r) => r.status === 'error').length

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'tu': return 'TU'
      case 'koordinator': return 'Koordinator'
      case 'pengampu': return 'Pengampu'
      case 'kepsek': return 'Kepsek'
      case 'orang_tua': return 'Orang Tua'
      default: return role
    }
  }

  // ── Table Columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'no',
      header: 'No',
      render: (_: unknown, index: number) => index + 1,
    },
    {
      key: 'nama_lengkap',
      header: 'Nama Lengkap',
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: MergedAccount) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
          item.role === 'tu' ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]' :
          item.role === 'koordinator' ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' :
          item.role === 'pengampu' ? 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]' :
          item.role === 'kepsek' ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' :
          'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
        }`}>
          {getRoleLabel(item.role)}
        </span>
      ),
    },
    {
      key: 'email_or_phone',
      header: 'Email/No HP',
    },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      render: (item: MergedAccount) => formatDate(item.created_at),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: MergedAccount) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
            title="Edit Nama"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenReset(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleOpenDelete(item)}
            className="flex items-center space-x-1 py-1.5 px-2.5 h-auto text-xs"
            title="Hapus Akun"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </Button>
        </div>
      ),
    },
  ]

  // Preview table columns for import modal
  const importPreviewColumns = [
    {
      key: 'rowNumber',
      header: 'No Baris',
      render: (row: ImportRow) => (
        <span className="text-xs text-[#6B7280] font-mono">{row.rowNumber}</span>
      ),
    },
    {
      key: 'namaLengkap',
      header: 'Nama Lengkap',
      render: (row: ImportRow) => (
        <span className="text-sm">{row.namaLengkap || <span className="text-[#9CA3AF] italic">—</span>}</span>
      ),
    },
    {
      key: 'nomorHp',
      header: 'Nomor HP',
      render: (row: ImportRow) => (
        <span className="text-sm font-mono">{row.nomorHp || <span className="text-[#9CA3AF] italic">—</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ImportRow) => (
        <div className="space-y-1">
          {row.status === 'valid' ? (
            <Badge variant="success">Valid</Badge>
          ) : (
            <>
              <Badge variant="danger">Error</Badge>
              {row.errorMessage && (
                <p className="text-xs text-[#DC2626] mt-1">{row.errorMessage}</p>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Manajemen Akun</h1>
          <p className="text-xs text-[#6B7280]">Kelola seluruh akun pengguna di lingkungan Tahfiz</p>
        </div>
        {/* Action buttons: Download Template | Import dari Excel | Tambah Akun */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 py-2.5 px-3.5 rounded-md shadow-none text-sm"
            title="Unduh template Excel untuk import massal Orang Tua"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleOpenImport}
            className="flex items-center space-x-1.5 py-2.5 px-3.5 rounded-md shadow-none text-sm"
            title="Import akun Orang Tua dari file Excel"
          >
            <Upload className="w-4 h-4" />
            <span>Import dari Excel</span>
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 py-2.5 px-4 rounded-md shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        {/* Dropdown Filter by Role */}
        <div className="w-full sm:w-[220px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all cursor-pointer font-medium"
          >
            <option value="all">Semua Role</option>
            <option value="tu">Staff TU</option>
            <option value="koordinator">Koordinator</option>
            <option value="pengampu">Pengampu</option>
            <option value="kepsek">Kepsek</option>
            <option value="orang_tua">Orang Tua</option>
          </select>
        </div>

        {/* Search by Name */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-[13px]" />
          <input
            type="text"
            placeholder="Cari nama pengguna..."
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
            <LoadingSkeleton className="h-8 w-1/2" />
            <LoadingSkeleton className="h-8 w-1/4" />
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
          data={filteredAccounts}
          empty="Tidak ada data akun yang cocok dengan filter atau pencarian."
        />
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedAccount ? 'Edit Akun' : 'Tambah Akun'}
        size="md"
        className="shadow-none p-4"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            error={formErrors.nama_lengkap}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Role
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua')}
              disabled={!!selectedAccount}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] outline-none focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px] transition-all disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:border-[#E5E7EB] cursor-pointer"
            >
              <option value="tu">Staff TU</option>
              <option value="koordinator">Koordinator</option>
              <option value="pengampu">Pengampu</option>
              <option value="kepsek">Kepsek</option>
              <option value="orang_tua">Orang Tua</option>
            </select>
          </div>

          {formRole !== 'orang_tua' && (
            <Input
              label="Email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="contoh@sitahfiz.com"
              disabled={!!selectedAccount}
              error={formErrors.email}
              required
            />
          )}

          {formRole === 'orang_tua' && (
            <Input
              label="Nomor HP"
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="081234567890"
              disabled={!!selectedAccount}
              error={formErrors.nomor_hp}
              required
            />
          )}

          {!selectedAccount && formRole !== 'orang_tua' && (
            <Input
              label="Password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              error={formErrors.password}
              required
            />
          )}

          {/* Prompt/Info for Orang Tua Password */}
          {!selectedAccount && formRole === 'orang_tua' && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-xs rounded-lg">
              <strong>Info:</strong> Password untuk akun Orang Tua akan dibuat secara otomatis dengan format: <code>TAHFIZ_&#123;nomorHP&#125;</code> (contoh: <code>TAHFIZ_081234567890</code>).
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddEditOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitLoading}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset Password"
        size="sm"
        className="shadow-none p-4"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Mereset password untuk akun: <strong>{selectedAccount?.nama_lengkap}</strong> ({getRoleLabel(selectedAccount?.role || '')})
          </p>

          <Input
            label="Password Baru"
            type="password"
            value={formNewPassword}
            onChange={(e) => setFormNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            error={formErrors.password_baru}
            required
            autoFocus
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsResetOpen(false)}
              disabled={isSubmitLoading}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitLoading}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Akun"
        size="sm"
        className="shadow-none p-4"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151]">
            Apakah Anda yakin ingin menghapus akun <strong>{selectedAccount?.nama_lengkap}</strong>?
          </p>
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs rounded-lg">
            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data profil pengguna tersebut secara permanen.
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
              onClick={handleDeleteAccount}
              isLoading={isSubmitLoading}
            >
              Ya, Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Import Excel Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isImportOpen}
        onClose={handleCloseImport}
        title={
          importStep === 'upload' ? 'Import Akun Orang Tua dari Excel' :
          importStep === 'preview' ? 'Preview & Validasi Data Import' :
          'Hasil Import Akun'
        }
        size="lg"
        className="shadow-none p-4"
      >
        {/* ── Step 1: Upload ──────────────────────────────────────────────── */}
        {importStep === 'upload' && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#1E40AF] leading-relaxed">
                Upload file Excel sesuai template. Hanya akun <strong>Orang Tua</strong> yang dapat diimport secara massal.
                Password akan dibuat otomatis dengan format <code className="bg-[#DBEAFE] px-1 rounded">TAHFIZ_&#123;nomorHP&#125;</code>.
              </p>
            </div>

            {/* File drop zone */}
            <div
              className="border-2 border-dashed border-[#D1D5DB] rounded-lg p-8 text-center hover:border-[#10B981] transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="w-10 h-10 text-[#9CA3AF] group-hover:text-[#10B981] mx-auto mb-3 transition-colors" />
              {importFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#111827]">{importFile.name}</p>
                  <p className="text-xs text-[#6B7280]">{(importFile.size / 1024).toFixed(1)} KB — klik untuk mengganti</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#374151]">Klik untuk memilih file</p>
                  <p className="text-xs text-[#9CA3AF]">Format yang diterima: .xlsx, .xls</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                id="import-file-input"
              />
            </div>

            {/* Tip: download template */}
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span>Belum punya template?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[#10B981] hover:text-[#059669] font-medium underline underline-offset-2 transition-colors"
              >
                Unduh Template Excel
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="secondary"
                rounded="md"
                onClick={handleCloseImport}
                className="shadow-none"
              >
                Batal
              </Button>
              <Button
                type="button"
                rounded="md"
                onClick={handleParseFile}
                disabled={!importFile}
                isLoading={isParsing}
                className="shadow-none"
              >
                Proses File
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ─────────────────────────────────────────────── */}
        {importStep === 'preview' && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#374151] font-medium">Hasil Validasi:</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <Badge variant="success">{validCount} baris valid</Badge>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#DC2626]" />
                  <Badge variant="danger">{errorCount} baris error</Badge>
                </div>
              )}
            </div>

            {/* Error info */}
            {errorCount > 0 && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs rounded-lg">
                Baris dengan status <strong>Error</strong> tidak akan diimport. Hanya baris <strong>Valid</strong> yang akan diproses.
              </div>
            )}

            {/* Preview table */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#F3F4F6] sticky top-0">
                  <tr>
                    {importPreviewColumns.map((col) => (
                      <th key={col.key} className="px-4 py-2.5 text-left text-xs font-semibold text-[#374151] border-b border-[#E5E7EB]">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E7EB]">
                  {importResults.map((row, i) => (
                    <tr
                      key={i}
                      className={`${row.status === 'error' ? 'bg-[#FFF5F5]' : 'hover:bg-[#F9FAFB]'} transition-colors`}
                    >
                      {importPreviewColumns.map((col) => (
                        <td key={col.key} className="px-4 py-2.5 align-top">
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="secondary"
                rounded="md"
                onClick={() => setImportStep('upload')}
                className="shadow-none"
              >
                ← Kembali
              </Button>
              <Button
                type="button"
                rounded="md"
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                isLoading={isImporting}
                className="shadow-none"
              >
                {isImporting ? 'Memproses...' : `Import ${validCount} Akun Valid`}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Result ──────────────────────────────────────────────── */}
        {importStep === 'result' && importFinalResult && (
          <div className="space-y-5">
            {/* Result summary card */}
            <div className={`p-4 rounded-lg border ${
              importFinalResult.failed === 0
                ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                : importFinalResult.success === 0
                ? 'bg-[#FEF2F2] border-[#FEE2E2]'
                : 'bg-[#FFFBEB] border-[#FDE68A]'
            }`}>
              <div className="flex items-center gap-3">
                {importFinalResult.failed === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
                ) : importFinalResult.success === 0 ? (
                  <XCircle className="w-8 h-8 text-[#DC2626] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-[#D97706] flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-[#111827]">
                    {importFinalResult.failed === 0
                      ? 'Import selesai!'
                      : importFinalResult.success === 0
                      ? 'Import gagal'
                      : 'Import selesai dengan sebagian error'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="success">{importFinalResult.success} berhasil dibuat</Badge>
                    {importFinalResult.failed > 0 && (
                      <Badge variant="danger">{importFinalResult.failed} gagal</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error details */}
            {importFinalResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#374151]">Detail Kegagalan:</p>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-[#FEE2E2] divide-y divide-[#FEE2E2]">
                  {importFinalResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5 bg-[#FFF5F5]">
                      <XCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{err.nama}</p>
                        <p className="text-xs text-[#6B7280] font-mono">{err.nomorHp}</p>
                        <p className="text-xs text-[#DC2626] mt-0.5">{err.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info: list refreshed */}
            {importFinalResult.success > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#059669]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Daftar akun telah diperbarui secara otomatis.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <Button
                type="button"
                rounded="md"
                onClick={handleCloseImport}
                className="shadow-none"
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
