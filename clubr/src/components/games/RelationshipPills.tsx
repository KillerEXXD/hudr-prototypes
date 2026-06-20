import { cn } from '@/lib/utils/cn'
import { relationshipPills, type Relationship } from '@/games/gameRelationship'

// No per-pill icons — the active color + ring conveys the category and keeps the
// row compact (matches the club-detail status pills).
const META: Record<Relationship, { label: string; active: string }> = {
  available: { label: 'Available', active: 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' },
  playing: { label: 'Playing', active: 'border-accent-emerald bg-accent-emerald/20 text-accent-emerald font-bold ring-1 ring-accent-emerald/40' },
  hosting: { label: 'Hosting', active: 'border-accent-purple bg-accent-purple/20 text-accent-purple font-bold ring-1 ring-accent-purple/40' },
}

/**
 * Relationship filter for a games list: Available · Playing · Hosting (Hosting only
 * for hosts/admins). Composes with the type-filter chips. Counts let the user see
 * how many are in each bucket without switching.
 */
export function RelationshipPills({
  value, onChange, isHost, counts, hideEmpty,
}: {
  value: Relationship
  onChange: (r: Relationship) => void
  isHost: boolean
  counts?: Partial<Record<Relationship, number>>
  /** When set, render ONLY the pills that have data (count > 0). Opt-in so other
   *  callers (e.g. club detail) keep showing every pill. */
  hideEmpty?: boolean
}) {
  const pills = relationshipPills(isHost).filter((r) => !hideEmpty || (counts?.[r] ?? 0) > 0)
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter games by your relationship">
      {pills.map((r) => {
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
            className={cn('shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? m.active : 'border-border font-semibold text-text-secondary')}
          >
            {m.label}{typeof n === 'number' ? ` (${n})` : ''}
          </button>
        )
      })}
    </div>
  )
}
