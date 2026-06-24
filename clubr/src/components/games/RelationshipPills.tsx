import { cn } from '@/lib/utils/cn'
import { relationshipPills, type Relationship } from '@/games/gameRelationship'

// No per-pill icons — colour conveys the category and keeps the row compact. Each
// pill carries a `tip` (what it does, as a tooltip + aria) and a resting style.
//   • New      — the actionable pill: it's the ONLY one styled to stand out at rest
//                (bold-italic + a subtle blue outline) and the ONLY one whose count
//                shows as a RED attention badge ("you have N new games to look at").
//   • Playing / Hosting / Finished — quiet at rest; count as a low-key "(n)".
const META: Record<Relationship, { label: string; active: string; rest: string; tip: string }> = {
  available: { label: 'New', active: 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40', rest: 'border-accent-blue/40 text-accent-blue', tip: 'New games you can still join' },
  playing: { label: 'Playing', active: 'border-accent-emerald bg-accent-emerald/20 text-accent-emerald ring-1 ring-accent-emerald/40', rest: 'border-border text-text-secondary', tip: "Games you're playing in" },
  hosting: { label: 'Hosting', active: 'border-accent-purple bg-accent-purple/20 text-accent-purple ring-1 ring-accent-purple/40', rest: 'border-border text-text-secondary', tip: 'Games you run' },
  finished: { label: 'Finished', active: 'border-accent-amber bg-accent-amber/20 text-accent-amber ring-1 ring-accent-amber/40', rest: 'border-border text-text-secondary', tip: 'Completed & cancelled games' },
}

/**
 * Relationship filter for a games list: New · Playing · Hosting · Finished (Hosting
 * only for hosts/admins; Finished hidden until there's history). Composes with the
 * type-filter chips. Counts let the user see how many are in each bucket; the New
 * count is a red badge to pull the eye to joinable games.
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
  // Always hide the terminal 'Finished' pill when there's nothing finished (it's
  // noise on a fresh club). Other pills follow the opt-in `hideEmpty`.
  const pills = relationshipPills(isHost)
    .filter((r) => r !== 'finished' || (counts?.finished ?? 0) > 0)
    .filter((r) => !hideEmpty || (counts?.[r] ?? 0) > 0)
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter games by your relationship">
      {pills.map((r) => {
        const m = META[r]
        const n = counts?.[r]
        const active = value === r
        const isNew = r === 'available'
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            title={m.tip}
            onClick={() => onChange(r)}
            className={cn('shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors', active ? m.active : m.rest)}
          >
            {isNew ? (
              <>
                <span className="font-extrabold italic">{m.label}</span>
                {typeof n === 'number' && n > 0 && (
                  <span
                    className="ml-1 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-accent-red px-1 py-px align-middle text-[10px] font-bold leading-none tabular-nums text-white"
                    aria-label={`${n} new`}
                  >
                    {n}
                  </span>
                )}
              </>
            ) : (
              <>{m.label}{typeof n === 'number' ? ` (${n})` : ''}</>
            )}
          </button>
        )
      })}
    </div>
  )
}
