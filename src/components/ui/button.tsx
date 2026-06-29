import React from 'react'
import { cn } from '@/lib/utils'
import { useRoleStyle } from '@/components/shared/role-context'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  rounded?: 'full' | 'lg' | 'md'
  size?: 'sm' | 'md'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', rounded, size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const roleStyle = useRoleStyle()
    const activeRounded = rounded ?? roleStyle?.rounded ?? 'md'
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[#F3F4F6] disabled:text-[#D1D5DB] disabled:border-transparent select-none'
    
    const variants = {
      primary: 'bg-[#10B981] text-white hover:bg-[#059669]',
      secondary: 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]',
      danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
      ghost: 'bg-transparent text-[#10B981] hover:bg-[#D1FAE5]',
    }

    const roundness = {
      full: 'rounded-full',
      lg: 'rounded-lg',
      md: 'rounded-md',
    }

    const sizes = {
      sm: 'px-[14px] py-[8px] text-xs',
      md: 'px-[20px] py-[12px] text-sm',
    }

    const isDisabled = disabled || isLoading

    return (
      <button
        className={cn(baseStyles, variants[variant], roundness[activeRounded], sizes[size], className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
