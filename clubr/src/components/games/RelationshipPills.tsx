import { Ticket, Gamepad2, Crown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { relationshipPills, type Relationship } from '@/games/gameRelationship'

const META: Record<Relationship, { label: string; icon: LucideIcon; active: string }> = {
  available: { label: 'Available', icon: Ticket, active: 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' },
  playing: { label: 'Playing', icon: Gamepad2, active: 'border-accent-emerald bg-accent-emerald/20 text-accent-emerald font-bold ring-1 ring-accent-emerald/40' },
  hosting: { label: 'Hosting', icon: Crown, active: 'border-accent-purple bg-accent-purple/20 text-accent-purple font-bold ring-1 ring-accent-purple/40' },
}

/**
 * Relationship filter for a games list: Available · Playing · Hosting (Hosting only
 * for hosts/admins). Composes with the type-filter chips. Counts let the user see
 * how many are in each bucket without switching.
 */
export function RelationshipPills({
  value, onChange, isHost, counts,
}: {
  value: Relationship
  onChange: (r: Relationship) => void
  isHost: boolean
  counts?: Partial<Record<Relationship, number>>
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter games by your relationship">
      {relationshipPills(isHost).map((r) => {
        const m = META[r]
        const n = counts?.[r]
        const active = value === r
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r)}
            className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? m.active : 'border-border font-semibold text-text-secondary')}
          >
            <m.icon className="h-3 w-3" />{m.label}{typeof n === 'number' ? ` (${n})` : ''}
          </button>
        )
      })}
    </div>
  )
}
