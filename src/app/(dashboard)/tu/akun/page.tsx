'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Search, Plus, Edit, KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Profile, OrangTua } from '@/types'
import { 
  createUserAction, 
  updateUserAction, 
  resetPasswordAction, 
  deleteUserAction 
} from '@/lib/actions/tu-akun'

interface MergedAccount {
  id: string
  nama_lengkap: string
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
  email_or_phone: string
  created_at: string
}

export default function TuAkunPage() {
  console.log('[TuAkunPage] Component rendered')
  const supabase = createClient()

  // State
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

  // Load accounts
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
        }))
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

  // Open modals helper
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

  // Handle Form Submission - Create / Update
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
      // Create validation
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
        // Update account name
        const res = await updateUserAction({
          id: selectedAccount.id,
          nama_lengkap: formName,
          role: selectedAccount.role
        })

        if (!res.success) throw new Error(res.error)
        
        toast.success('Nama akun berhasil diperbarui.')
      } else {
        // Create account
        const res = await createUserAction({
          nama_lengkap: formName,
          role: formRole,
          email: formRole === 'orang_tua' ? undefined : formEmail,
          nomor_hp: formRole === 'orang_tua' ? formPhone : undefined,
          password: formRole === 'orang_tua' ? undefined : formPassword
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

  // Handle Form Submission - Reset Password
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
        password_baru: formNewPassword
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

  // Handle Form Submission - Delete User
  const handleDeleteAccount = async () => {
    if (!selectedAccount) return

    try {
      setIsSubmitLoading(true)
      const res = await deleteUserAction({
        id: selectedAccount.id,
        nama_lengkap: selectedAccount.nama_lengkap,
        role: selectedAccount.role
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

  // Filter & Search logic
  const filteredAccounts = accounts.filter((acc) => {
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter
    const matchesSearch = acc.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  // Role labels helper
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

  // Table columns definition
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
      )
    },
    {
      key: 'email_or_phone',
      header: 'Email/No HP'
    },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      render: (item: MergedAccount) => formatDate(item.created_at)
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
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Manajemen Akun</h1>
          <p className="text-xs text-[#6B7280]">Kelola seluruh akun pengguna di lingkungan Tahfiz</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 py-2.5 px-4 self-start sm:self-auto rounded-md shadow-none"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun</span>
        </Button>
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

      {/* Add / Edit Modal */}
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
            <Button
              type="submit"
              isLoading={isSubmitLoading}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
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
            <Button
              type="submit"
              isLoading={isSubmitLoading}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
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
    </div>
  )
}
