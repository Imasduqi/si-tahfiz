'use client'

import React, { useEffect, useState , useMemo} from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Award, FileText, Heart, MessageCircle } from 'lucide-react'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function PengampuLainnyaPage() {
  const [isAkhlaqActive, setIsAkhlaqActive] = useState<boolean | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('konfigurasi')
          .select('fitur_akhlaq_aktif')
          .single()

        if (error) throw error
        setIsAkhlaqActive(!!data?.fitur_akhlaq_aktif)
      } catch (err) {
        console.error('Failed to load configuration:', err)
        // Fallback to true in case of failure (fail-open/default active)
        setIsAkhlaqActive(true)
      }
    }
    fetchConfig()
  }, [supabase])


  const baseMenus = [
    { label: 'Tikrar & Manzil', href: '/pengampu/tikrar', icon: RefreshCw, desc: 'Lihat status Tikrar dan Manzil seluruh santri halaqah' },
    { label: 'UKJ', href: '/pengampu/ukj', icon: Award, desc: 'Input dan riwayat UKJ per santri' },
    { label: 'UAS', href: '/pengampu/uas', icon: FileText, desc: 'Input nilai UAS per juz per santri' },
  ]

  const akhlaqMenu = { label: 'Akhlaq', href: '/pengampu/akhlaq', icon: Heart, desc: 'Input nilai akhlaq per santri' }

  const pesanMenu = { label: 'Pesan', href: '/pengampu/pesan', icon: MessageCircle, desc: 'Komunikasi dengan orang tua per santri' }

  const menus = [...baseMenus]
  if (isAkhlaqActive) {
    menus.push(akhlaqMenu)
  }
  menus.push(pesanMenu)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">Menu Lainnya</h1>
        <p className="text-sm text-[#6B7280] mt-1">Akses cepat ke menu tambahan pengampu halaqah.</p>
      </div>

      {isAkhlaqActive === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="h-[180px] p-6 space-y-4">
            <LoadingSkeleton className="h-12 w-12" />
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-4 w-full" />
          </Card>
          <Card className="h-[180px] p-6 space-y-4">
            <LoadingSkeleton className="h-12 w-12" />
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-4 w-full" />
          </Card>
          <Card className="h-[180px] p-6 space-y-4">
            <LoadingSkeleton className="h-12 w-12" />
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-4 w-full" />
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {menus.map((menu) => {
            const Icon = menu.icon
            return (
              <Link key={menu.href} href={menu.href}>
                <Card className="hover:border-[#10B981] hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col p-6 group">
                  <div className="w-12 h-12 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center mb-4 group-hover:bg-[#10B981] group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#111827] mb-2">{menu.label}</h3>
                  <p className="text-sm text-[#6B7280] flex-1 leading-relaxed">{menu.desc}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
