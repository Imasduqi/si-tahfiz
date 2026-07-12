'use client'

import React, { useEffect, useState , useMemo} from 'react'
import { Topbar } from './topbar'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'
import { LucideIcon } from 'lucide-react'
import { usePushSubscription } from '@/hooks/use-push-subscription'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface DashboardShellProps {
  navItems: NavItem[]
  role: 'tu' | 'koordinator' | 'pengampu' | 'orang_tua' | 'kepsek'
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

  usePushSubscription(role)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handleUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return
      if (registration.waiting) setShowUpdateBanner(true)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) setShowUpdateBanner(true)
        })
      })
    }
    handleUpdate()
  }, [])

  const handleReload = () => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration?.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    })
  }

  const supabase = useMemo(() => createClient(), [])
  const handleToggleSidebar = () => setIsCollapsed(prev => !prev)

  useEffect(() => {
    async function checkAnnouncements() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: readRows, error: readError } = await supabase.from('pengumuman_read').select('pengumuman_id').eq('user_id', user.id)
        if (readError) throw readError
        const readIds = readRows?.map(r => r.pengumuman_id) || []
        const targetRole = role
        const { data: allRows, error: queryError } = await supabase.from('pengumuman').select('id, judul, isi').contains('target_role', [targetRole])
        if (queryError) throw queryError
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

  const handleCloseAnnouncement = async () => {
    if (!currentAnnouncement) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('pengumuman_read').insert({ pengumuman_id: currentAnnouncement.id, user_id: user.id })
      }
    } catch (err) {
      console.error('Failed to mark announcement as read:', err)
    }
    const remaining = unreadAnnouncements.slice(1)
    setUnreadAnnouncements(remaining)
    if (remaining.length > 0) setCurrentAnnouncement(remaining[0])
    else setCurrentAnnouncement(null)
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#FFFFF0' }}
    >
      {/* Subtle ivory dot pattern */}
      <div className="fixed inset-0 bg-hex-light opacity-60 pointer-events-none z-0" />

      {/* Update Banner */}
      {showUpdateBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] text-white text-sm text-center py-2.5 px-4 flex items-center justify-between shadow-md animate-fade-in-down"
          style={{ background: '#228B22' }}
        >
          <span className="text-sm font-medium">✨ Versi baru aplikasi telah tersedia</span>
          <button
            onClick={handleReload}
            className="ml-4 text-xs font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-all shadow-sm active:scale-95"
            style={{ background: '#FFFFF0', color: '#228B22' }}
          >
            Muat Ulang Sekarang
          </button>
        </div>
      )}

      {/* Topbar */}
      <div className="relative z-20">
        <Topbar role={role} />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar items={navItems} isCollapsed={isCollapsed} onToggle={handleToggleSidebar} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-56px)] md:max-h-[calc(100vh-64px)] relative">
          <div className="relative z-10 p-4 md:p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <BottomNav items={navItems} />

      {/* Announcement Modal */}
      <Modal
        isOpen={currentAnnouncement !== null}
        onClose={handleCloseAnnouncement}
        title={currentAnnouncement?.judul}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#4A6B4A' }}>
            {currentAnnouncement?.isi}
          </p>
        </div>
      </Modal>
    </div>
  )
}
