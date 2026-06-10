import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtChips(n: number | null | undefined): string {
  if (n == null) return '\u2014'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n
}

export function fmtCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function statColor(v: number): string {
  if (v >= 55) return 'text-accent-emerald'
  if (v >= 30) return 'text-accent-amber'
  return 'text-accent-red'
}
