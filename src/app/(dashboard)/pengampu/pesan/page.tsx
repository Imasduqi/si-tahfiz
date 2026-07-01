'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { Send, ArrowLeft, MessageSquare, User, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SantriWithOrangTua {
  id: string
  nama_lengkap: string
  orang_tua_id: string
  orang_tua: {
    id: string
    nama_lengkap: string
  } | null
}

interface PercakapanWithDetails {
  id: string
  santri_id: string
  pengampu_id: string
  ortu_id: string
  created_at: string
  santri?: { nama_lengkap: string }
  orang_tua?: { nama_lengkap: string }
}

interface Message {
  id: string
  percakapan_id: string
  pengirim_id: string
  isi: string
  created_at: string
}

export default function PengampuPesanPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Data States
  const [santriList, setSantriList] = useState<SantriWithOrangTua[]>([])
  const [percakapanList, setPercakapanList] = useState<PercakapanWithDetails[]>([])
  const [latestMessages, setLatestMessages] = useState<Record<string, Message>>({})
  const [loading, setLoading] = useState(true)

  // Selection States
  const [selectedSantriId, setSelectedSantriId] = useState<string | null>(null)
  const [activePercakapan, setActivePercakapan] = useState<PercakapanWithDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Input State
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  // Read status mapping (percakapanId -> last read ISO date)
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({})

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load last read timestamps from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sitahfiz_chat_last_read')
      if (stored) {
        setLastReadMap(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to parse chat read status:', e)
    }
  }, [])

  // Update read status for a specific conversation
  const markAsRead = (percakapanId: string) => {
    const nowStr = new Date().toISOString()
    const updated = { ...lastReadMap, [percakapanId]: nowStr }
    setLastReadMap(updated)
    try {
      localStorage.setItem('sitahfiz_chat_last_read', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save chat read status:', e)
    }
  }

  // Fetch initial data
  useEffect(() => {
    if (!currentUser) return

    async function loadData() {
      try {
        setLoading(true)
        // 1. Get halaqah ID for the pengampu
        const { data: halaqahData, error: halaqahError } = await supabase
          .from('halaqah')
          .select('id')
          .eq('pengampu_id', currentUser?.id)
          .single()

        if (halaqahError) {
          // If pengampu doesn't have a halaqah, they cannot message anyone
          setSantriList([])
          setPercakapanList([])
          setLoading(false)
          return
        }

        const halaqahId = halaqahData.id

        // 2. Fetch all santri in this halaqah that have an orang_tua_id
        const { data: santris, error: santrisError } = await supabase
          .from('santri')
          .select('id, nama_lengkap, orang_tua_id, orang_tua:orang_tua_id(id, nama_lengkap)')
          .eq('halaqah_id', halaqahId)
          .not('orang_tua_id', 'is', null)

        if (santrisError) throw santrisError

        // Map and set santri list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedSantris = (santris || []).map((s: any) => ({
          id: s.id,
          nama_lengkap: s.nama_lengkap,
          orang_tua_id: s.orang_tua_id,
          orang_tua: s.orang_tua ? { id: s.orang_tua.id, nama_lengkap: s.orang_tua.nama_lengkap } : null
        }))
        setSantriList(formattedSantris)

        // 3. Fetch existing threads
        const { data: percakapans, error: percakapansError } = await supabase
          .from('percakapan')
          .select('*, santri(nama_lengkap), orang_tua:ortu_id(nama_lengkap)')
          .eq('pengampu_id', currentUser?.id)

        if (percakapansError) throw percakapansError
        setPercakapanList(percakapans || [])

        // 4. Fetch all latest messages for previews
        if (percakapans && percakapans.length > 0) {
          const threadIds = percakapans.map(p => p.id)
          const { data: allMsgs, error: msgsError } = await supabase
            .from('pesan')
            .select('*')
            .in('percakapan_id', threadIds)
            .order('created_at', { ascending: false })

          if (msgsError) throw msgsError

          // Group by thread and get the latest
          const latest: Record<string, Message> = {}
          allMsgs?.forEach((msg) => {
            if (!latest[msg.percakapan_id]) {
              latest[msg.percakapan_id] = msg
            }
          })
          setLatestMessages(latest)
        }
      } catch (err) {
        console.error('Failed to load chat data:', err)
        toast.error('Gagal memuat data obrolan')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser, supabase])

  // Select santri & open chat
  const handleSelectSantri = async (santri: SantriWithOrangTua) => {
    setSelectedSantriId(santri.id)
    setLoadingMessages(true)

    try {
      // Find existing percakapan
      let percakapan = percakapanList.find(p => p.santri_id === santri.id)

      if (!percakapan) {
        // Create new percakapan
        const { data: newPercakapan, error: insertError } = await supabase
          .from('percakapan')
          .insert({
            santri_id: santri.id,
            pengampu_id: currentUser!.id,
            ortu_id: santri.orang_tua_id
          })
          .select('*, santri(nama_lengkap), orang_tua:ortu_id(nama_lengkap)')
          .single()

        if (insertError) throw insertError

        percakapan = newPercakapan as PercakapanWithDetails
        setPercakapanList(prev => [...prev, newPercakapan])
      }

      setActivePercakapan(percakapan)
      markAsRead(percakapan.id)

      // Fetch message history
      const { data: msgHistory, error: historyError } = await supabase
        .from('pesan')
        .select('*')
        .eq('percakapan_id', percakapan.id)
        .order('created_at', { ascending: true })

      if (historyError) throw historyError
      setMessages(msgHistory || [])
    } catch (err) {
      console.error('Error opening conversation:', err)
      toast.error('Gagal membuka percakapan')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Realtime Subscription
  useEffect(() => {
    if (!activePercakapan) return

    const channel = supabase
      .channel(`percakapan-${activePercakapan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pesan',
          filter: `percakapan_id=eq.${activePercakapan.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicate additions
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Update preview
          setLatestMessages(prev => ({
            ...prev,
            [activePercakapan.id]: newMsg
          }))
          // Mark read if active
          markAsRead(activePercakapan.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePercakapan, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loadingMessages])

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!messageText.trim() || !activePercakapan || sending) return

    const trimmed = messageText.trim()
    setSending(true)

    try {
      const { error } = await supabase.from('pesan').insert({
        percakapan_id: activePercakapan.id,
        pengirim_id: currentUser!.id,
        isi: trimmed
      })

      if (error) throw error

      setMessageText('')
      markAsRead(activePercakapan.id)
    } catch (err) {
      console.error('Send message error:', err)
      toast.error('Pesan gagal terkirim, coba lagi')
    } finally {
      setSending(false)
    }
  }

  // Format date for message bubble
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }
  }

  // Filter santri based on search input
  const filteredSantri = santriList.filter(s =>
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.orang_tua?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (userLoading || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 w-1/3 animate-pulse rounded-md" />
        <div className="h-12 bg-gray-200 w-full animate-pulse rounded-md" />
        <div className="h-12 bg-gray-200 w-full animate-pulse rounded-md" />
        <div className="h-12 bg-gray-200 w-full animate-pulse rounded-md" />
      </div>
    )
  }

  if (santriList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          title="Tidak ada Santri"
          description="Halaqah Anda belum memiliki santri yang terhubung dengan akun Orang Tua."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] md:h-[calc(100vh-64px)] min-h-[500px] rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* LEFT COLUMN: Santri / Thread List */}
      <div
        className={cn(
          "w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50",
          selectedSantriId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Daftar Wali Santri</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari santri atau wali..."
              className="pl-9 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredSantri.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Tidak ada hasil pencarian
            </div>
          ) : (
            filteredSantri.map((santri) => {
              const thread = percakapanList.find(p => p.santri_id === santri.id)
              const lastMsg = thread ? latestMessages[thread.id] : null
              const isSelected = selectedSantriId === santri.id

              // Determine unread status
              let isUnread = false
              if (thread && lastMsg && lastMsg.pengirim_id !== currentUser!.id) {
                const lastRead = lastReadMap[thread.id]
                if (!lastRead || new Date(lastMsg.created_at) > new Date(lastRead)) {
                  isUnread = true
                }
              }

              return (
                <button
                  key={santri.id}
                  onClick={() => handleSelectSantri(santri)}
                  className={cn(
                    "w-full text-left p-4 transition-colors flex items-start gap-3",
                    isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-500" : "bg-white hover:bg-gray-50/50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="font-semibold text-gray-900 truncate">
                        {santri.nama_lengkap}
                      </span>
                      {lastMsg && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 truncate mb-1">
                      Wali: {santri.orang_tua?.nama_lengkap || 'Belum diatur'}
                    </div>

                    {lastMsg ? (
                      <p className={cn(
                        "text-xs truncate",
                        isUnread ? "font-bold text-gray-800" : "text-gray-400"
                      )}>
                        {lastMsg.pengirim_id === currentUser!.id ? 'Anda: ' : ''}
                        {lastMsg.isi}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Mulai percakapan...</p>
                    )}
                  </div>

                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat view */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-gray-50",
          !selectedSantriId ? "hidden md:flex items-center justify-center p-8 text-center" : "flex"
        )}
      >
        {activePercakapan && selectedSantriId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center gap-3">
              <button
                onClick={() => setSelectedSantriId(null)}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-800 leading-tight">
                  {activePercakapan.santri?.nama_lengkap}
                </h3>
                <p className="text-xs text-gray-500">
                  Orang Tua: {activePercakapan.orang_tua?.nama_lengkap || '-'}
                </p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-4 space-y-4 bg-[#F8FAFC]">
              {loadingMessages ? (
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-gray-200 h-10 w-48 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-emerald-200 h-10 w-64 rounded-lg animate-pulse" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
                  <p className="text-sm">Belum ada pesan. Kirim pesan pertama Anda di bawah ini!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.pengirim_id === currentUser!.id
                  const showSenderName = index === 0 || messages[index - 1].pengirim_id !== msg.pengirim_id

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[70%]",
                        isOwn ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      {showSenderName && !isOwn && (
                        <span className="text-[10px] text-gray-500 font-medium ml-1 mb-1">
                          {activePercakapan.orang_tua?.nama_lengkap}
                        </span>
                      )}

                      <div
                        className={cn(
                          "px-4 py-2.5 shadow-xs relative group transition-all duration-150",
                          isOwn
                            ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none"
                            : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                        
                        {/* Timestamp below/hover */}
                        <div className={cn(
                          "text-[9px] mt-1 text-right",
                          isOwn ? "text-emerald-200" : "text-gray-400"
                        )}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer */}
            <form onSubmit={handleSend} className="fixed bottom-0 left-0 right-0 md:static bg-white border-t border-gray-200 p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3 mb-16 md:mb-0 flex gap-2 z-30">
              <Input
                placeholder="Tulis pesan..."
                className="flex-1"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-2.5"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Obrolan Pengampu</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Pilih salah satu wali santri di sebelah kiri untuk memulai percakapan.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
