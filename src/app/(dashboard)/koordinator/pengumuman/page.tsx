'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Table, TableColumn } from '@/components/ui/table'
import { toast } from 'sonner'
import { Trash2, Plus, Volume2 } from 'lucide-react'

interface PengumumanWithAuthor {
  id: string
  judul: string
  isi: string
  target_role: string[]
  dibuat_oleh: string
  created_at: string
  profiles?: {
    nama_lengkap: string
  } | null
}

const AVAILABLE_ROLES = [
  { value: 'tu', label: 'Staff TU' },
  { value: 'koordinator', label: 'Koordinator' },
  { value: 'pengampu', label: 'Pengampu' },
  { value: 'kepsek', label: 'Kepala Sekolah' },
  { value: 'orang_tua', label: 'Orang Tua' }
]

const ROLE_BADGE_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'sakit' | 'izin'> = {
  tu: 'info',
  koordinator: 'success',
  pengampu: 'warning',
  kepsek: 'danger',
  orang_tua: 'sakit'
}

export default function KoordinatorPengumumanPage() {
  const supabase = createClient()
  const { user: currentUser } = useUser()

  // Data States
  const [pengumumanList, setPengumumanList] = useState<PengumumanWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  // Create Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>({
    tu: false,
    koordinator: false,
    pengampu: false,
    kepsek: false,
    orang_tua: false
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load announcements
  const fetchPengumuman = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pengumuman')
        .select('*, profiles(nama_lengkap)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPengumumanList(data || [])
    } catch (err) {
      console.error('Failed to load announcements:', err)
      toast.error('Gagal memuat data pengumuman')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPengumuman()
  }, [])

  // Create Announcement handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!judul.trim() || !isi.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi')
      return
    }

    const roles = Object.keys(selectedRoles).filter(key => selectedRoles[key])
    if (roles.length === 0) {
      toast.error('Pilih minimal satu role penerima')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('pengumuman').insert({
        judul: judul.trim(),
        isi: isi.trim(),
        target_role: roles,
        dibuat_oleh: currentUser!.id
      })

      if (error) throw error

      toast.success('Pengumuman berhasil dibuat')
      setIsCreateOpen(false)
      // Reset form
      setJudul('')
      setIsi('')
      setSelectedRoles({
        tu: false,
        koordinator: false,
        pengampu: false,
        kepsek: false,
        orang_tua: false
      })
      // Refresh list
      fetchPengumuman()
    } catch (err) {
      console.error('Failed to create announcement:', err)
      toast.error('Gagal membuat pengumuman')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Announcement handler
  const handleDelete = async () => {
    if (!deletingId) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('pengumuman')
        .delete()
        .eq('id', deletingId)

      if (error) throw error

      toast.success('Pengumuman berhasil dihapus')
      setIsDeleteOpen(false)
      setDeletingId(null)
      fetchPengumuman()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      toast.error('Gagal menghapus pengumuman')
    } finally {
      setDeleting(false)
    }
  }

  // Handle role checkbox change
  const handleRoleChange = (roleKey: string) => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleKey]: !prev[roleKey]
    }))
  }

  // Table Column Definitions
  const columns: TableColumn<PengumumanWithAuthor>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, index) => <span className="font-medium text-gray-500">{index + 1}</span>
    },
    {
      key: 'judul',
      header: 'Judul',
      render: (item) => (
        <div className="max-w-xs md:max-w-md truncate">
          <div className="font-semibold text-gray-900 truncate">{item.judul}</div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{item.isi}</div>
        </div>
      )
    },
    {
      key: 'target_role',
      header: 'Target Role',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.target_role.map((roleVal) => {
            const roleObj = AVAILABLE_ROLES.find(r => r.value === roleVal)
            return (
              <Badge
                key={roleVal}
                variant={ROLE_BADGE_VARIANTS[roleVal] || 'info'}
                className="text-[10px] py-0.5 px-2 font-semibold"
              >
                {roleObj?.label || roleVal}
              </Badge>
            )
          })}
        </div>
      )
    },
    {
      key: 'dibuat_oleh',
      header: 'Dibuat Oleh',
      render: (item) => <span>{item.profiles?.nama_lengkap || 'Staf'}</span>
    },
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (item) => (
        <span>
          {new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-2"
          onClick={() => {
            setDeletingId(item.id)
            setIsDeleteOpen(true)
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pengumuman</h1>
          <p className="text-sm text-gray-500">
            Terbitkan pengumuman penting yang akan tampil sebagai popup bagi pengguna saat pertama kali masuk.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-2 shadow-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Table
          columns={columns}
          data={pengumumanList}
          isLoading={loading}
          empty={{
            title: "Belum Ada Pengumuman",
            description: "Buat pengumuman pertama Anda untuk ditampilkan ke pengguna."
          }}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Pengumuman Baru"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Judul */}
          <div className="space-y-1.5">
            <label htmlFor="judul" className="text-sm font-semibold text-gray-700">
              Judul Pengumuman
            </label>
            <Input
              id="judul"
              placeholder="Contoh: Libur Pekan Murajaah"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {/* Isi */}
          <div className="space-y-1.5">
            <label htmlFor="isi" className="text-sm font-semibold text-gray-700">
              Isi Pengumuman
            </label>
            <textarea
              id="isi"
              placeholder="Tulis pesan pengumuman lengkap di sini..."
              rows={5}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">
              Target Penerima (Pilih Minimal Satu)
            </label>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles[role.value]}
                    onChange={() => handleRoleChange(role.value)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    disabled={submitting}
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
              className="rounded-lg font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold min-w-[100px]"
            >
              {submitting ? 'Menyimpan...' : 'Terbitkan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Pengumuman"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleting}
              className="rounded-lg font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold min-w-[80px]"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
