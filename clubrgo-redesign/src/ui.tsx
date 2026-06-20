import type { ReactNode } from 'react'

// Shared design language for the ClubrGo redesign prototype.
// Dark, premium "poker-night" feel; one sky primary + semantic accents.

export type GType = 'ft' | 'll' | 'sq'

export const TYPE: Record<GType, { label: string; emoji: string; ring: string; chip: string; glow: string; dot: string }> = {
  ft: { label: 'FT Fantasy',       emoji: '🃏', ring: 'ring-violet-500/25',  chip: 'bg-violet-500/15 text-violet-300',   glow: 'from-violet-500/10',  dot: 'bg-violet-400' },
  ll: { label: 'Last Longer',      emoji: '⏳', ring: 'ring-amber-500/25',   chip: 'bg-amber-500/15 text-amber-300',     glow: 'from-amber-500/10',   dot: 'bg-amber-400' },
  sq: { label: 'Football Squares', emoji: '🏈', ring: 'ring-emerald-500/25', chip: 'bg-emerald-500/15 text-emerald-300', glow: 'from-emerald-500/10', dot: 'bg-emerald-400' },
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${className}`}>{children}</span>
}

export function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${active ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50' : 'bg-white/5 text-zinc-400 ring-1 ring-white/5 hover:text-zinc-200'}`}>{children}</button>
  )
}

export function Card({ children, className = '', accent }: { children: ReactNode; className?: string; accent?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-lg ${accent ?? ''} ${className}`}>{children}</div>
  )
}

export const STATUS = {
  open:      'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  running:   'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  completed: 'bg-zinc-700/40 text-zinc-300 ring-1 ring-white/10',
} as const

export function PrimaryBtn({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`rounded-full bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition active:scale-95 hover:bg-sky-400 ${className}`}>{children}</button>
}
