'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile, OrangTua } from '@/types'

// ─────────────────────────────────────────────
// Type
// ─────────────────────────────────────────────

export type UserRole = 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua' | null

export interface UseUserReturn {
  user: User | null
  profile: Profile | null
  orangTua: OrangTua | null
  role: UserRole
  isLoading: boolean
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useUser(): UseUserReturn {
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [orangTua, setOrangTua] = useState<OrangTua | null>(null)
  const [role, setRole]         = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  async function fetchProfile(currentUser: User) {
    // Coba ambil dari tabel profiles (user internal)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (!profileError && profileData) {
      setProfile(profileData as Profile)
      setOrangTua(null)
      setRole(profileData.role as UserRole)
      return
    }

    // Jika tidak ada di profiles, coba tabel orang_tua
    const { data: ortData, error: ortError } = await supabase
      .from('orang_tua')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (!ortError && ortData) {
      setOrangTua(ortData as OrangTua)
      setProfile(null)
      setRole('orang_tua')
      return
    }

    // Tidak ditemukan di keduanya
    setProfile(null)
    setOrangTua(null)
    setRole(null)
  }

  useEffect(() => {
    let mounted = true

    async function initialize() {
      // Gunakan getUser() (bukan getSession()) — rekomendasi Supabase SSR
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!mounted) return

      if (currentUser) {
        setUser(currentUser)
        await fetchProfile(currentUser)
      } else {
        setUser(null)
        setProfile(null)
        setOrangTua(null)
        setRole(null)
      }

      if (mounted) setIsLoading(false)
    }

    initialize()

    // Subscribe ke perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setIsLoading(true)
          await fetchProfile(session.user)
          if (mounted) setIsLoading(false)
        } else {
          setUser(null)
          setProfile(null)
          setOrangTua(null)
          setRole(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, profile, orangTua, role, isLoading }
}
