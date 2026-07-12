'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Landmark, Award, TrendingUp, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'

interface ChartDataPoint {
  date: string
  total: number
}

interface HalaqahSantriCount {
  nama_halaqah: string
  jumlah_santri: number
}

export default function KepsekDashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [totalSantri, setTotalSantri] = useState<number>(0)
  const [totalHalaqah, setTotalHalaqah] = useState<number>(0)
  
  const [gradeDistribution, setGradeDistribution] = useState<Record<string, number>>({
    tahsin: 0,
    takmil: 0,
    tahfiz: 0,
  })

  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [halaqahSantriCounts, setHalaqahSantriCounts] = useState<HalaqahSantriCount[]>([])

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!currentUser) return
      setIsDataLoading(true)
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

        // Fetch in parallel
        const [
          santriCountRes,
          halaqahGradeRes,
          setoranTrendRes,
          halaqahListRes
        ] = await Promise.all([
          supabase.from('santri').select('*', { count: 'exact', head: true }),
          supabase.from('halaqah').select('grade'),
          supabase.from('setoran').select('tanggal, jumlah_baris').gte('tanggal', dateStr),
          supabase.from('halaqah').select('id, nama_halaqah, santri(count)').order('nama_halaqah')
        ])

        if (!active) return

        if (santriCountRes.error) throw santriCountRes.error
        if (halaqahGradeRes.error) throw halaqahGradeRes.error
        if (setoranTrendRes.error) throw setoranTrendRes.error
        if (halaqahListRes.error) throw halaqahListRes.error

        // 1. Santri count
        setTotalSantri(santriCountRes.count || 0)

        // 2. Halaqah count
        setTotalHalaqah(halaqahGradeRes.data?.length || 0)

        // 3. Grade distribution
        const grades = (halaqahGradeRes.data || []) as { grade: string }[]
        const dist = grades.reduce((acc, h) => {
          const g = h.grade?.toLowerCase()
          if (g) {
            acc[g] = (acc[g] ?? 0) + 1
          }
          return acc
        }, {} as Record<string, number>)
        setGradeDistribution({
          tahsin: dist.tahsin ?? 0,
          takmil: dist.takmil ?? 0,
          tahfiz: dist.tahfiz ?? 0,
        })

        // 4. Setoran trend last 30 days
        const setoranTrend = (setoranTrendRes.data || []) as { tanggal: string; jumlah_baris: number }[]
        const trendByDate = setoranTrend.reduce((acc, s) => {
          acc[s.tanggal] = (acc[s.tanggal] ?? 0) + s.jumlah_baris
          return acc
        }, {} as Record<string, number>)

        const formattedChartData = Object.entries(trendByDate).map(([date, total]) => ({
          date,
          total: total as number,
        }))
        // Sort chronologically
        formattedChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setChartData(formattedChartData)

        // 5. Santri count per halaqah
        interface HalaqahDataForChart {
          nama_halaqah: string
          santri: { count: number }[] | { count: number } | null
        }
        const counts = ((halaqahListRes.data || []) as unknown as HalaqahDataForChart[]).map((h) => {
          const count = Array.isArray(h.santri)
            ? (h.santri[0]?.count ?? 0)
            : (h.santri?.count ?? 0)
          return {
            nama_halaqah: h.nama_halaqah,
            jumlah_santri: count,
          }
        })
        setHalaqahSantriCounts(counts)

      } catch (err) {
        console.error('Error fetching Kepsek stats:', err)
        toast.error('Gagal memuat data statistik')
      } finally {
        if (active) {
          setIsDataLoading(false)
        }
      }
    }

    if (!userLoading && currentUser) {
      loadData()
    }

    return () => {
      active = false
    }
  }, [currentUser, userLoading, supabase])

  if (userLoading || isDataLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton className="h-10 w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-[250px] w-full" />
          </Card>
          <Card className="p-6 space-y-4">
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-[250px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Statistik
          </h1>
          <p className="text-gray-500 mt-1">
            Ringkasan data perkembangan hafalan dan distribusi santri program tahfiz.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5 p-6 shadow-sm rounded-lg">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Santri</div>
            <div className="text-3xl font-bold text-gray-900 mt-0.5">{totalSantri}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-5 p-6 shadow-sm rounded-lg">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Halaqah</div>
            <div className="text-3xl font-bold text-gray-900 mt-0.5">{totalHalaqah}</div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-gray-500">Distribusi Grade</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-500 font-semibold">Tahsin</div>
              <div className="text-lg font-bold text-gray-900">{gradeDistribution.tahsin}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-500 font-semibold">Takmil</div>
              <div className="text-lg font-bold text-gray-900">{gradeDistribution.takmil}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-500 font-semibold">Tahfiz</div>
              <div className="text-lg font-bold text-gray-900">{gradeDistribution.tahfiz}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="p-6 shadow-sm rounded-lg flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Perkembangan Setoran (30 Hari Terakhir)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {isMounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tickFormatter={(str) => {
                    const parts = str.split('-')
                    return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : str
                  }} stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Baris', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                  <Tooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                  <Line type="monotone" dataKey="total" name="Total Baris" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="Belum ada data setoran"
                  description="Tidak ada data setoran yang tercatat dalam 30 hari terakhir."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6 shadow-sm rounded-lg flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Jumlah Santri per Halaqah</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {isMounted && halaqahSantriCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={halaqahSantriCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="nama_halaqah" stroke="#9CA3AF" fontSize={11} interval={0} tickFormatter={(str) => str.length > 10 ? `${str.substring(0, 10)}...` : str} />
                  <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Santri', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Bar dataKey="jumlah_santri" name="Santri" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="Belum ada data halaqah"
                  description="Tidak ada data halaqah yang tersedia untuk ditampilkan."
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
