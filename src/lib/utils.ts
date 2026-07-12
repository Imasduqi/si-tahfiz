import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function getTodayString(): string {
  const now = new Date()
  // Convert to WIB (UTC+7) explicitly rather than relying on server/browser local timezone,
  // since this must be consistent whether running on a server (which may be UTC) or a
  // user's browser (which may be in any timezone if they're traveling, etc.)
  const wibOffset = 7 * 60 // minutes
  const wibDate = new Date(now.getTime() + wibOffset * 60 * 1000)

  const year = wibDate.getUTCFullYear()
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(wibDate.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6 // bukan Ahad dan Sabtu
}

export function phoneToEmail(nomorHP: string): string {
  return `${nomorHP}@ortu.sitahfiz`
}

export function formatDateWithDay(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}
