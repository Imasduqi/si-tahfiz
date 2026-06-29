import React from 'react'
import { cn } from '@/lib/utils'
import { useRoleStyle } from '@/components/shared/role-context'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'md' | 'sm' | 'none'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, shadow, ...props }, ref) => {
    const roleStyle = useRoleStyle()
    const activeShadow = shadow ?? roleStyle?.shadow ?? 'none'
    
    const shadowStyles = {
      md: 'shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-2xl',
      sm: 'shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-lg',
      none: 'shadow-none rounded-md',
    }

    return (
      <div
        className={cn(
          "bg-white border border-[#E5E7EB] p-4 md:p-6 transition-all",
          shadowStyles[activeShadow],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'
