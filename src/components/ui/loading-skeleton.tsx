import React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
}

export function LoadingSkeleton({ width, height, className, style, ...props }: LoadingSkeletonProps) {
  const customStyle: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  }

  return (
    <div
      className={cn("animate-pulse-bg rounded-md bg-[#F3F4F6]", className)}
      style={customStyle}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="border border-[#E5E7EB] p-4 rounded-lg space-y-3 bg-white">
      <LoadingSkeleton className="h-6 w-1/3" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4 bg-white">
      <div className="flex space-x-4">
        <LoadingSkeleton className="h-8 w-1/4" />
        <LoadingSkeleton className="h-8 w-1/4" />
        <LoadingSkeleton className="h-8 w-1/4" />
        <LoadingSkeleton className="h-8 w-1/4" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
