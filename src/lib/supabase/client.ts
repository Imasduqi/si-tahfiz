import { createBrowserClient } from '@supabase/ssr'
// import removed as it is no longer used for client side env variables

function initClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(url, key)
}

let browserClient: ReturnType<typeof initClient> | undefined

export function createClient() {
  if (browserClient) return browserClient
  
  browserClient = initClient()
  
  return browserClient
}
