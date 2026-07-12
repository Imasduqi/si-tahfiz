'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0c29] text-white px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl font-bold text-red-400">500</div>
        <h2 className="text-xl font-semibold">Terjadi Kesalahan</h2>
        <p className="text-white/60 text-sm">
          Mohon maaf, terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi admin jika masalah berlanjut.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
