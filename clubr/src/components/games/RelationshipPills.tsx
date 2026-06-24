import { cn } from '@/lib/utils/cn'
import { relationshipPills, type Relationship } from '@/games/gameRelationship'

// No per-pill icons — colour conveys the category and keeps the row compact. Each
// pill carries a `tip` (what it does, as a tooltip + aria), an active style, and a
// RESTING tint so the row reads as colour-coded categories even before you tap one:
//   • New      — the actionable pill: bold-italic, stands out at rest, count as a RED
//                attention badge. In the GOLDEN skin it goes chip-gold (on-brand).
//   • Playing  — emerald (you're in it) · Hosting — purple (you run it).
//   • Finished — amber (terminal); in the GOLDEN skin → DEEP gold so it stays distinct
//                from New's bright gold (amber == gold there) and reads as "archived".
// `gold*` variants apply only when `golden` is set (the gold tokens exist only in the
// Golden/Engine skins); every other skin uses the default accent + auto-remapped vars.
const META: Record<Relationship, { label: string; active: string; rest: string; goldActive?: string; goldRest?: string; tip: string }> = {
  available: {
    label: 'New', tip: 'New games you can still join',
    active: 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40',
    rest: 'border-accent-blue/40 text-accent-blue',
    goldActive: 'border-accent-gold bg-accent-gold/20 text-accent-gold ring-1 ring-accent-gold/40',
    goldRest: 'border-accent-gold/50 text-accent-gold',
  },
  playing: {
    label: 'Playing', tip: "Games you're playing in",
    active: 'border-accent-emerald bg-accent-emerald/20 text-accent-emerald ring-1 ring-accent-emerald/40',
    rest: 'border-accent-emerald/30 text-accent-emerald/90',
  },
  hosting: {
    label: 'Hosting', tip: 'Games you run',
    active: 'border-accent-purple bg-accent-purple/20 text-accent-purple ring-1 ring-accent-purple/40',
    rest: 'border-accent-purple/30 text-accent-purple/90',
  },
  finished: {
    label: 'Finished', tip: 'Completed & cancelled games',
    active: 'border-accent-amber bg-accent-amber/20 text-accent-amber ring-1 ring-accent-amber/40',
    rest: 'border-accent-amber/30 text-accent-amber/80',
    goldActive: 'border-accent-gold-deep bg-accent-gold-deep/20 text-accent-gold-deep ring-1 ring-accent-gold-deep/40',
    goldRest: 'border-accent-gold-deep/40 text-accent-gold-deep/90',
  },
}

/**
 * Relationship filter for a games list: New · Playing · Hosting · Finished (Hosting
 * only for hosts/admins; Finished hidden until there's history). Composes with the
 * type-filter chips. Counts let the user see how many are in each bucket; the New
 * count is a red badge to pull the eye to joinable games. `golden` (the active skin
 * is Golden) re-tones New → chip-gold and Finished → deep gold.
 */
export function RelationshipPills({
  value, onChange, isHost, counts, hideEmpty, golden = false,
}: {
  value: Relationship
  onChange: (r: Relationship) => void
  isHost: boolean
  counts?: Partial<Record<Relationship, number>>
  /** When set, render ONLY the pills that have data (count > 0). Opt-in so other
   *  callers (e.g. club detail) keep showing every pill. */
  hideEmpty?: boolean
  /** Active skin is Golden → use the chip-gold palette for New/Finished. */
  golden?: boolean
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
        const activeCls = golden && m.goldActive ? m.goldActive : m.active
        const restCls = golden && m.goldRest ? m.goldRest : m.rest
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            title={m.tip}
            onClick={() => onChange(r)}
            className={cn('shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors', active ? activeCls : restCls)}
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
