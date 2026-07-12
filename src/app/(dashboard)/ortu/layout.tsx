'use client'

import React from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { RoleStyleProvider } from '@/components/shared/role-context'
import { Home, BookMarked, RefreshCw, MessageCircle } from 'lucide-react'

export default function OrtuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: 'Beranda', href: '/ortu/beranda', icon: Home },
    { label: 'Manzil', href: '/ortu/manzil', icon: BookMarked },
    { label: 'Tikrar', href: '/ortu/tikrar', icon: RefreshCw },
    { label: 'Pesan', href: '/ortu/pesan', icon: MessageCircle },
  ]

  return (
    <RoleStyleProvider role="orang_tua">
      <DashboardShell navItems={navItems} role="orang_tua">
        {children}
      </DashboardShell>
    </RoleStyleProvider>
  )
}
