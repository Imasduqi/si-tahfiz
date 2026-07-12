"use client"
import React from 'react'
import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          error: 'bg-red-50 text-red-800 border border-red-200',
          warning: 'bg-amber-50 text-amber-800 border border-amber-200',
          info: 'bg-blue-50 text-blue-800 border border-blue-200',
        }
      }}
    />
  )
}
