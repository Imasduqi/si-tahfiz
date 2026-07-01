'use client'

import React, { useEffect, useState } from 'react'
import { Topbar } from './topbar'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { usePushSubscription } from '@/hooks/use-push-subscription'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface DashboardShellProps {
  navItems: NavItem[]
  role: 'tu' | 'koordinator' | 'pengampu' | 'ortu' | 'kepsek'
  children: React.ReactNode
}

interface Announcement {
  id: string
  judul: string
  isi: string
}

export function DashboardShell({ navItems, role, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([])
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)

  usePushSubscription(role === 'ortu' ? 'orang_tua' : role)


  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return

      // Check if there's already a waiting worker
      if (registration.waiting) {
        setShowUpdateBanner(true)
      }

      // Listen for new waiting worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdateBanner(true)
          }
        })
      })
    }

    handleUpdate()
  }, [])

  const handleReload = () => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration?.waiting) {
        // Tell waiting worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      window.location.reload()
    })
  }
  
  const supabase = createClient()

  // Handle collapsible sidebar toggle
  const handleToggleSidebar = () => {
    setIsCollapsed((prev) => !prev)
  }

  // Check for unread announcements on mount
  useEffect(() => {
    async function checkAnnouncements() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Get read announcements for user
        const { data: readRows, error: readError } = await supabase
          .from('pengumuman_read')
          .select('pengumuman_id')
          .eq('user_id', user.id)

        if (readError) throw readError

        const readIds = readRows?.map(r => r.pengumuman_id) || []

        // Map 'ortu' role name to 'orang_tua' as stored in target_role
        const targetRole = role === 'ortu' ? 'orang_tua' : role

        // 2. Query announcements matching user role
        const { data: allRows, error: queryError } = await supabase
          .from('pengumuman')
          .select('id, judul, isi')
          .contains('target_role', [targetRole])

        if (queryError) throw queryError

        // 3. Filter out announcements that have already been read
        const toShow = (allRows ?? []).filter(p => !readIds.includes(p.id))

        if (toShow.length > 0) {
          setUnreadAnnouncements(toShow)
          setCurrentAnnouncement(toShow[0])
        }
      } catch (err) {
        console.error('Failed to check announcements:', err)
      }
    }

    checkAnnouncements()
  }, [role, supabase])

  // Handle close announcement modal
  const handleCloseAnnouncement = async () => {
    if (!currentAnnouncement) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Insert read log
        await supabase
          .from('pengumuman_read')
          .insert({
            pengumuman_id: currentAnnouncement.id,
            user_id: user.id
          })
      }
    } catch (err) {
      console.error('Failed to mark announcement as read:', err)
    }

    // Process next announcement or close
    const remaining = unreadAnnouncements.slice(1)
    setUnreadAnnouncements(remaining)
    if (remaining.length > 0) {
      setCurrentAnnouncement(remaining[0])
    } else {
      setCurrentAnnouncement(null)
    }
  }

  // Warm style rules for "ortu" role layout
  const isOrtu = role === 'ortu'

  return (
    <div className={cn("flex flex-col min-h-screen", isOrtu ? "bg-[#FFFDF5]" : "bg-white")}>
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white text-sm text-center py-2 px-4 flex items-center justify-between">
          <span className="text-sm">✨ Versi baru tersedia</span>
          <button
            onClick={handleReload}
            className="ml-4 bg-white text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full"
          >
            Muat Ulang
          </button>
        </div>
      )}
      <Topbar role={role} />
      <div className="flex flex-1">
        <Sidebar
          items={navItems}
          isCollapsed={isCollapsed}
          onToggle={handleToggleSidebar}
        />
        <main
          className={cn(
            "flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto max-h-[calc(100vh-56px)] md:max-h-[calc(100vh-64px)] transition-all",
            isOrtu ? "bg-[#FFFDF5] space-y-8 p-6 md:p-8" : "bg-white"
          )}
        >
          {children}
        </main>
      </div>
      <BottomNav items={navItems} />

      {/* Announcement Modal Popup */}
      <Modal
        isOpen={currentAnnouncement !== null}
        onClose={handleCloseAnnouncement}
        title={currentAnnouncement?.judul}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">
            {currentAnnouncement?.isi}
          </p>
        </div>
      </Modal>
    </div>
  )
}

