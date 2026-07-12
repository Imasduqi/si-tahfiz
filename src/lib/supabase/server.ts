import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRequiredEnv } from '@/lib/utils'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch (err) {
            // This can happen when called from a Server Component, which is expected
            // and not itself an error — but log at debug level in case it indicates
            // a genuine session refresh problem during actual mutations
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie setAll failed (expected in Server Components):', err)
            }
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  return createServerClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
