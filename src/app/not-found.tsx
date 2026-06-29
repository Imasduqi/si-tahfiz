import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0c29] text-white px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl font-bold text-violet-400">404</div>
        <h2 className="text-xl font-semibold">Halaman Tidak Ditemukan</h2>
        <p className="text-white/60 text-sm">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
