import { Crown } from 'lucide-react'
import { Avatar } from '@/components/common/ui'
import { LpBadge } from '@/components/leaderboard/LpBadge'

// =====================================================================
// ChampionCard — the shared winner-celebration card used by the game
// types. Pulsing gold border + avatar + name + optional stats (points /
// LP / Stakes won) + optional pick chips (FT only). Honors
// prefers-reduced-motion.
//
// Used as a building block. Each game type wraps it with its own
// game-specific copy (title, subtitle, picks).
// =====================================================================

const fmtS = (n: number) => n.toLocaleString('en-US')

export interface ChampionPick {
  seat: string
  label: string
  finish: number | null
}

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

/** A muted "·" separator for the one-line stat header (name · pts · LP · stakes). */
function Dot() { return <span aria-hidden="true" className="text-text-muted">·</span> }

export function ChampionCard({
  title,
  subtitle,
  name,
  avatarColor,
  isMe,
  points,
  pointsLabel = 'pts',
  lpPoints,
  lpReason,
  prizeStakes,
  picks,
}: {
  /** Header label inside the gold pill — e.g. 'Squares Champion'. */
  title: string
  /** Optional second-line context — e.g. 'Won Q4'. */
  subtitle?: string
  name: string
  avatarColor: string
  isMe?: boolean
  /** Primary numeric stat shown next to the name (e.g. fantasy points). Omit if not applicable. */
  points?: number
  pointsLabel?: string
  lpPoints?: number
  /** When LP is 0 because the field was too small, the explanation shown behind a pulsing "?". */
  lpReason?: string
  prizeStakes?: number
  /** FT only: the entrant's picks with their actual finish in the tournament. */
  picks?: ChampionPick[]
}) {
  return (
    <div data-testid="champion" className="relative overflow-hidden rounded-2xl border border-accent-amber/50 bg-gradient-to-br from-accent-amber/25 via-accent-amber/10 to-bg-card p-4 motion-safe:animate-pulse motion-reduce:animate-none [animation-duration:3s]">
      <span aria-hidden="true" className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:14px_14px]" />
      <div className="relative mb-1.5 inline-flex items-center gap-1 rounded-full bg-accent-amber/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-amber">
        <Crown className="h-3 w-3" />{title}
      </div>
      <div className="relative flex items-center gap-3">
        <Avatar name={name} color={avatarColor} size={44} />
        <div className="min-w-0 flex-1">
          {/* One line — name · pts · LP · stakes (a "·" only between present items),
              identical to the entrant/standings cards so the whole table reads alike.
              No wrap: the stats stay on the line; only the name truncates if it must. */}
          <div className="flex items-center gap-x-1.5 text-xs">
            <span className="min-w-0 shrink truncate text-sm font-extrabold text-text-primary">{name}{isMe && <span className="ml-1 text-[11px] text-accent-blue">(you)</span>}</span>
            {points != null && <><Dot /><span className="shrink-0 font-mono font-bold text-accent-purple">{points} {pointsLabel}</span></>}
            {lpPoints ? <><Dot /><LpBadge className="shrink-0" points={lpPoints} reason={lpReason} /></> : null}
            {prizeStakes != null && prizeStakes > 0 && <><Dot /><span className="shrink-0 font-mono font-extrabold text-accent-emerald">+{fmtS(prizeStakes)} Stakes</span></>}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {picks && picks.length > 0 && (
        <div className="relative mt-2.5">
          {/* "Picks" label makes clear the four names below are this entrant's drafted
              players (not the standings). FT-only: no other game type passes `picks`. */}
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-text-muted">Picks</p>
          {/* 2 picks per row, 2 rows — every pick stays visible (no truncated single line). */}
          <div className="grid grid-cols-2 gap-1.5">
            {picks.map((p) => (
              <span key={p.seat} className="inline-flex items-center gap-1 rounded-md bg-bg-surface/70 px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                <span className="truncate text-text-primary">{p.label}</span>
                {p.finish && <span className="ml-auto shrink-0 font-mono text-accent-amber">— {ordinal(p.finish)}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
