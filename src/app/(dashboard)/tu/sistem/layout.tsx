'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function TuSistemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Audit Trail', href: '/tu/sistem/audit' },
    { label: 'Berita Login', href: '/tu/sistem/berita' },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div className="border-b border-[#E5E7EB]">
        <nav className="flex space-x-6 -mb-px">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "py-2.5 px-1 border-b-2 font-medium text-[14px] transition-colors",
                  isActive
                    ? "border-[#10B981] text-[#10B981]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  )
}
