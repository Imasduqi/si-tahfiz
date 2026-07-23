'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export interface ImportPayload {
  namaLengkap: string
  nomorHp: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: { nama: string; nomorHp: string; reason: string }[]
}

export async function bulkCreateOrangTua(rows: ImportPayload[]): Promise<ImportResult> {
  const results: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  // Verify caller is TU
  const supabase = await createClient()
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) {
    // If session lost, mark all rows as failed
    for (const row of rows) {
      results.failed++
      results.errors.push({ nama: row.namaLengkap, nomorHp: row.nomorHp, reason: 'Sesi berakhir. Silakan login kembali.' })
    }
    return results
  }

  const { data: tuProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (!tuProfile || tuProfile.role !== 'tu') {
    for (const row of rows) {
      results.failed++
      results.errors.push({ nama: row.namaLengkap, nomorHp: row.nomorHp, reason: 'Hanya Staff TU yang diperbolehkan melakukan import massal.' })
    }
    return results
  }

  const adminClient = await createAdminClient()

  // Collect audit trail entries for batch insert after processing
  const auditEntries: { user_id: string; aktivitas: string }[] = []

  // Process rows sequentially to avoid overwhelming Supabase Auth API
  for (const row of rows) {
    try {
      const phoneAsEmail = `${row.nomorHp}@ortu.sitahfiz`
      const password = `TAHFIZ_${row.nomorHp}`

      const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
        email: phoneAsEmail,
        password: password,
        email_confirm: true,
      })

      if (authCreateError) {
        results.failed++
        results.errors.push({
          nama: row.namaLengkap,
          nomorHp: row.nomorHp,
          reason: authCreateError.message,
        })
        continue
      }

      const { error: insertError } = await adminClient
        .from('orang_tua')
        .insert({
          id: authData.user.id,
          nama_lengkap: row.namaLengkap,
          nomor_hp: row.nomorHp,
        })

      if (insertError) {
        // Rollback auth user if table insert fails
        await adminClient.auth.admin.deleteUser(authData.user.id)
        results.failed++
        results.errors.push({
          nama: row.namaLengkap,
          nomorHp: row.nomorHp,
          reason: insertError.message,
        })
        continue
      }

      // Collect audit trail entry for batch insert
      auditEntries.push({
        user_id: currentUser.id,
        aktivitas: `[Import Massal] Tambah akun: ${row.namaLengkap} (Orang Tua)`,
      })

      results.success++
    } catch (err) {
      results.failed++
      results.errors.push({
        nama: row.namaLengkap,
        nomorHp: row.nomorHp,
        reason: String(err),
      })
    }
  }

  // Batch insert all audit trail entries at once to reduce network roundtrips
  if (auditEntries.length > 0) {
    await adminClient.from('audit_trail').insert(auditEntries)
  }

  return results
}
