import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false, // changed to false — we manually call skipWaiting via message
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'src/worker',
  workboxOptions: {
    disableDevLogs: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withPWA(nextConfig)
