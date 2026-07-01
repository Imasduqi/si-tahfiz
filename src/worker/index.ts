// Custom service worker code — merged by @ducanh2912/next-pwa

const _self = self as any

_self.addEventListener('push', (event: any) => {
  if (!event.data) return

  const data = event.data.json()

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

_self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    _self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients: any) => {
      const existingClient = clients.find((c: any) => c.url.includes(_self.location.origin))
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
_self.addEventListener('message', (event: any) => {
  if (event.data?.type === 'SKIP_WAITING') {
    _self.skipWaiting()
  }
})
