'use client'

import React from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { RoleStyleProvider } from '@/components/shared/role-context'
import { Home, BookOpen, CalendarCheck, Grid } from 'lucide-react'

export default function PengampuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: 'Beranda', href: '/pengampu/beranda', icon: Home },
    { label: 'Setoran', href: '/pengampu/setoran', icon: BookOpen },
    { label: 'Absensi', href: '/pengampu/absensi', icon: CalendarCheck },
    { label: 'Lainnya', href: '/pengampu/lainnya', icon: Grid },
  ]

  return (
    <RoleStyleProvider role="pengampu">
      <DashboardShell navItems={navItems} role="pengampu">
        {children}
      </DashboardShell>
    </RoleStyleProvider>
  )
}
