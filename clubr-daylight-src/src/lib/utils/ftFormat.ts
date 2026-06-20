// Shared formatting helpers for the FT Fantasy (Stack Draft) feature.
import type { FTPlayer } from '@/types/ft'

/** 38000 -> "38k" */
export const fmtK = (n: number) => `${Math.round(n / 1000)}k`

/** 9500000 -> "9,500,000" */
export const fmtChips = (n: number) => n.toLocaleString('en-US')

/** 1150000 -> "$1.15M", 235000 -> "$235k" */
export function fmtCash(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

/** "Daniel Negreanu" — full name, falling back to the legacy surname. */
export const playerFull = (p?: FTPlayer) => (p ? (p.first && p.last ? `${p.first} ${p.last}` : p.name) : '—')

/** "Daniel N." — first name + last initial, for compact pick lists. */
export const playerShort = (p?: FTPlayer) => (p ? (p.first && p.last ? `${p.first} ${p.last[0]}.` : p.name) : '—')

/** Map a list of seat ids to their short player names: ['B','D'] -> "Justin B. · Fedor H." */
export function picksToNames(picks: string[], players: FTPlayer[], sep = ' · '): string {
  return picks.map((seat) => playerShort(players.find((p) => p.seat === seat))).join(sep)
}
