'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { Send, MessageSquare, User, Baby } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Anak {
  id: string
  nama_lengkap: string
}

interface Message {
  id: string
  percakapan_id: string
  pengirim_id: string
  isi: string
  created_at: string
}

interface Percakapan {
  id: string
  santri_id: string
  pengampu_id: string
  ortu_id: string
  created_at: string
}

export default function OrtuPesanPage() {
  const supabase = createClient()
  const { user: currentUser, isLoading: userLoading } = useUser()

  // Children States
  const [anakList, setAnakList] = useState<Anak[]>([])
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null)
  const [pengampuName, setPengampuName] = useState<string>('')

  // Chat/Connection States
  const [percakapan, setPercakapan] = useState<Percakapan | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Message Input State
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch children list (anakList)
  useEffect(() => {
    if (!currentUser) return

    async function fetchAnak() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('santri')
          .select('id, nama_lengkap')
          .eq('orang_tua_id', currentUser?.id)

        if (error) throw error

        const list = data || []
        setAnakList(list)
        if (list.length > 0) {
          setSelectedAnakId(list[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch children list:', err)
        toast.error('Gagal memuat data anak')
      } finally {
        setLoading(false)
      }
    }

    fetchAnak()
  }, [currentUser, supabase])

  // Fetch or create conversation thread for the selected child
  useEffect(() => {
    if (!currentUser || !selectedAnakId) return

    let isMounted = true

    async function initChat() {
      try {
        setLoadingMessages(true)
        setPengampuName('')
        setPercakapan(null)
        setMessages([])

        // 1. Fetch child's halaqah pengampu details
        const { data: santriDetail, error: detailError } = await supabase
          .from('santri')
          .select(`
            id,
            nama_lengkap,
            halaqah (
              id,
              pengampu_id,
              profiles (
                nama_lengkap
              )
            )
          `)
          .eq('id', selectedAnakId)
          .single()

        if (detailError) throw detailError

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const halaqah = santriDetail?.halaqah as any
        if (!halaqah || !halaqah.pengampu_id) {
          toast.error('Anak belum terdaftar di halaqah manapun atau pengampu tidak tersedia')
          setLoadingMessages(false)
          return
        }

        const pengampuId = halaqah.pengampu_id
        const name = halaqah.profiles?.nama_lengkap || 'Pengampu'
        if (isMounted) setPengampuName(name)

        // 2. Find or create conversation
        // eslint-disable-next-line prefer-const
        let { data: thread, error: threadError } = await supabase
          .from('percakapan')
          .select('*')
          .eq('santri_id', selectedAnakId)
          .eq('ortu_id', currentUser?.id)
          .maybeSingle()

        if (threadError) throw threadError

        if (!thread) {
          const { data: newThread, error: createError } = await supabase
            .from('percakapan')
            .insert({
              santri_id: selectedAnakId,
              pengampu_id: pengampuId,
              ortu_id: currentUser?.id
            })
            .select()
            .single()

          if (createError) throw createError
          thread = newThread
        }

        if (!isMounted) return
        setPercakapan(thread)

        // 3. Fetch message history
        const { data: history, error: historyError } = await supabase
          .from('pesan')
          .select('*')
          .eq('percakapan_id', thread.id)
          .order('created_at', { ascending: true })

        if (historyError) throw historyError
        if (isMounted) setMessages(history || [])
      } catch (err) {
        console.error('Error initializing chat:', err)
        toast.error('Gagal membuka obrolan dengan pengampu')
      } finally {
        if (isMounted) setLoadingMessages(false)
      }
    }

    initChat()

    return () => {
      isMounted = false
    }
  }, [selectedAnakId, currentUser, supabase])

  // Realtime subscription
  useEffect(() => {
    if (!percakapan) return

    const channel = supabase
      .channel(`percakapan-${percakapan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pesan',
          filter: `percakapan_id=eq.${percakapan.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [percakapan, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loadingMessages])

  // Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!messageText.trim() || !percakapan || sending) return

    const trimmed = messageText.trim()
    setSending(true)

    try {
      const { error } = await supabase.from('pesan').insert({
        percakapan_id: percakapan.id,
        pengirim_id: currentUser!.id,
        isi: trimmed
      })

      if (error) throw error
      setMessageText('')
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Pesan gagal terkirim, coba lagi')
    } finally {
      setSending(false)
    }
  }

  // Time formatter
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

  if (anakList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          title="Tidak ada Santri"
          description="Akun Anda belum terhubung dengan data santri mana pun di sistem."
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hubungi Pengampu</h1>
        <p className="text-sm text-gray-500">
          Kirim dan balas pesan langsung dengan Ustadz/Ustadzah pengampu halaqah anak Anda.
        </p>
      </div>

      {/* Children Tabs (Only if multiple children) */}
      {anakList.length > 1 && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-full w-fit">
          {anakList.map((anak) => (
            <button
              key={anak.id}
              onClick={() => setSelectedAnakId(anak.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                selectedAnakId === anak.id
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4" />
                {anak.nama_lengkap}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Thread Container */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[100dvh] md:h-[calc(100vh-64px)]">
        {/* Chat Thread Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">
              {pengampuName || 'Memuat...'}
            </h3>
            <p className="text-xs text-gray-500">
              Pengampu dari {anakList.find(a => a.id === selectedAnakId)?.nama_lengkap}
            </p>
          </div>
        </div>

        {/* Chat Thread Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-4 space-y-4 bg-gray-50/40">
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
              <MessageSquare className="w-12 h-12 mb-2 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm">Belum ada percakapan. Mulai percakapan pertama Anda di bawah ini!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.pengirim_id === currentUser!.id
              const showSenderName = index === 0 || messages[index - 1].pengirim_id !== msg.pengirim_id

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isOwn ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {showSenderName && !isOwn && (
                    <span className="text-[10px] text-gray-500 font-semibold ml-1 mb-1">
                      {pengampuName}
                    </span>
                  )}

                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl shadow-xs transition-all relative group",
                      isOwn
                        ? "bg-emerald-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-150 rounded-tl-none"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.isi}</p>
                    
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

        {/* Chat Thread Input Area */}
        <form onSubmit={handleSend} className="fixed bottom-0 left-0 right-0 md:static bg-white border-t border-gray-100 p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3 mb-16 md:mb-0 flex gap-2 z-30">
          <Input
            placeholder="Tulis pesan ke Pengampu..."
            className="flex-1 rounded-full px-4 focus:ring-emerald-500 focus:border-emerald-500"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-2.5 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
