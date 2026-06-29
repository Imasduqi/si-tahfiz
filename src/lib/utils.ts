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
  return new Date().toISOString().split('T')[0]
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6 // bukan Ahad dan Sabtu
}

export function phoneToEmail(nomorHP: string): string {
  return `${nomorHP}@ortu.sitahfiz`
}
