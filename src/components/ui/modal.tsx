import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = originalOverflow
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Trap focus logic
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElementsString =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const modalElement = modalRef.current
    const focusableElements = Array.from(
      modalElement.querySelectorAll<HTMLElement>(focusableElementsString)
    )

    const firstFocusableElement = focusableElements[0]
    const lastFocusableElement = focusableElements[focusableElements.length - 1]

    if (firstFocusableElement) {
      firstFocusableElement.focus()
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement?.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement?.focus()
          e.preventDefault()
        }
      }
    }

    modalElement.addEventListener('keydown', handleFocusTrap)
    return () => {
      modalElement.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white w-full rounded-xl shadow-xl border border-[#E5E7EB] p-6 flex flex-col max-h-[90vh] transition-transform duration-300 transform scale-100",
          sizeStyles[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] mb-4">
          {title ? (
            <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  )
}
