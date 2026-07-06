'use client'

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
        "hidden md:flex flex-col h-[calc(100vh-64px)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none relative z-10",
        isCollapsed ? "w-[68px]" : "w-[232px]"
      )}
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #E0EDE0',
        boxShadow: '3px 0 16px rgba(34, 139, 34, 0.05)',
      }}
    >
      {/* Nav items */}
      <div className="flex-1 py-5 space-y-1 overflow-y-auto px-3 scrollbar-hide">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden animate-fade-in-up",
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                color: isActive ? '#FFFFFF' : '#4A6B4A',
                background: isActive
                  ? '#228B22'
                  : 'transparent',
                boxShadow: isActive ? '0 4px 16px rgba(34,139,34,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#F0F7F0'
                  ;(e.currentTarget as HTMLElement).style.color = '#228B22'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#4A6B4A'
                }
              }}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-all duration-200",
              )} />

              {!isCollapsed && (
                <span className="truncate z-10">{item.label}</span>
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <span
                  className="absolute left-14 text-sm px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg translate-x-2 group-hover:translate-x-0 font-semibold"
                  style={{
                    background: '#228B22',
                    color: '#FFFFFF',
                    border: '1px solid #1A6B1A',
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Toggle button */}
      <div className="p-3" style={{ borderTop: '1px solid #E0EDE0' }}>
        <button
          onClick={onToggle}
          className="flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 w-full group"
          style={{ color: '#6B8B6B' }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0F7F0'; (e.currentTarget as HTMLElement).style.color = '#228B22' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B8B6B' }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-xs font-bold tracking-wide uppercase">Sembunyikan</span>
              <ChevronLeft className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
