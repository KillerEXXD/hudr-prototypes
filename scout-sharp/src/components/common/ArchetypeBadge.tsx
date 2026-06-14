import type { Archetype } from '@/engine'
import { cn } from '@/lib/utils'

const META: Record<Archetype, { emoji: string; tint: string; plain: string }> = {
  TAG: { emoji: '🎯', tint: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/30', plain: 'Tight & Aggressive' },
  LAG: { emoji: '🔥', tint: 'text-accent-red bg-accent-red/10 border-accent-red/30', plain: 'Loose & Aggressive' },
  Nit: { emoji: '🧊', tint: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30', plain: 'Super Tight' },
  'Calling Station': { emoji: '📞', tint: 'text-accent-amber bg-accent-amber/10 border-accent-amber/30', plain: 'Calls Too Much' },
  Maniac: { emoji: '🌪️', tint: 'text-accent-purple bg-accent-purple/10 border-accent-purple/30', plain: 'Wild & Aggressive' },
  'Passive Fish': { emoji: '🐟', tint: 'text-accent-blue bg-accent-blue/10 border-accent-blue/30', plain: 'Loose & Passive' },
  UNCLASSIFIED: { emoji: '❓', tint: 'text-text-muted bg-bg-surface border-border', plain: 'No clear type' },
}

export default function ArchetypeBadge({ archetype, plain = false, size = 'md', className }: {
  archetype: Archetype; plain?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string
}) {
  const m = META[archetype]
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border font-semibold', m.tint, sizes[size], className)}>
      <span aria-hidden>{m.emoji}</span>
      {plain ? m.plain : archetype}
    </span>
  )
}

export function archetypePlain(archetype: Archetype): string { return META[archetype].plain }
