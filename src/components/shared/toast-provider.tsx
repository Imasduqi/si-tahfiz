"use client"
import React from 'react'
import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0'
        }
      }}
    />
  )
}
