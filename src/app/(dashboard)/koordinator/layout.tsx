'use client'

import React from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { RoleStyleProvider } from '@/components/shared/role-context'
import { Home, ClipboardCheck, BookOpen, Grid } from 'lucide-react'

export default function KoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: 'Beranda', href: '/koordinator/beranda', icon: Home },
    { label: 'UKJ', href: '/koordinator/ukj', icon: ClipboardCheck },
    { label: 'Kelola', href: '/koordinator/kelola/syahrul-quran', icon: BookOpen },
    { label: 'Lainnya', href: '/koordinator/lainnya', icon: Grid },
  ]

  return (
    <RoleStyleProvider role="koordinator">
      <DashboardShell navItems={navItems} role="koordinator">
        {children}
      </DashboardShell>
    </RoleStyleProvider>
  )
}
