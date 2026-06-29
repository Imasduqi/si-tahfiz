import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

export interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-center max-w-md mx-auto space-y-4">
      <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
      <p className="text-[14px] text-[#991B1B] font-medium leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm">
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
