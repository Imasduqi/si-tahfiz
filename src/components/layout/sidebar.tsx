import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export interface SidebarItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface SidebarProps {
  items: SidebarItem[]
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ items, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-white border-r border-[#E5E7EB] h-[calc(100vh-64px)] transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-[#D1FAE5] text-[#059669]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              )}
              {isCollapsed && (
                <span className="absolute left-14 bg-[#111827] text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t border-[#E5E7EB] flex justify-center">
        <button
          onClick={onToggle}
          className="flex items-center justify-center p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors w-full"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-xs text-[#6B7280] font-medium">Sembunyikan Menu</span>
              <ChevronLeft className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
