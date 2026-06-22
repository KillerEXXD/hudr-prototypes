import { Trophy } from 'lucide-react'
import { useState } from 'react'

/**
 * "+N LP" — leaderboard points a finisher earned toward the club board.
 *
 * - points > 0  → the amber "+N LP" badge.
 * - points 0/undefined WITH a `reason` → a muted "0 LP" + a pulsing "?" that taps
 *   open a short explanation (e.g. heads-up / too-few-players games don't score).
 *   Tap-toggled so it works on touch (no hover dependency).
 * - points 0/undefined and NO reason → renders nothing (unchanged).
 */
export function LpBadge({ points, reason, className }: { points?: number; reason?: string; className?: string }) {
  const [open, setOpen] = useState(false)

  if (points && points > 0) {
    return (
      <span
        title="Leaderboard points earned toward this club's board"
        className={`inline-flex items-center gap-0.5 rounded-md bg-accent-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-amber ${className ?? ''}`}
      >
        <Trophy className="h-2.5 w-2.5" />+{points} LP
      </span>
    )
  }

  if (!reason) return null

  return (
    <span className={`relative inline-flex items-center gap-1 ${className ?? ''}`}>
      <span className="inline-flex items-center gap-0.5 rounded-md bg-text-muted/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-muted">
        <Trophy className="h-2.5 w-2.5" />0 LP
      </span>
      <button
        type="button"
        aria-label="Why 0 leaderboard points?"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="animate-pulse-soft flex h-4 w-4 items-center justify-center rounded-full bg-accent-blue/20 text-[9px] font-bold text-accent-blue cursor-pointer"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="animate-fade-up absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-border bg-bg-card px-2.5 py-2 text-left text-[11px] font-normal leading-snug text-text-secondary shadow-lg"
        >
          {reason}
        </span>
      )}
    </span>
  )
}
