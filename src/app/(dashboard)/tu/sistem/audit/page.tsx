'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableColumn } from '@/components/ui/table'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'

interface MergedAuditTrail {
  id: string
  user_id: string
  aktivitas: string
  created_at: string
  profiles: {
    nama_lengkap: string | null
  } | null
}

export default function TuSistemAuditPage() {
  const supabase = createClient()

  // State
  const [auditLogs, setAuditLogs] = useState<MergedAuditTrail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  // Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch audit trail
  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*, profiles(nama_lengkap)')
        .order('created_at', { ascending: false })

      if (error) throw error
      // Cast the data to match our MergedAuditTrail interface
      setAuditLogs((data as unknown as MergedAuditTrail[]) || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengambil data audit trail: ' + msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle deletion of records older than 3 months
  const handleCleanOldLogs = async () => {
    setIsDeleting(true)
    try {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { count, error } = await supabase
        .from('audit_trail')
        .delete({ count: 'exact' })
        .lt('created_at', threeMonthsAgo.toISOString())

      if (error) throw error

      if (count === 0) {
        toast.success('Tidak ada data lama yang perlu dihapus')
      } else {
        toast.success(`${count} data audit trail lama berhasil dihapus`)
        // Refresh logs list
        fetchAuditLogs()
      }
      setIsConfirmDeleteOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus data lama: ' + msg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date and time for Waktu column
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return `${date} ${time}`
  }

  // Filter logs client-side
  const filteredLogs = auditLogs.filter((log) => {
    // Search query matches aktivitas or user name
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const activityMatches = log.aktivitas?.toLowerCase().includes(query)
      const name = log.profiles?.nama_lengkap || 'Pengguna'
      const nameMatches = name.toLowerCase().includes(query)
      if (!activityMatches && !nameMatches) return false
    }

    const logDate = new Date(log.created_at)

    // Filter by start date (00:00:00)
    if (filterFrom) {
      const fromDate = new Date(filterFrom)
      fromDate.setHours(0, 0, 0, 0)
      if (logDate < fromDate) return false
    }

    // Filter by end date (23:59:59)
    if (filterTo) {
      const toDate = new Date(filterTo)
      toDate.setHours(23, 59, 59, 999)
      if (logDate > toDate) return false
    }

    return true
  })

  // Table Columns
  const columns: TableColumn<MergedAuditTrail>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, index) => index + 1,
    },
    {
      key: 'created_at',
      header: 'Waktu',
      render: (item: MergedAuditTrail) => formatDateTime(item.created_at),
    },
    {
      key: 'user',
      header: 'Nama Pengguna',
      render: (item: MergedAuditTrail) => item.profiles?.nama_lengkap || 'Pengguna',
    },
    {
      key: 'aktivitas',
      header: 'Aktivitas',
      render: (item: MergedAuditTrail) => (
        <span className="whitespace-normal break-all leading-normal">
          {item.aktivitas}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Audit Trail</h1>
          <p className="text-xs text-[#6B7280]">
            Lihat riwayat aktivitas kritis sistem dan bersihkan data lama.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="danger"
            onClick={() => setIsConfirmDeleteOpen(true)}
            disabled={isLoading}
          >
            Hapus Data Lama
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-4 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            label="Cari Aktivitas"
            placeholder="Cari kata kunci aktivitas atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Input
            type="date"
            label="Dari Tanggal"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            label="Sampai Tanggal"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
      </Card>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <LoadingSkeleton className="h-8 w-1/4" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredLogs}
            empty="Tidak ada data audit trail yang sesuai dengan filter"
          />
        )}
      </div>

      {/* Clean Old Data Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Hapus Data Audit Trail Lama"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151] leading-relaxed">
            Data audit trail lebih dari 3 bulan akan dihapus permanen. Lanjutkan?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleCleanOldLogs}
              isLoading={isDeleting}
            >
              Ya, Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
