'use client'

import React from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { RoleStyleProvider } from '@/components/shared/role-context'
import { Users, Database, Settings, Shield } from 'lucide-react'

export default function TuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: 'Akun', href: '/tu/akun', icon: Users },
    { label: 'Data', href: '/tu/data/santri', icon: Database },
    { label: 'Konfigurasi', href: '/tu/konfigurasi', icon: Settings },
    { label: 'Sistem', href: '/tu/sistem/audit', icon: Shield },
  ]

  return (
    <RoleStyleProvider role="tu">
      <DashboardShell navItems={navItems} role="tu">
        {children}
      </DashboardShell>
    </RoleStyleProvider>
  )
}
