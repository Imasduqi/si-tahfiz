import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false, // changed to false — we manually call skipWaiting via message
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'src/worker',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Never cache navigation requests or RSC data fetches —
        // these must always go straight to the network so middleware
        // redirects (307) are handled correctly by the browser.
        urlPattern: ({ request, url }) => {
          const isNavigation = request.mode === 'navigate'
          const isRSC = request.headers.get('RSC') === '1' ||
                        request.headers.get('Next-Router-Prefetch') === '1'
          return isNavigation || isRSC
        },
        handler: 'NetworkOnly',
      },
      {
        // Static assets — safe to cache normally
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withPWA(nextConfig)
