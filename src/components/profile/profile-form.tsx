'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { UserCircle, Mail, Phone, Calendar, KeyRound, User as UserIcon, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileFormProps {
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
}

export function ProfileForm({ role }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // State
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Edit Nama state
  const [namaBaru, setNamaBaru] = useState('')
  const [isUpdatingNama, setIsUpdatingNama] = useState(false)

  // Ganti Password state
  const [passwordLama, setPasswordLama] = useState('')
  const [passwordBaru, setPasswordBaru] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Ref to name input for inline edit navigation
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Mapping role UI label
  const roleLabelMap: Record<typeof role, string> = {
    tu: 'Tata Usaha',
    koordinator: 'Koordinator',
    pengampu: 'Pengampu',
    kepsek: 'Kepala Sekolah',
    orang_tua: 'Orang Tua',
  }

  // Derive visual styles based on role specifications
  const isTu = role === 'tu'
  const isKoordinator = role === 'koordinator'
  const isKepsek = role === 'kepsek'
  const isPengampu = role === 'pengampu'
  const isOrangTua = role === 'orang_tua'

  const cardPadding = isTu ? 'p-4 md:p-4' : 'p-6 md:p-6'
  const spacingClass = isTu ? 'space-y-4' : 'space-y-6'
  
  // Shadow styles and border radius for Cards
  const cardShadowStyle = isTu 
    ? 'shadow-none rounded-md border border-[#E5E7EB]' 
    : (isKoordinator || isKepsek)
    ? 'shadow-sm rounded-lg border border-[#E5E7EB]'
    : 'shadow-md rounded-2xl border border-[#E5E7EB]'

  // Button rounded settings
  const buttonRoundedProp = isOrangTua ? 'full' : (isPengampu || isKoordinator || isKepsek) ? 'lg' : 'md'

  // Load Profile Data
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        setLoading(true)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!active) return

        if (!currentUser) {
          toast.error('Sesi telah berakhir. Silakan login kembali.')
          router.push('/login')
          return
        }
        setUser(currentUser)

        const table = role === 'orang_tua' ? 'orang_tua' : 'profiles'
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (!active) return

        if (error) {
          console.error('Error fetching profile:', error)
          toast.error('Gagal memuat data profil')
        } else if (data) {
          setProfileData(data)
          setNamaBaru(data.nama_lengkap)
        }
      } catch (err) {
        console.error('Unexpected error loading profile:', err)
        toast.error('Terjadi kesalahan saat memuat profil')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [role, supabase, router])

  // Handle Name Update
  const handleUpdateNama = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaBaru.trim() || namaBaru.trim().length < 2) {
      toast.error('Nama lengkap minimal 2 karakter')
      return
    }

    if (namaBaru.trim() === profileData?.nama_lengkap) {
      toast.error('Tidak ada perubahan yang disimpan')
      return
    }

    try {
      setIsUpdatingNama(true)
      const table = role === 'orang_tua' ? 'orang_tua' : 'profiles'
      const { error } = await supabase
        .from(table)
        .update({ nama_lengkap: namaBaru.trim() })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating name:', error)
        toast.error('Gagal memperbarui nama')
        return
      }

      toast.success('Nama berhasil diperbarui')
      setProfileData((prev: any) => ({ ...prev, nama_lengkap: namaBaru.trim() }))
      
      // Refresh local state and layouts (like topbar name displays)
      router.refresh()
    } catch (err) {
      console.error('Unexpected error updating name:', err)
      toast.error('Terjadi kesalahan saat memperbarui nama')
    } finally {
      setIsUpdatingNama(false)
    }
  }

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordLama) {
      toast.error('Password lama wajib diisi')
      return
    }
    if (passwordBaru.length < 8) {
      toast.error('Password baru minimal 8 karakter')
      return
    }
    if (passwordBaru !== konfirmasiPassword) {
      toast.error('Konfirmasi password tidak sesuai')
      return
    }

    try {
      setIsUpdatingPassword(true)
      
      // Step 1: verify old password by attempting sign in
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        toast.error('Sesi telah berakhir. Silakan login kembali.')
        return
      }
      
      const currentEmail = currentUser.email // works for both internal roles and orang_tua (phone-as-email format)

      if (!currentEmail) {
        toast.error('Email tidak ditemukan pada sesi user')
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: passwordLama
      })

      if (verifyError) {
        toast.error('Password lama tidak sesuai')
        return
      }

      // Step 2: update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordBaru
      })

      if (updateError) {
        toast.error('Gagal mengganti password')
        return
      }

      toast.success('Password berhasil diganti')
      
      // Clear password inputs
      setPasswordLama('')
      setPasswordBaru('')
      setKonfirmasiPassword('')
    } catch (err) {
      console.error('Unexpected error changing password:', err)
      toast.error('Terjadi kesalahan saat mengganti password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Handle focusing the edit nama input
  const handleFocusEditNama = () => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Loading skeleton layout
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-8 w-40" />
        </div>
        <Card className={`${cardShadowStyle} ${cardPadding}`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <LoadingSkeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-3 w-full">
              <LoadingSkeleton className="h-6 w-1/3" />
              <LoadingSkeleton className="h-4 w-1/4" />
              <LoadingSkeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
        <Card className={`${cardShadowStyle} ${cardPadding} space-y-4`}>
          <LoadingSkeleton className="h-6 w-1/4" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-24" />
        </Card>
        <Card className={`${cardShadowStyle} ${cardPadding} space-y-4`}>
          <LoadingSkeleton className="h-6 w-1/4" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-24" />
        </Card>
      </div>
    )
  }

  // Format Join Date (Tanggal Bergabung)
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className={`max-w-4xl mx-auto ${spacingClass} p-4 md:p-6`}>
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
        <h1 className="text-2xl font-bold text-[#111827]">Profil Saya</h1>
      </div>

      {/* Card 1 — Info Akun (read-only display) */}
      <Card className={`${cardShadowStyle} ${cardPadding} relative overflow-hidden`}>
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0">
            <UserCircle className="w-20 h-20 text-[#10B981] transition-transform hover:scale-105 duration-300" />
          </div>
          
          <div className="flex-1 w-full space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">
                  {profileData?.nama_lengkap || '-'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge variant="info">
                    {roleLabelMap[role]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                rounded={buttonRoundedProp}
                onClick={handleFocusEditNama}
                className="self-center sm:self-start mt-2 sm:mt-0 flex items-center gap-1.5 text-xs py-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Ubah Nama
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F3F4F6] text-sm text-left">
              {/* Email / Nomor HP Info field */}
              {isOrangTua ? (
                <div className="flex items-center gap-3 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]/50">
                  <Phone className="w-5 h-5 text-[#6B7280]" />
                  <div>
                    <p className="text-xs text-[#6B7280] font-medium">Nomor HP</p>
                    <p className="text-sm font-semibold text-[#111827]">
                      {profileData?.nomor_hp || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]/50">
                  <Mail className="w-5 h-5 text-[#6B7280]" />
                  <div>
                    <p className="text-xs text-[#6B7280] font-medium">Email</p>
                    <p className="text-sm font-semibold text-[#111827]">
                      {profileData?.email || '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tanggal Bergabung */}
              <div className="flex items-center gap-3 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]/50">
                <Calendar className="w-5 h-5 text-[#6B7280]" />
                <div>
                  <p className="text-xs text-[#6B7280] font-medium">Tanggal Bergabung</p>
                  <p className="text-sm font-semibold text-[#111827]">
                    {formatJoinDate(profileData?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card 2 — Edit Nama Form */}
      <Card className={`${cardShadowStyle} ${cardPadding}`}>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-[#10B981]" />
          <h3 className="text-lg font-bold text-[#111827]">Ubah Nama Lengkap</h3>
        </div>
        
        <form onSubmit={handleUpdateNama} className="space-y-4">
          <Input
            ref={nameInputRef}
            label="Nama Lengkap"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            placeholder="Masukkan nama lengkap baru"
            required
            minLength={2}
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              rounded={buttonRoundedProp}
              isLoading={isUpdatingNama}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Card>

      {/* Card 3 — Ganti Password Form */}
      <Card className={`${cardShadowStyle} ${cardPadding}`}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-[#10B981]" />
          <h3 className="text-lg font-bold text-[#111827]">Ganti Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            label="Password Lama"
            value={passwordLama}
            onChange={(e) => setPasswordLama(e.target.value)}
            placeholder="Masukkan password lama"
            required
          />
          <Input
            type="password"
            label="Password Baru"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
          />
          <Input
            type="password"
            label="Konfirmasi Password Baru"
            value={konfirmasiPassword}
            onChange={(e) => setKonfirmasiPassword(e.target.value)}
            placeholder="Ulangi password baru"
            required
            minLength={8}
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              rounded={buttonRoundedProp}
              isLoading={isUpdatingPassword}
            >
              Simpan Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
