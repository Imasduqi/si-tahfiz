'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton, SkeletonCard, SkeletonTable } from '@/components/ui/loading-skeleton'
import { formatDate } from '@/lib/utils'
import { Landmark, Users, ClipboardCheck, Megaphone, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullIndicator } from '@/components/ui/pull-indicator'

interface HalaqahWithDetails {
  id: string
  nama_halaqah: string
  grade: string
  profiles: {
    nama_lengkap: string
  } | null
  santri: {
    count: number
  }[] | { count: number } | null
}

export default function KoordinatorBerandaPage() {
  const supabase = createClient()
  const { user: currentUser, profile, isLoading: userLoading } = useUser()

  const [totalHalaqah, setTotalHalaqah] = useState<number>(0)
  const [totalSantri, setTotalSantri] = useState<number>(0)
  const [ukjPendingCount, setUkjPendingCount] = useState<number>(0)
  const [syahrulAktif, setSyahrulAktif] = useState<{ tanggal_mulai: string; tanggal_selesai: string } | null>(null)
  const [pekanAktif, setPekanAktif] = useState<{ tanggal_mulai: string; tanggal_selesai: string } | null>(null)
  const [halaqahList, setHalaqahList] = useState<HalaqahWithDetails[]>([])

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setIsDataLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch all in parallel
      const [
        halaqahCountRes,
        santriCountRes,
        ukjPendingRes,
        syahrulRes,
        pekanRes,
        halaqahListRes
      ] = await Promise.all([
        supabase.from('halaqah').select('*', { count: 'exact', head: true }),
        supabase.from('santri').select('*', { count: 'exact', head: true }),
        supabase.from('ukj').select('*', { count: 'exact', head: true }).eq('status_approval', 'pending'),
        supabase.from('syahrul_quran').select('tanggal_mulai, tanggal_selesai').lte('tanggal_mulai', today).gte('tanggal_selesai', today).maybeSingle(),
        supabase.from('pekan_murajaah').select('tanggal_mulai, tanggal_selesai').lte('tanggal_mulai', today).gte('tanggal_selesai', today).maybeSingle(),
        supabase.from('halaqah').select('id, nama_halaqah, grade, profiles(nama_lengkap), santri(count)').order('nama_halaqah')
      ])

      if (halaqahCountRes.error) throw halaqahCountRes.error
      if (santriCountRes.error) throw santriCountRes.error
      if (ukjPendingRes.error) throw ukjPendingRes.error
      if (syahrulRes.error) throw syahrulRes.error
      if (pekanRes.error) throw pekanRes.error
      if (halaqahListRes.error) throw halaqahListRes.error

      setTotalHalaqah(halaqahCountRes.count || 0)
      setTotalSantri(santriCountRes.count || 0)
      setUkjPendingCount(ukjPendingRes.count || 0)
      setSyahrulAktif(syahrulRes.data)
      setPekanAktif(pekanRes.data)
      setHalaqahList((halaqahListRes.data as unknown as HalaqahWithDetails[]) || [])

    } catch (err) {
      console.error('Error fetching koordinator dashboard data:', err)
      toast.error('Gagal memuat data beranda')
    } finally {
      setIsDataLoading(false)
    }
  }, [currentUser, supabase])

  useEffect(() => {
    if (!userLoading && currentUser) {
      fetchData()
    }
  }, [currentUser, userLoading, fetchData])

  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await fetchData()
    }
  })

  if (userLoading || isDataLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton className="h-12 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    )
  }

  // Determine Ukj card style based on count
  const ukjCardStyles = ukjPendingCount > 0
    ? 'border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:shadow-md'
    : 'hover:border-emerald-500 hover:shadow-md'

  const ukjIconBgStyles = ukjPendingCount > 0
    ? 'bg-amber-100 text-amber-800'
    : 'bg-purple-50 text-purple-600'

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <PullIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

      {/* Greeting Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-none p-6 md:p-8 text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Selamat datang, {profile?.nama_lengkap || 'Koordinator'}
          </h1>
          <p className="text-blue-100 mt-2 font-medium">
            Monitor perkembangan dan kelancaran program tahfiz secara keseluruhan.
          </p>
        </div>
      </Card>

      {/* Active Period Status Banners */}
      {(syahrulAktif || pekanAktif) && (
        <div className="space-y-4">
          {syahrulAktif && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-850 rounded-lg shadow-sm">
              <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce" />
              <div className="text-sm font-medium">
                Syahrul Quran sedang berlangsung ({formatDate(syahrulAktif.tanggal_mulai)} - {formatDate(syahrulAktif.tanggal_selesai)})
              </div>
            </div>
          )}
          {pekanAktif && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 text-blue-850 rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm font-medium">
                Pekan Murajaah sedang berlangsung ({formatDate(pekanAktif.tanggal_mulai)} - {formatDate(pekanAktif.tanggal_selesai)})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5 p-6 shadow-sm rounded-lg">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Halaqah</div>
            <div className="text-3xl font-bold text-gray-900 mt-0.5">{totalHalaqah}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-5 p-6 shadow-sm rounded-lg">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Santri</div>
            <div className="text-3xl font-bold text-gray-900 mt-0.5">{totalSantri}</div>
          </div>
        </Card>

        <Link href="/koordinator/ukj" className="block group">
          <Card className={`flex items-center gap-5 p-6 shadow-sm rounded-lg transition-all duration-300 ${ukjCardStyles}`}>
            <div className={`p-4 rounded-lg transition-colors ${ukjIconBgStyles}`}>
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 group-hover:text-gray-700">UKJ Menunggu Persetujuan</div>
              <div className="text-3xl font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                {ukjPendingCount}
                {ukjPendingCount > 0 && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>
      </div>

      {/* Halaqah Table Section */}
      <Card className="shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Daftar Halaqah</h2>
          <Badge variant="success" className="py-1 px-3">
            {totalHalaqah} Halaqah Aktif
          </Badge>
        </div>

        {halaqahList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada data halaqah terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Halaqah
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pengampu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Jumlah Santri
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {halaqahList.map((halaqah) => {
                  // Safely handle santri count aggregate
                  const santriCount = Array.isArray(halaqah.santri)
                    ? (halaqah.santri[0]?.count ?? 0)
                    : ((halaqah.santri as { count: number } | null)?.count ?? 0)

                  // Safely handle profiles aggregate
                  const pengampuNama = Array.isArray(halaqah.profiles)
                    ? (halaqah.profiles[0]?.nama_lengkap ?? '-')
                    : (halaqah.profiles?.nama_lengkap ?? '-')

                  return (
                    <tr key={halaqah.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {halaqah.nama_halaqah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="info" className="py-0.5 px-2">
                          {halaqah.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pengampuNama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {santriCount} Santri
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
