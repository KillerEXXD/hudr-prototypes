import type { ReactNode } from 'react'
import { Layers, Clock, LayoutGrid, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GameType } from '@/types'

// Per-game-type identity (colour + icon), token-driven so it's one consistent skin.
export const TYPE: Record<GameType, { label: string; icon: LucideIcon; text: string; bg: string; ring: string; glow: string }> = {
  ft: { label: 'FT Fantasy', icon: Layers, text: 'text-accent-violet', bg: 'bg-accent-violet/15', ring: 'ring-accent-violet/25', glow: 'from-accent-violet/10' },
  ll: { label: 'Last Longer', icon: Clock, text: 'text-accent-amber', bg: 'bg-accent-amber/15', ring: 'ring-accent-amber/25', glow: 'from-accent-amber/10' },
  sq: { label: 'Football Squares', icon: LayoutGrid, text: 'text-accent-emerald', bg: 'bg-accent-emerald/15', ring: 'ring-accent-emerald/25', glow: 'from-accent-emerald/10' },
}

export const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Registration open', cls: 'bg-accent-blue/15 text-accent-blue ring-1 ring-accent-blue/30' },
  running: { label: 'Running', cls: 'bg-accent-emerald/15 text-accent-emerald ring-1 ring-accent-emerald/30' },
  completed: { label: 'Completed', cls: 'bg-bg-surface text-text-secondary ring-1 ring-border' },
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-bg-card shadow-lg', className)}>{children}</div>
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold', className)}>{children}</span>
}

export function PrimaryBtn({ children, onClick, className, type = 'button' }: { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} className={cn('rounded-full bg-accent-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-blue/25 transition active:scale-95 hover:brightness-110', className)}>{children}</button>
  )
}
