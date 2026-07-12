'use server'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

export async function sendAlphaPushNotification(
  ortuId: string,
  santriNama: string,
  tanggal: string
): Promise<void> {
  const vapidSubject = process.env.VAPID_SUBJECT
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification')
    return
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  try {
    const adminClient = await createAdminClient()

    const { data: subscriptions } = await adminClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', ortuId)

    if (!subscriptions || subscriptions.length === 0) return

    const payload = JSON.stringify({
      title: 'Notifikasi Alpha — SI-Tahfiz',
      body: `${santriNama} tidak hadir (Alpha) pada ${tanggal}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `alpha-${santriNama}-${tanggal}`,
      url: '/ortu/beranda'
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key }
          },
          payload
        )
      )
    )

    // Remove expired subscriptions (HTTP 410 Gone)
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number }
        if (err.statusCode === 410) {
          await adminClient
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscriptions[i].endpoint)
        }
      }
    }
  } catch {
    // Silently ignore — absensi save must not fail because of push
  }
}
