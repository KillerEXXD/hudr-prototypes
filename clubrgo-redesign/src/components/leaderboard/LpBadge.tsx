import { Trophy } from 'lucide-react'

/** "+N LP" — leaderboard points a finisher earned toward the club board.
 *  Renders nothing when no points were awarded. */
export function LpBadge({ points, className }: { points: number; className?: string }) {
  if (!points) return null
  return (
    <span
      title="Leaderboard points earned toward this club's board"
      className={`inline-flex items-center gap-0.5 rounded-md bg-accent-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-amber ${className ?? ''}`}
    >
      <Trophy className="h-2.5 w-2.5" />+{points} LP
    </span>
  )
}
