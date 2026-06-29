import React from 'react'
import Link from 'next/link'
import { UserCircle } from 'lucide-react'

export interface TopbarProps {
  role: 'tu' | 'koordinator' | 'pengampu' | 'ortu' | 'kepsek'
}

export function Topbar({ role }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB] h-[56px] md:h-[64px] px-4 md:px-6 flex items-center justify-between">
      <Link href={`/${role}/beranda`} className="flex items-center space-x-2">
        <span className="text-[#10B981] font-bold text-lg md:text-xl tracking-tight select-none">
          SI-Tahfiz
        </span>
      </Link>
      <div className="flex items-center space-x-4">
        <Link
          href={`/${role}/profil`}
          className="text-[#6B7280] hover:text-[#10B981] transition-colors p-1.5 rounded-full hover:bg-[#F9FAFB]"
          aria-label="Profil"
        >
          <UserCircle className="w-6 h-6 md:w-7 h-7" />
        </Link>
      </div>
    </header>
  )
}
