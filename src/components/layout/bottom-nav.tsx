'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface BottomNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface BottomNavProps {
  items: BottomNavItem[]
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname()
  const displayItems = items.slice(0, 4)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[64px] flex justify-around items-center px-2 bottom-nav-safe"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E0EDE0',
        boxShadow: '0 -4px 20px rgba(34, 139, 34, 0.08)',
      }}
    >
      {displayItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative group"
            )}
          >
            {/* Active indicator */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full" style={{ background: '#228B22' }} />
            )}
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-200",
              isActive ? "scale-110" : "group-hover:scale-110"
            )}
            style={{ background: isActive ? '#F0F7F0' : 'transparent' }}>
              <Icon className="w-5 h-5" style={{ color: isActive ? '#228B22' : '#9BB09B' }} />
            </div>
            <span className="text-[10px] tracking-tight font-semibold mt-0.5"
              style={{ color: isActive ? '#228B22' : '#9BB09B' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
