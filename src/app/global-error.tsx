'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="id">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0c29',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '1rem',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem', gap: '1rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#f87171' }}>500</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.5rem' }}>
            Kesalahan Kritis
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Mohon maaf, terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi admin jika masalah berlanjut.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.625rem 1.5rem',
              borderRadius: '0.75rem',
              background: '#059669',
              color: 'white',
              fontWeight: 500,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
