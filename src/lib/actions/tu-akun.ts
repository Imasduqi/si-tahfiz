'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { phoneToEmail } from '@/lib/utils'

export type ActionResponse = 
  | { success: true }
  | { success: false; error: string }

export async function createUserAction(data: {
  nama_lengkap: string
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
  email?: string
  nomor_hp?: string
  password?: string
}): Promise<ActionResponse> {
  console.log('[createUserAction] === SERVER ACTION ENTERED ===', JSON.stringify(data))
  console.log('[createUserAction] Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // 1. Authenticate and authorize caller
    console.log('[createUser] Step 1: Authenticating caller...')
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      console.log('[createUser] Auth failed:', authError?.message)
      return { success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' }
    }
    console.log('[createUser] Caller:', currentUser.id)

    // Check if user is TU
    const { data: tuProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!tuProfile || tuProfile.role !== 'tu') {
      console.log('[createUser] Not TU role:', tuProfile?.role)
      return { success: false, error: 'Hanya Staff TU yang diperbolehkan mengelola akun.' }
    }

    // 2. Validate input and handle creation by role
    if (data.role === 'orang_tua') {
      const nomorHP = data.nomor_hp?.trim()
      if (!nomorHP) {
        return { success: false, error: 'Nomor HP wajib diisi.' }
      }
      if (!/^\d+$/.test(nomorHP)) {
        return { success: false, error: 'Nomor HP harus berupa angka.' }
      }
      if (nomorHP.length < 10) {
        return { success: false, error: 'Nomor HP minimal 10 digit.' }
      }

      // Check phone unique check before creating for orang_tua
      const { data: existingPhone } = await adminSupabase
        .from('orang_tua')
        .select('id')
        .eq('nomor_hp', nomorHP)
        .maybeSingle()

      if (existingPhone) {
        return { success: false, error: 'Nomor HP sudah terdaftar.' }
      }

      const email = phoneToEmail(nomorHP)
      const password = `TAHFIZ_${nomorHP}`

      // Create auth user
      console.log('[createUser] Step 2: Creating auth user (orang_tua)...')
      const { data: authData, error: createAuthError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      console.log('[createUser] Step 2 result:', { userId: authData?.user?.id, error: createAuthError?.message })

      if (createAuthError) {
        if (createAuthError.message.includes('already exists') || createAuthError.status === 422) {
          return { success: false, error: 'Nomor HP sudah terdaftar di sistem autentikasi.' }
        }
        return { success: false, error: createAuthError.message }
      }

      // Insert into orang_tua table — use adminSupabase to bypass RLS
      console.log('[createUser] Step 3: Inserting into orang_tua...')
      const { error: insertError } = await adminSupabase
        .from('orang_tua')
        .insert({
          id: authData.user.id,
          nama_lengkap: data.nama_lengkap.trim(),
          nomor_hp: nomorHP
        })

      console.log('[createUser] Step 3 result:', { error: insertError?.message, code: insertError?.code })

      if (insertError) {
        // Rollback auth user creation if table insert fails
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        if (insertError.code === '23505') {
          return { success: false, error: 'Nomor HP sudah terdaftar.' }
        }
        return { success: false, error: insertError.message }
      }

      // Write to audit_trail — use adminSupabase to bypass RLS
      await adminSupabase.from('audit_trail').insert({
        user_id: currentUser.id,
        aktivitas: `Tambah akun: ${data.nama_lengkap.trim()} (Orang Tua)`
      })

      console.log('[createUser] Success: orang_tua account created')
      return { success: true }
    } else {
      // Internal roles
      const email = data.email?.trim()
      const password = data.password?.trim()

      if (!email) return { success: false, error: 'Email wajib diisi.' }
      if (!password) return { success: false, error: 'Password wajib diisi.' }
      if (password.length < 8) return { success: false, error: 'Password minimal 8 karakter.' }

      // Check email uniqueness in profiles
      const { data: existingEmail } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingEmail) {
        return { success: false, error: 'Email sudah terdaftar.' }
      }

      // Create auth user
      console.log('[createUser] Step 2: Creating auth user (internal)...')
      const { data: authData, error: createAuthError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      console.log('[createUser] Step 2 result:', { userId: authData?.user?.id, error: createAuthError?.message })

      if (createAuthError) {
        if (createAuthError.message.includes('already exists') || createAuthError.status === 422) {
          return { success: false, error: 'Email sudah terdaftar di sistem autentikasi.' }
        }
        return { success: false, error: createAuthError.message }
      }

      // Insert into profiles table — use adminSupabase to bypass RLS
      console.log('[createUser] Step 3: Inserting into profiles...')
      const { error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nama_lengkap: data.nama_lengkap.trim(),
          role: data.role,
          email
        })

      console.log('[createUser] Step 3 result:', { error: insertError?.message, code: insertError?.code })

      if (insertError) {
        // Rollback auth user creation if table insert fails
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        if (insertError.code === '23505') {
          return { success: false, error: 'Email sudah terdaftar.' }
        }
        return { success: false, error: insertError.message }
      }

      // Write to audit_trail — use adminSupabase to bypass RLS
      const roleLabel = data.role.toUpperCase()
      await adminSupabase.from('audit_trail').insert({
        user_id: currentUser.id,
        aktivitas: `Tambah akun: ${data.nama_lengkap.trim()} (${roleLabel})`
      })

      console.log('[createUser] Success: internal account created')
      return { success: true }
    }
  } catch (err) {
    console.error('[createUser] Uncaught error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

export async function updateUserAction(data: {
  id: string
  nama_lengkap: string
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
}): Promise<ActionResponse> {
  try {
    const adminSupabase = await createAdminClient()

    // 1. Authenticate caller via cookie-based client
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return { success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' }
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (callerProfile?.role !== 'tu') {
      return { success: false, error: 'Tidak memiliki izin untuk melakukan aksi ini' }
    }

    // 2. Determine actual table from database — don't trust client-supplied role
    const { data: profileRecord } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', data.id)
      .maybeSingle()

    if (profileRecord) {
      // User exists in profiles table (internal role)
      const { error } = await adminSupabase
        .from('profiles')
        .update({ nama_lengkap: data.nama_lengkap.trim() })
        .eq('id', data.id)

      if (error) return { success: false, error: error.message }
    } else {
      // User must be in orang_tua table
      const { error } = await adminSupabase
        .from('orang_tua')
        .update({ nama_lengkap: data.nama_lengkap.trim() })
        .eq('id', data.id)

      if (error) return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { success: false, error: errorMsg }
  }
}

export async function resetPasswordAction(data: {
  id: string
  password_baru: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // 1. Authenticate caller
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return { success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' }
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (callerProfile?.role !== 'tu') {
      return { success: false, error: 'Tidak memiliki izin untuk melakukan aksi ini' }
    }

    if (data.password_baru.length < 8) {
      return { success: false, error: 'Password baru minimal 8 karakter.' }
    }

    // 2. Call auth.admin.updateUserById with new password
    const { error } = await adminSupabase.auth.admin.updateUserById(data.id, {
      password: data.password_baru
    })

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { success: false, error: errorMsg }
  }
}

export async function deleteUserAction(data: {
  id: string
  nama_lengkap: string
  role: 'tu' | 'koordinator' | 'pengampu' | 'kepsek' | 'orang_tua'
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // 1. Authenticate caller
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return { success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' }
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (callerProfile?.role !== 'tu') {
      return { success: false, error: 'Tidak memiliki izin untuk melakukan aksi ini' }
    }

    // Check if deleting self to prevent locking out the admin
    if (currentUser.id === data.id) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' }
    }

    // 2. Determine actual role from database before deletion for accurate audit
    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', data.id)
      .maybeSingle()

    const roleLabel = targetProfile ? targetProfile.role.toUpperCase() : 'Orang Tua'

    // 3. Delete user in Auth (cascade delete handles database row deletion automatically)
    const { error } = await adminSupabase.auth.admin.deleteUser(data.id)
    if (error) return { success: false, error: error.message }

    // 4. Write to audit_trail — use adminSupabase to bypass RLS
    await adminSupabase.from('audit_trail').insert({
      user_id: currentUser.id,
      aktivitas: `Hapus akun: ${data.nama_lengkap} (${roleLabel})`
    })

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { success: false, error: errorMsg }
  }
}
