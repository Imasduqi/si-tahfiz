'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableColumn } from '@/components/ui/table'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { BeritaLogin } from '@/types'

export default function TuSistemBeritaPage() {
  const supabase = useMemo(() => createClient(), [])

  // State
  const [beritaList, setBeritaList] = useState<BeritaLogin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBerita, setSelectedBerita] = useState<BeritaLogin | null>(null)
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [beritaToDelete, setBeritaToDelete] = useState<BeritaLogin | null>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  // Fetch berita
  const fetchBerita = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('berita_login')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeritaList(data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengambil data berita: ' + msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBerita()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open modal for Create
  const handleOpenCreate = () => {
    setSelectedBerita(null)
    setJudul('')
    setIsi('')
    setErrors({})
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (berita: BeritaLogin) => {
    setSelectedBerita(berita)
    setJudul(berita.judul)
    setIsi(berita.isi)
    setErrors({})
    setIsModalOpen(true)
  }

  // Open delete confirmation modal
  const handleOpenDelete = (berita: BeritaLogin) => {
    setBeritaToDelete(berita)
    setIsDeleteOpen(true)
  }

  // Form Submission — Create / Update
  const handleSaveBerita = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!judul.trim()) newErrors.judul = 'Judul berita wajib diisi'
    if (!isi.trim()) newErrors.isi = 'Isi berita wajib diisi'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pengguna tidak terautentikasi')

      if (selectedBerita) {
        // Update
        const { error } = await supabase
          .from('berita_login')
          .update({
            judul: judul.trim(),
            isi: isi.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBerita.id)

        if (error) throw error
        toast.success('Berita berhasil diperbarui')
      } else {
        // Create
        const { error } = await supabase
          .from('berita_login')
          .insert({
            judul: judul.trim(),
            isi: isi.trim(),
            dibuat_oleh: user.id
          })

        if (error) throw error
        toast.success('Berita berhasil ditambahkan')
      }

      setIsModalOpen(false)
      fetchBerita()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan berita: ' + msg)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Handle deletion
  const handleDeleteBerita = async () => {
    if (!beritaToDelete) return
    setIsDeleteLoading(true)

    try {
      const { error } = await supabase
        .from('berita_login')
        .delete()
        .eq('id', beritaToDelete.id)

      if (error) throw error

      toast.success('Berita berhasil dihapus')
      setIsDeleteOpen(false)
      setBeritaToDelete(null)
      fetchBerita()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus berita: ' + msg)
    } finally {
      setIsDeleteLoading(false)
    }
  }

  // Table Columns
  const columns: TableColumn<BeritaLogin>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, index) => index + 1,
    },
    {
      key: 'judul',
      header: 'Judul',
      render: (item: BeritaLogin) => (
        <span className="font-semibold text-[#111827]">{item.judul}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      render: (item: BeritaLogin) => formatDate(item.created_at),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (item: BeritaLogin) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(item)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleOpenDelete(item)}>
            Hapus
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Berita Halaman Login</h1>
          <p className="text-xs text-[#6B7280]">
            Berita ini ditampilkan di halaman login dan dapat dilihat oleh semua pengguna tanpa perlu login.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleOpenCreate}>
            Tambah Berita
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={beritaList}
            empty="Belum ada berita yang diterbitkan. Klik 'Tambah Berita' untuk memulai."
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBerita ? 'Edit Berita' : 'Tambah Berita'}
      >
        <form onSubmit={handleSaveBerita} className="space-y-4">
          <Input
            type="text"
            label="Judul Berita"
            placeholder="Masukkan judul berita..."
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            error={errors.judul}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Isi Berita
            </label>
            <textarea
              rows={6}
              className={`w-full bg-[#F9FAFB] border rounded-lg px-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] ${
                errors.isi
                  ? 'border-2 border-[#EF4444] px-[13px] py-[9px] focus:border-[#EF4444]'
                  : 'border-[#E5E7EB] focus:px-[13px] focus:py-[9px]'
              }`}
              placeholder="Tulis isi berita di sini (plain text saja)..."
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              required
            />
            {errors.isi && (
              <span className="block mt-1 text-xs text-[#EF4444] font-medium">
                {errors.isi}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Berita"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151] leading-relaxed">
            Apakah Anda yakin ingin menghapus berita ini secara permanen? Tindakan ini tidak dapat dibatalkan.
          </p>
          {beritaToDelete && (
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <p className="text-xs font-bold text-[#111827] mb-1">
                {beritaToDelete.judul}
              </p>
              <p className="text-xs text-[#6B7280] line-clamp-2">
                {beritaToDelete.isi}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleteLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteBerita}
              isLoading={isDeleteLoading}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
