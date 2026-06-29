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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] h-[64px] flex justify-around items-center px-2">
      {displayItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full text-[#6B7280] transition-colors",
              isActive && "text-[#10B981] font-semibold"
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
