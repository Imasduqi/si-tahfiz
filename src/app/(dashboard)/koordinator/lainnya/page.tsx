'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Bell, FileSpreadsheet, MessageCircle, Users } from 'lucide-react'

export default function KoordinatorLainnyaPage() {
  const menus = [
    { label: 'Pengumuman', href: '/koordinator/pengumuman', icon: Bell, desc: 'Buat dan kelola pengumuman per role' },
    { label: 'Rekap Excel', href: '/koordinator/rekap', icon: FileSpreadsheet, desc: 'Unduh rekap nilai santri format Excel' },
    { label: 'Pesan', href: '/koordinator/pesan', icon: MessageCircle, desc: 'Komunikasi dengan orang tua wali' },
    { label: 'Detail Halaqah', href: '/koordinator/halaqah', icon: Users, desc: 'Lihat status dan anggota halaqah' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">Menu Lainnya</h1>
        <p className="text-sm text-[#6B7280] mt-1">Akses cepat ke berbagai fitur pengelolaan tahfiz.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {menus.map((menu) => {
          const Icon = menu.icon
          return (
            <Link key={menu.href} href={menu.href}>
              <Card className="hover:border-[#10B981] hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col p-6 group">
                <div className="w-12 h-12 rounded-lg bg-[#D1FAE5] text-[#10B981] flex items-center justify-center mb-4 group-hover:bg-[#10B981] group-hover:text-white transition-colors duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#111827] mb-2">{menu.label}</h3>
                <p className="text-sm text-[#6B7280] flex-1 leading-relaxed">{menu.desc}</p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
