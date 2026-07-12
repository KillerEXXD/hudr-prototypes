import { Trophy } from 'lucide-react'
import { Avatar, Section } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import type { SquaresGameView, SquaresPeriod } from '@/types/squares'

const ORDER = ['Q1', 'Q2', 'Q3', 'Final']

/**
 * Quarter winner cards — the prominent results display for a Football Squares
 * game. One tile per quarter (Final emphasized) showing the score, the WINNING
 * SQUARE pulled out as the owner's avatar + big initials, the winner's name, and
 * the Stakes that square won. Renders for a LIVE game as scores come in; once the
 * game is COMPLETED, the richer per-quarter `SquaresQuarterCards` is the single
 * source of truth, so this redundant strip is hidden there.
 */
export function SquaresResults({ g }: { g: SquaresGameView }) {
  const anyScored = g.periods.some((p) => p.homeScore != null)
  if (g.status === 'registration' || g.status === 'completed' || !anyScored) return null
  const periods = [...g.periods].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label))
  const pool = g.stake * g.claimedCount

  const winnerOf = (p: SquaresPeriod) => {
    if (p.winnerCell == null || !p.winnerUserId) return null
    const cell = g.cells[p.winnerCell]
    const fallback = g.participants.find((x) => x.userId === p.winnerUserId)
    return { name: cell?.name ?? fallback?.name ?? 'Winner', color: cell?.avatarColor ?? fallback?.avatarColor }
  }

  return (
    <Section title="Results">
      <div className="flex gap-2">
        {periods.map((p) => {
          const final = p.label === 'Final'
          const scored = p.homeScore != null
          const w = winnerOf(p)
          const amt = Math.round((pool * p.pct) / 100)
          return (
            <div key={p.label} className={cn('flex flex-1 min-w-0 flex-col items-center rounded-xl border p-2 text-center', final ? 'border-accent-amber/60 bg-accent-amber/10 ring-1 ring-accent-amber/40' : 'border-border bg-bg-card')}>
              <span className={cn('flex items-center gap-0.5 text-[10px] font-extrabold uppercase tracking-wide', final ? 'text-accent-amber' : 'text-text-muted')}>
                {final && <Trophy className="h-3 w-3" />}{p.label === 'Final' ? 'Q4' : p.label}
              </span>
              {scored ? (
                <>
                  <p className="mt-0.5 font-mono text-sm font-extrabold tabular-nums text-text-primary">{p.homeScore}<span className="text-text-muted">–</span>{p.awayScore}</p>
                  {w ? (
                    <>
                      <div className="mt-1"><Avatar name={w.name} color={w.color} size={final ? 42 : 34} /></div>
                      <span className="mt-1 max-w-full truncate text-[11px] font-semibold text-text-primary">{w.name}</span>
                      {amt > 0 && <span className="font-mono text-[10px] font-bold text-accent-emerald">+{amt.toLocaleString('en-US')}</span>}
                    </>
                  ) : (
                    <p className="mt-2 text-[10px] leading-tight text-text-muted">No winner<br />(empty square)</p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-[10px] leading-tight text-text-muted">Awaiting<br />score</p>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-text-muted">{g.homeTeam} score <span className="text-text-muted">–</span> {g.awayTeam} score · the square at those last-digits wins. Settled offline.</p>
    </Section>
  )
}
