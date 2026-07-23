// Custom service worker code — merged by @ducanh2912/next-pwa

interface CustomWindowClient {
  url: string
  focus: () => Promise<CustomWindowClient>
  navigate: (url: string) => Promise<CustomWindowClient>
}

interface CustomClients {
  matchAll: (options?: { type?: string; includeUncontrolled?: boolean }) => Promise<CustomWindowClient[]>
  openWindow: (url: string) => Promise<CustomWindowClient | null>
}

interface CustomServiceWorkerRegistration {
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>
}

interface CustomServiceWorkerGlobalScope {
  registration: CustomServiceWorkerRegistration
  clients: CustomClients
  location: { origin: string }
  skipWaiting: () => void
  addEventListener: (type: string, listener: (event: Event) => void) => void
}

interface PushEventData {
  json: () => { title: string; body: string; icon?: string; badge?: string; tag?: string; url?: string }
}

interface CustomPushEvent extends Event {
  data: PushEventData | null
  waitUntil: (promise: Promise<unknown>) => void
}

interface CustomNotificationEvent extends Event {
  notification: {
    close: () => void
    data?: { url?: string }
  }
  waitUntil: (promise: Promise<unknown>) => void
}

interface CustomExtendableMessageEvent extends Event {
  data: { type?: string } | null
}

const _self = self as unknown as CustomServiceWorkerGlobalScope

_self.addEventListener('push', (e: Event) => {
  const event = e as CustomPushEvent
  if (!event.data) return

  let data: { title: string; body: string; icon?: string; badge?: string; tag?: string; url?: string }
  try {
    data = event.data.json()
  } catch (err) {
    console.error('Failed to parse push payload:', err)
    return
  }

  event.waitUntil(
    _self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? '/icon-192.png',
      badge: data.badge ?? '/icon-192.png',
      tag: data.tag,
      data: { url: data.url ?? '/ortu/beranda' }
    })
  )
})

_self.addEventListener('notificationclick', (e: Event) => {
  const event = e as CustomNotificationEvent
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    _self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((c) => typeof c.url === 'string' && c.url.includes(_self.location.origin))
      if (existingClient) {
        existingClient.focus()
        existingClient.navigate(url)
      } else {
        _self.clients.openWindow(url)
      }
    })
  )
})

// Handle skip waiting message from update banner
_self.addEventListener('message', (e: Event) => {
  const event = e as CustomExtendableMessageEvent
  if (event.data?.type === 'SKIP_WAITING') {
    _self.skipWaiting()
  }
})
