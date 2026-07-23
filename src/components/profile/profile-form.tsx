'use client'

import React, { useEffect, useState, useRef , useMemo} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/lib/actions/auth'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { UserCircle, KeyRound, User as UserIcon, Edit2, LogOut, Camera } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import type { Profile, OrangTua } from '@/types'

interface ProfileFormProps {
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
}

export function ProfileForm({ role }: ProfileFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // State
  const [user, setUser] = useState<User | null>(null)
  const [profileData, setProfileData] = useState<(Profile | OrangTua) | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Profile Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  
  // Shadow styles and border radius for Cards
  const cardShadowStyle = isTu 
    ? 'shadow-none rounded-md border border-[#E5E7EB]' 
    : (isKoordinator || isKepsek)
    ? 'shadow-sm rounded-lg border border-[#E5E7EB]'
    : 'shadow-md rounded-2xl border border-[#E5E7EB]'

  // Button rounded settings
  const buttonRoundedProp = isOrangTua ? 'full' : (isPengampu || isKoordinator || isKepsek) ? 'lg' : 'md'

  // Cleanup object URLs for photo preview
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

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
          .maybeSingle()

        if (!active) return

        if (error || !data) {
          console.error('Error fetching profile:', error || 'Data not found')
          toast.error('Gagal memuat data profil')
        } else {
          setProfileData(data as Profile | OrangTua)
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

    if (!user) {
      toast.error('Sesi pengguna tidak valid')
      return
    }

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
      setProfileData((prev) => (prev ? { ...prev, nama_lengkap: namaBaru.trim() } : null))
      
      // Refresh local state and layouts (like topbar name displays)
      router.refresh()
    } catch (err) {
      console.error('Unexpected error updating name:', err)
      toast.error('Terjadi kesalahan saat memperbarui nama')
    } finally {
      setIsUpdatingNama(false)
    }
  }

  // Handle Photo Upload (UI Mockup)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB')
      return
    }

    setIsUploadingPhoto(true)
    
    // Simulate upload delay & create local preview
    setTimeout(() => {
      setPhotoPreview((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return URL.createObjectURL(file)
      })
      setIsUploadingPhoto(false)
      toast.success('Foto profil berhasil diunggah secara lokal')
    }, 1000)
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

      // Immediately restore/refresh the original session to avoid cookie conflicts
      await supabase.auth.refreshSession()

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

  // Handle Logout — calls the existing Server Action from Phase 2
  // logout() internally clears the cookie, calls supabase.auth.signOut(), and redirects
  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah kamu yakin ingin keluar?')
    if (!confirmed) return

    try {
      await logout()
      // redirect is handled server-side inside logout(); this line is a fallback
    } catch {
      // Next.js redirect() throws internally — this is expected and safe to ignore
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
    <div className="max-w-2xl mx-auto space-y-4 p-4 md:p-6 animate-fade-in-up">
      
      {/* ── HERO PROFILE CARD (Evergreen) */}
      <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1E7A1E 55%, #145214 100%)', boxShadow: '0 8px 40px rgba(34,139,34,0.25)' }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-hex-white opacity-60 rounded-3xl pointer-events-none" />

        {/* Avatar + name */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar clickable */}
          <div
            className="relative group/avatar cursor-pointer mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl bg-white/20 flex items-center justify-center transition-transform group-hover/avatar:scale-105 duration-300">
              {isUploadingPhoto ? (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-20 h-20 text-white/60" />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ubah</span>
              </div>
            </div>
            {/* Camera badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-emerald-700">
              <Camera className="w-4 h-4 text-emerald-700" />
            </div>
          </div>

          <h2 className="text-white font-extrabold text-xl mb-1">{profileData?.nama_lengkap || '-'}</h2>
          <span className="bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {roleLabelMap[role]}
          </span>
        </div>

        {/* Info row */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
          {isOrangTua ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-sm">
              <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-wider mb-1">Nomor HP</p>
              <p className="text-white font-bold text-sm">{(profileData && 'nomor_hp' in profileData && profileData.nomor_hp) || '-'}</p>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-sm">
              <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-wider mb-1">Email</p>
              <p className="text-white font-bold text-sm truncate">{(profileData && 'email' in profileData && profileData.email) || '-'}</p>
            </div>
          )}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-wider mb-1">Bergabung</p>
            <p className="text-white font-bold text-sm">{formatJoinDate(profileData?.created_at)}</p>
          </div>
        </div>

        {/* Edit button */}
        <div className="relative z-10 mt-4">
          <button
            onClick={handleFocusEditNama}
            className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-bold py-2.5 rounded-2xl transition-all duration-200 backdrop-blur-sm"
          >
            <Edit2 className="w-4 h-4" />
            Ubah Nama
          </button>
        </div>
      </div>

      {/* ── EDIT NAMA */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #C8DFC8', boxShadow: '0 2px 12px rgba(34,139,34,0.07)' }}>
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(34,139,34,0.05)' }} />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2.5 rounded-xl" style={{ background: '#F0F7F0' }}>
            <UserIcon className="w-4 h-4" style={{ color: '#228B22' }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: '#1C3B1C' }}>Ubah Nama Lengkap</h3>
        </div>
        <form onSubmit={handleUpdateNama} className="space-y-3 relative z-10">
          <Input
            ref={nameInputRef}
            label="Nama Lengkap"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            placeholder="Masukkan nama lengkap baru"
            required
            minLength={2}
          />
          <div className="flex justify-end">
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
      </div>

      {/* ── GANTI PASSWORD */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #FDE68A', boxShadow: '0 2px 12px rgba(180,130,10,0.07)' }}>
        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(180,130,10,0.06)' }} />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2.5 rounded-xl" style={{ background: '#FFFBEB' }}>
            <KeyRound className="w-4 h-4" style={{ color: '#B45309' }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: '#78350F' }}>Ganti Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3 relative z-10">
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
          <div className="flex justify-end pt-1">
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
      </div>

      {/* ── LOGOUT */}
      <div className="rounded-2xl p-5" style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', boxShadow: '0 2px 12px rgba(180,50,50,0.06)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold" style={{ color: '#991B1B' }}>Keluar dari Akun</p>
            <p className="text-xs mt-0.5" style={{ color: '#DC2626', opacity: 0.7 }}>Sesi kamu akan diakhiri dan diarahkan ke halaman login.</p>
          </div>
          <Button
            variant="danger"
            rounded={buttonRoundedProp}
            onClick={handleLogout}
            className="flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  )
}
