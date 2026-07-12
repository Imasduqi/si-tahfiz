import React from 'react'
import Link from 'next/link'
import { UserCircle } from 'lucide-react'

import { ROLE_HOME_PATHS } from '@/lib/constants'

export interface TopbarProps {
  role: 'tu' | 'koordinator' | 'pengampu' | 'orang_tua' | 'kepsek'
}

export function Topbar({ role }: TopbarProps) {
  const basePath = role === 'orang_tua' ? 'ortu' : role;

  return (
    <header
      className="sticky top-0 z-40 w-full h-[56px] md:h-[64px] px-4 md:px-6 flex items-center justify-between"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E0EDE0',
        boxShadow: '0 2px 12px rgba(34, 139, 34, 0.07)',
      }}
    >
      {/* Logo + Brand */}
      <Link href={ROLE_HOME_PATHS[role] ?? '/login'} className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border transition-transform group-hover:scale-105 duration-300"
          style={{ background: '#228B22', borderColor: '#1A6B1A', padding: '4px' }}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-tight select-none transition-colors" style={{ color: '#1C3B1C' }}>
            SI-<span style={{ color: '#228B22' }}>Tahfiz</span>
          </span>
        </div>
      </Link>

      {/* Profile Link */}
      <Link
        href={`/${basePath}/profil`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 group hover:bg-[#228B22] hover:text-[#FFFFFF]"
        style={{ background: '#F0F7F0', borderColor: '#C8DFC8', color: '#4A6B4A' }}
        aria-label="Profil"
      >
        <UserCircle className="w-5 h-5" />
        <span className="text-xs font-semibold hidden sm:block">Profil</span>
      </Link>
    </header>
  )
}
