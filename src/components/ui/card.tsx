import React from 'react'
import { cn } from '@/lib/utils'
import { useRoleStyle } from '@/components/shared/role-context'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'md' | 'sm' | 'none'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, shadow, style, ...props }, ref) => {
    const roleStyle = useRoleStyle()
    const activeShadow = shadow ?? roleStyle?.shadow ?? 'none'

    const shadowStyles = {
      md:   'shadow-[0_4px_20px_rgba(34,139,34,0.08)]',
      sm:   'shadow-[0_2px_8px_rgba(34,139,34,0.06)]',
      none: '',
    }

    return (
      <div
        className={cn(
          "rounded-2xl transition-all bg-white border border-[#E0EDE0]",
          shadowStyles[activeShadow],
          className
        )}
        style={{
          boxShadow: activeShadow === 'none'
            ? 'none'
            : activeShadow === 'md'
              ? '0 4px 20px rgba(34,139,34,0.08), 0 1px 4px rgba(0,0,0,0.04)'
              : '0 2px 8px rgba(34,139,34,0.06), 0 1px 2px rgba(0,0,0,0.03)',
          ...style,
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'
