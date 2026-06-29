import React from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  title?: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  title = 'Belum ada data',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-[#E5E7EB]">
      <Inbox className="w-[80px] h-[80px] text-[#D1D5DB] mb-4" strokeWidth={1.5} />
      <h3 className="text-[16px] font-semibold text-[#374151] mb-1">{title}</h3>
      <p className="text-[14px] text-[#6B7280] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
