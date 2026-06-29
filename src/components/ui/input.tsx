import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, placeholder, ...props }, ref) => {
    const hasError = !!error
    const errorMessage = typeof error === 'string' ? error : undefined

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[#111827] mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[14px] py-[10px] text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-2 focus:border-[#10B981] focus:px-[13px] focus:py-[9px]",
            hasError && "border-2 border-[#EF4444] px-[13px] py-[9px] focus:border-[#EF4444]",
            className
          )}
          ref={ref}
          {...props}
        />
        {errorMessage && (
          <span className="block mt-1 text-xs text-[#EF4444] font-medium">
            {errorMessage}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
