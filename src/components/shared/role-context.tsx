'use client'

import React, { createContext, useContext } from 'react'

export interface RoleStyle {
  rounded: 'full' | 'lg' | 'md'
  shadow: 'md' | 'sm' | 'none'
  spacing: 'loose' | 'normal' | 'dense'
  role: 'tu' | 'koordinator' | 'pengampu' | 'orang_tua' | 'kepsek'
}

const RoleStyleContext = createContext<RoleStyle | null>(null)

export function RoleStyleProvider({
  children,
  role,
}: {
  children: React.ReactNode
  role: 'tu' | 'koordinator' | 'pengampu' | 'orang_tua' | 'kepsek'
}) {
  const styles: Record<typeof role, RoleStyle> = {
    tu: {
      rounded: 'md',
      shadow: 'none',
      spacing: 'dense',
      role: 'tu',
    },
    koordinator: {
      rounded: 'lg',
      shadow: 'sm',
      spacing: 'normal',
      role: 'koordinator',
    },
    pengampu: {
      rounded: 'full',
      shadow: 'md',
      spacing: 'loose',
      role: 'pengampu',
    },
    orang_tua: {
      rounded: 'full',
      shadow: 'md',
      spacing: 'loose',
      role: 'orang_tua',
    },
    kepsek: {
      rounded: 'lg',
      shadow: 'sm',
      spacing: 'normal',
      role: 'kepsek',
    },
  }

  return (
    <RoleStyleContext.Provider value={styles[role]}>
      {children}
    </RoleStyleContext.Provider>
  )
}

export function useRoleStyle() {
  return useContext(RoleStyleContext)
}
