interface PullIndicatorProps {
  isRefreshing: boolean
  pullDistance: number
  threshold?: number
}

export function PullIndicator({ isRefreshing, pullDistance, threshold = 80 }: PullIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div
      className="flex items-center justify-center text-emerald-600 overflow-hidden transition-all duration-100"
      style={{ height: isRefreshing ? '40px' : `${Math.min(pullDistance * 0.5, 40)}px` }}
    >
      {isRefreshing ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-emerald-600">Memperbarui...</span>
        </div>
      ) : (
        <span className="text-xs text-emerald-400">
          {pullDistance >= threshold ? '↑ Lepas untuk memperbarui' : '↓ Tarik untuk memperbarui'}
        </span>
      )}
    </div>
  )
}
