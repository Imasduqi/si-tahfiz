import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'sakit' | 'izin'
}

export function Badge({ className, variant = 'success', ...props }: BadgeProps) {
  const styles = {
    success: 'bg-[#D1FAE5] text-[#065F46]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    danger: 'bg-[#FEE2E2] text-[#991B1B]',
    info: 'bg-[#DBEAFE] text-[#1E40AF]',
    sakit: 'bg-[#F3E8FF] text-[#6B21A8]',
    izin: 'bg-[#DBEAFE] text-[#1E40AF]',
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
        styles[variant],
        className
      )}
      {...props}
    />
  )
}
