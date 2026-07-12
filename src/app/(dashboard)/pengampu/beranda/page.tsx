'use client'

import React, { useEffect, useState, useCallback , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { getTodayString } from '@/lib/utils'
import { Users, BookOpen, RefreshCw, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullIndicator } from '@/components/ui/pull-indicator'

export default function PengampuBerandaPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, profile, isLoading: userLoading } = useUser()

  const [halaqah, setHalaqah] = useState<{ id: string; nama_halaqah: string; grade: string } | null>(null)
  const [totalSantri, setTotalSantri] = useState<number>(0)
  const [setoranHariIniCount, setSetoranHariIniCount] = useState<number>(0)
  const [tikrarAktifCount, setTikrarAktifCount] = useState<number>(0)
  const [ukjPendingCount, setUkjPendingCount] = useState<number>(0)
  const [notSubmittedSantri, setNotSubmittedSantri] = useState<{ id: string; nama_lengkap: string }[]>([])
  
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)
  const [hasHalaqah, setHasHalaqah] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setIsDataLoading(true)
    try {
      // 1. Fetch halaqah
      const { data: halaqahData, error: halaqahError } = await supabase
        .from('halaqah')
        .select('id, nama_halaqah, grade')
        .eq('pengampu_id', currentUser.id)
        .maybeSingle()

      if (halaqahError) throw halaqahError

      if (!halaqahData) {
        setHasHalaqah(false)
        setIsDataLoading(false)
        return
      }

      setHalaqah(halaqahData)
      setHasHalaqah(true)

      // 2. Fetch santri list in halaqah
      const { data: santriList, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap')
        .eq('halaqah_id', halaqahData.id)

      if (santriError) throw santriError

      const santriCount = santriList?.length || 0
      setTotalSantri(santriCount)

      const santriIds = (santriList || []).map((s) => s.id)

      // Fetch UKJ pending, setoran hari ini, and tikrar aktif in parallel
      const today = getTodayString()

      let ukjPendingCountVal = 0
      let setoranData: { santri_id: string; tipe: string }[] = []
      let tikrarVal = 0

      if (santriIds.length > 0) {
        const [ukjRes, setoranRes, tikrarRes] = await Promise.all([
          supabase
            .from('ukj')
            .select('id', { count: 'exact', head: true })
            .eq('pengampu_id', currentUser.id)
            .eq('status_approval', 'pending'),
          supabase
            .from('setoran')
            .select('santri_id, tipe')
            .eq('tanggal', today)
            .in('santri_id', santriIds),
          supabase
            .from('tikrar')
            .select('id', { count: 'exact', head: true })
            .in('santri_id', santriIds)
            .neq('status', 'selesai_rumah')
        ])

        if (ukjRes.error) throw ukjRes.error
        if (setoranRes.error) throw setoranRes.error
        if (tikrarRes.error) throw tikrarRes.error

        ukjPendingCountVal = ukjRes.count || 0
        setoranData = (setoranRes.data || []) as { santri_id: string; tipe: string }[]
        tikrarVal = tikrarRes.count || 0
      } else {
        const { count, error } = await supabase
          .from('ukj')
          .select('id', { count: 'exact', head: true })
          .eq('pengampu_id', currentUser.id)
          .eq('status_approval', 'pending')

        if (error) throw error
        ukjPendingCountVal = count || 0
      }

      setUkjPendingCount(ukjPendingCountVal)
      setTikrarAktifCount(tikrarVal)

      // Count distinct santri who have submitted Sabak today
      const submittedSabakSantriIds = new Set(
        setoranData
          .filter((s) => s.tipe === 'sabak')
          .map((s) => s.santri_id)
      )
      setSetoranHariIniCount(submittedSabakSantriIds.size)

      // Find santri who have NOT submitted Sabak today
      const remainder = (santriList || []).filter(
        (s) => !submittedSabakSantriIds.has(s.id)
      )
      setNotSubmittedSantri(remainder)

    } catch (err) {
      console.error('Error fetching pengampu beranda data:', err)
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Card className="p-6 space-y-4">
          <LoadingSkeleton className="h-6 w-1/4" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    )
  }

  if (!hasHalaqah) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState
          title="Halaqah Belum Terdaftar"
          description="Anda belum terdaftar sebagai pengampu di halaqah mana pun. Silakan hubungi Koordinator."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PullIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

      {/* Greeting Card */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Selamat datang, {profile?.nama_lengkap || 'Pengampu'}
            </h1>
            <p className="text-emerald-100 mt-2 font-medium">
              Semoga hari Anda penuh berkah dan kemudahan dalam membimbing Al-Quran.
            </p>
          </div>
          {halaqah && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl self-start md:self-auto">
              <div>
                <div className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Halaqah</div>
                <div className="text-lg font-bold">{halaqah.nama_halaqah}</div>
              </div>
              <Badge variant="info" className="bg-white/20 text-white border-none py-1 px-3">
                {halaqah.grade}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="flex items-center gap-4 p-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Santri</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{totalSantri}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Setoran Sabaq Hari Ini</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {setoranHariIniCount} <span className="text-sm font-normal text-gray-500">dari {totalSantri}</span>
            </div>
          </div>
        </Card>

        <Link href="/pengampu/tikrar" className="block group">
          <Card className="flex items-center gap-4 p-6 hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 group-hover:text-gray-700">Tikrar Aktif</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">{tikrarAktifCount}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>

        <Link href="/pengampu/ukj" className="block group">
          <Card className="flex items-center gap-4 p-6 hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 group-hover:text-gray-700">UKJ Pending</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">{ukjPendingCount}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>
      </div>

      {/* Reminder Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Belum Setor Sabaq Hari Ini</h2>
        </div>
        {notSubmittedSantri.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <p className="text-emerald-800 font-medium">Alhamdulillah! Semua santri sudah menyetorkan Sabaq hari ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notSubmittedSantri.map((santri) => (
              <div key={santri.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-gray-800">{santri.nama_lengkap}</span>
                <Link
                  href="/pengampu/setoran"
                  className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Lihat Setoran
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
