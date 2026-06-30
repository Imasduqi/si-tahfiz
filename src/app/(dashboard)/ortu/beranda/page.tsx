'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton, SkeletonCard } from '@/components/ui/loading-skeleton'
import { formatDateWithDay } from '@/lib/utils'
import { BookOpen, RefreshCw, Calendar, ChevronRight, GraduationCap, MapPin } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Child {
  id: string
  nama_lengkap: string
  kelas: string
  grade: string
  halaqah: {
    nama_halaqah: string
  } | null
}

interface SetoranRecord {
  id: string
  tipe: 'sabak' | 'sabki' | 'manzil'
  jumlah_baris: number
  tanggal: string
}

export default function OrtuBerandaPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  const [anakList, setAnakList] = useState<Child[]>([])
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null)
  
  // Progress states
  const [totalSetoranBulanIni, setTotalSetoranBulanIni] = useState<number>(0)
  const [tikrarAktifCount, setTikrarAktifCount] = useState<number>(0)
  const [alphaCount, setAlphaCount] = useState<number>(0)
  const [recentSetoran, setRecentSetoran] = useState<SetoranRecord[]>([])

  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false)

  // Fetch children list
  useEffect(() => {
    let active = true

    async function fetchChildren() {
      if (!currentUser) return
      setIsPageLoading(true)
      try {
        const { data: children, error } = await supabase
          .from('santri')
          .select('id, nama_lengkap, kelas, grade, halaqah(nama_halaqah)')
          .eq('orang_tua_id', currentUser.id)
          .order('nama_lengkap')

        if (error) throw error

        if (active) {
          const list = (children as unknown as Child[]) || []
          setAnakList(list)
          if (list.length > 0) {
            setSelectedAnakId(list[0].id)
          } else {
            setIsPageLoading(false)
          }
        }
      } catch (err) {
        console.error('Error fetching children:', err)
        toast.error('Gagal memuat daftar anak')
        if (active) setIsPageLoading(false)
      }
    }

    if (!userLoading && currentUser) {
      fetchChildren()
    }

    return () => {
      active = false
    }
  }, [currentUser, userLoading, supabase])

  // Fetch active child details
  const fetchChildProgress = useCallback(async (childId: string) => {
    setIsDataFetching(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const [
        setoranRes,
        tikrarRes,
        alphaRes,
        recentSetoranRes
      ] = await Promise.all([
        supabase
          .from('setoran')
          .select('jumlah_baris')
          .eq('santri_id', childId)
          .gte('tanggal', startOfMonth)
          .lte('tanggal', today),
        supabase
          .from('tikrar')
          .select('id', { count: 'exact', head: true })
          .eq('santri_id', childId)
          .neq('status', 'selesai_rumah'),
        supabase
          .from('absensi')
          .select('*', { count: 'exact', head: true })
          .eq('santri_id', childId)
          .eq('status', 'alpha')
          .gte('tanggal', startOfMonth),
        supabase
          .from('setoran')
          .select('id, tipe, jumlah_baris, tanggal')
          .eq('santri_id', childId)
          .gte('tanggal', sevenDaysAgoStr)
          .order('tanggal', { ascending: false })
      ])

      if (setoranRes.error) throw setoranRes.error
      if (tikrarRes.error) throw tikrarRes.error
      if (alphaRes.error) throw alphaRes.error
      if (recentSetoranRes.error) throw recentSetoranRes.error

      // Total setoran
      const totalBaris = (setoranRes.data || []).reduce((sum, s) => sum + (s.jumlah_baris || 0), 0)
      setTotalSetoranBulanIni(totalBaris)

      // Tikrar count
      setTikrarAktifCount(tikrarRes.count || 0)

      // Alpha count
      setAlphaCount(alphaRes.count || 0)

      // Recent setoran
      setRecentSetoran((recentSetoranRes.data as SetoranRecord[]) || [])

    } catch (err) {
      console.error('Error fetching child progress:', err)
      toast.error('Gagal memuat rincian perkembangan anak')
    } finally {
      setIsPageLoading(false)
      setIsDataFetching(false)
    }
  }, [supabase])

  useEffect(() => {
    if (selectedAnakId) {
      fetchChildProgress(selectedAnakId)
    }
  }, [selectedAnakId, fetchChildProgress])

  if (userLoading || isPageLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <LoadingSkeleton className="h-10 w-1/3 rounded-full" />
        <Card className="p-6 space-y-4">
          <LoadingSkeleton className="h-6 w-1/4" />
          <div className="flex gap-4">
            <LoadingSkeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <LoadingSkeleton className="h-4 w-1/3" />
              <LoadingSkeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (anakList.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          title="Belum Ada Santri Terdaftar"
          description="Tidak ada data santri yang terhubung dengan akun Orang Tua Anda. Silakan hubungi TU atau Koordinator."
        />
      </div>
    )
  }

  const selectedChild = anakList.find((c) => c.id === selectedAnakId) || anakList[0]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Tab Switching for Multiple Children */}
      {anakList.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-150">
          {anakList.map((anak) => {
            const isSelected = anak.id === selectedAnakId
            return (
              <button
                key={anak.id}
                onClick={() => setSelectedAnakId(anak.id)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-650 hover:bg-gray-200'
                }`}
              >
                {anak.nama_lengkap}
              </button>
            )
          })}
        </div>
      )}

      {/* Child Information Card */}
      <Card className="p-6 border border-gray-100 shadow-md rounded-2xl relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-10 -translate-y-10 -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-inner">
              {selectedChild.nama_lengkap.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{selectedChild.nama_lengkap}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  Kelas {selectedChild.kelas}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedChild.halaqah?.nama_halaqah || 'Belum masuk halaqah'}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="info" className="self-start md:self-auto px-4 py-1.5 text-xs font-bold rounded-full">
            Grade: {selectedChild.grade}
          </Badge>
        </div>
      </Card>

      {/* Loading overlay for data fetch */}
      {isDataFetching ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex items-center gap-4 p-6 rounded-2xl shadow-md bg-white">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-500">Setoran Bulan Ini</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">
                  {totalSetoranBulanIni} <span className="text-xs font-medium text-gray-500">Baris</span>
                </div>
              </div>
            </Card>

            <Link href={tikrarAktifCount > 0 ? "/ortu/tikrar" : "#"} className={`block group ${tikrarAktifCount === 0 ? 'pointer-events-none' : ''}`}>
              <Card className="flex items-center justify-between p-6 rounded-2xl shadow-md bg-white hover:border-emerald-500 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-full group-hover:bg-amber-100 transition-colors">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500 group-hover:text-gray-700">Tikrar Aktif</div>
                    <div className="text-2xl font-extrabold text-gray-900 mt-1">{tikrarAktifCount}</div>
                  </div>
                </div>
                {tikrarAktifCount > 0 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                )}
              </Card>
            </Link>

            <Card className={`flex items-center gap-4 p-6 rounded-2xl shadow-md ${alphaCount > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white'}`}>
              <div className={`p-3 rounded-full ${alphaCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-50 text-gray-555'}`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-sm font-semibold ${alphaCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>Alpha Bulan Ini</div>
                <div className={`text-2xl font-extrabold mt-1 ${alphaCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {alphaCount} <span className="text-xs font-medium text-gray-500">Hari</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Setoran Section */}
          <Card className="p-6 rounded-2xl shadow-md bg-white">
            <h3 className="text-lg font-extrabold text-gray-950 mb-4">Setoran Terakhir (7 Hari Terakhir)</h3>
            {recentSetoran.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-medium">
                Belum ada riwayat setoran dalam 7 hari terakhir.
              </div>
            ) : (
              <div className="space-y-4">
                {recentSetoran.map((record) => {
                  let badgeVariant: 'success' | 'warning' | 'info' = 'success'
                  if (record.tipe === 'sabki') badgeVariant = 'info'
                  if (record.tipe === 'manzil') badgeVariant = 'warning'

                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">{formatDateWithDay(record.tanggal)}</div>
                        <div className="text-sm font-bold text-gray-800 mt-0.5">{record.jumlah_baris} Baris</div>
                      </div>
                      <Badge variant={badgeVariant} className="px-3 py-1 rounded-full text-[10px] font-bold">
                        {record.tipe}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
