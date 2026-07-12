'use client'

import { useEffect , useMemo} from 'react'
import { createClient } from '@/lib/supabase/client'
import { urlBase64ToUint8Array } from '@/lib/utils/vapid'

export function usePushSubscription(role: string) {
  useEffect(() => {
    // Only subscribe for orang_tua role
    if (role !== 'orang_tua') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        
        // Check if already subscribed
        const existing = await registration.pushManager.getSubscription()
        if (existing) return // already subscribed, no need to re-subscribe
        
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) return

        // Critical: convert to Uint8Array before passing to subscribe
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any // cast to any to resolve TS mismatch with ArrayBufferLike
        })

        const subJson = subscription.toJSON()
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return

        const supabase = useMemo(() => createClient(), [])
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth_key: subJson.keys.auth
        }, { onConflict: 'user_id,endpoint' })

      } catch (err) {
        // Silently ignore — push subscription is optional feature
        console.warn('Push subscription failed:', err)
      }
    }

    subscribe()
  }, [role])
}
