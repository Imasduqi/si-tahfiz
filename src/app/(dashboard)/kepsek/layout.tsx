'use client'

import React from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { RoleStyleProvider } from '@/components/shared/role-context'
import { LayoutDashboard, FileSpreadsheet } from 'lucide-react'

export default function KepsekLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: 'Dashboard', href: '/kepsek/dashboard', icon: LayoutDashboard },
    { label: 'Rekap', href: '/kepsek/rekap', icon: FileSpreadsheet },
  ]

  return (
    <RoleStyleProvider role="kepsek">
      <DashboardShell navItems={navItems} role="kepsek">
        {children}
      </DashboardShell>
    </RoleStyleProvider>
  )
}
