import { Trophy, Crown, Medal, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/common/ui'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import { cn } from '@/lib/utils/cn'
import type { SquaresGameView } from '@/types/squares'
import { computeSquaresPayouts, type PerPeriodPayout } from '@/lib/squaresPayouts'

// Quarters in importance order — the Final is the headline, so cards read
// Final → Q3 → Q2 → Q1. Mirrors the payout/LP weighting (Final ≈70% ≫ a regular
// quarter ≈10%).
const ORDER = ['Final', 'Q3', 'Q2', 'Q1']

// Per-quarter visual tier: Final = gold + crown (celebrated), Q3 = silver, Q2 =
// bronze, Q1 = base. Prominence falls Final > Q3 > Q2 > Q1 to match the payout weight.
const TIER: Record<string, { Icon: typeof Trophy; pill: string; ring: string }> = {
  Final: { Icon: Crown, pill: 'bg-accent-gold/20 text-accent-gold', ring: 'border-accent-gold/50 bg-accent-gold/[0.08] ring-1 ring-accent-gold/40' },
  Q3: { Icon: Medal, pill: 'bg-slate-300/15 text-slate-300', ring: 'border-slate-300/30 bg-slate-300/[0.05]' },
  Q2: { Icon: Medal, pill: 'bg-amber-700/25 text-amber-600', ring: 'border-amber-700/30 bg-amber-700/[0.05]' },
  Q1: { Icon: Trophy, pill: 'bg-text-muted/10 text-text-muted', ring: 'border-border bg-bg-card/40' },
}
const tierOf = (label: string) => TIER[label] ?? TIER.Q1

/**
 * The per-quarter breakdown for a COMPLETED Football-Squares game — a clean stacked
 * list (Final first, celebrated) where EVERY quarter is self-contained: the real
 * score, the winning square's last-digits, and either the winner (avatar + LP + the
 * stakes they won) or "no one won → rolled to the next quarter / split among winners".
 *
 * This is the single source of truth for quarter results (the old separate "Results"
 * strip is redundant on a finished game and is hidden there). The OVERALL champion
 * banner is the shared `ChampionCard`, rendered by the page above this list.
 */
export function SquaresQuarterCards({ g, userId, lpByUser }: { g: SquaresGameView; userId?: string; lpByUser?: Map<string, number> }) {
  const payouts = computeSquaresPayouts(g)
  // computeSquaresPayouts returns periods chronologically (Q1→Final); show by importance.
  const cards = [...payouts.perPeriod].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label))

  return (
    <div className="mt-3 flex flex-col gap-2">
      {cards.map((row) => (
        <QuarterCard key={row.label} row={row} g={g} userId={userId} lpByUser={lpByUser} charityName={payouts.charityName} />
      ))}
    </div>
  )
}

function QuarterCard({ row, g, userId, lpByUser, charityName }: { row: PerPeriodPayout; g: SquaresGameView; userId?: string; lpByUser?: Map<string, number>; charityName: string | null }) {
  const t = tierOf(row.label)
  const isFinal = row.label === 'Final'
  const winner = row.winner
  const isMe = winner?.userId === userId
  const periodRaw = g.periods.find((p) => p.label === row.label)
  const scored = periodRaw != null && periodRaw.homeScore != null && periodRaw.awayScore != null
  const lp = winner ? lpByUser?.get(winner.userId) : undefined
  // The winning square is the cell at each team's last score digit.
  const homeDigit = scored ? (periodRaw!.homeScore! % 10) : null
  const awayDigit = scored ? (periodRaw!.awayScore! % 10) : null
  // Celebrate the Final winner: gold gradient + sparkle accents.
  const celebrate = isFinal && !!winner

  return (
    <div
      data-testid={`sq-quarter-${row.label}`}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-3',
        winner ? t.ring : 'border-border bg-bg-card/40',
        celebrate && 'bg-gradient-to-br from-accent-gold/20 via-accent-gold/[0.06] to-bg-card ring-1 ring-accent-gold/50',
      )}
    >
      {celebrate && (
        <>
          {/* soft gold glow + sparkle — the Final is the headline result */}
          <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-gold/25 blur-2xl" />
          <Sparkles aria-hidden className="absolute right-2.5 top-2.5 h-4 w-4 text-accent-gold motion-safe:animate-pulse" />
        </>
      )}

      {/* Header: quarter badge + (stakes won, when there's a winner) */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide', t.pill)}>
          <t.Icon className="h-3.5 w-3.5" />{isFinal ? 'Q4' : row.label}
        </span>
        {winner && (
          <span className="flex items-center gap-1 font-mono text-xs font-bold text-accent-emerald" title={row.rolloverIn > 0 ? `${row.basePrize.toLocaleString()} base + ${row.rolloverIn.toLocaleString()} rolled in` : 'Stakes won'}>
            +{row.actualPrize.toLocaleString()}{row.rolloverIn > 0 && <ArrowRight className="h-3 w-3" />}
          </span>
        )}
      </div>

      {scored ? (
        <>
          {/* The real score + the winning square (last-digits) */}
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-bold text-text-primary">
              {g.homeTeam} <span className="font-mono tabular-nums">{periodRaw!.homeScore}</span>
              <span className="mx-1 text-text-muted">–</span>
              <span className="font-mono tabular-nums">{periodRaw!.awayScore}</span> {g.awayTeam}
            </p>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-text-muted">
              <span className="uppercase tracking-wide">square</span>
              <span className="rounded bg-bg-surface px-1 font-mono font-bold text-text-secondary">{homeDigit}</span>
              <span>·</span>
              <span className="rounded bg-bg-surface px-1 font-mono font-bold text-text-secondary">{awayDigit}</span>
            </span>
          </div>

          <div className="my-2 border-t border-border/60" />

          {winner ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={winner.name} color={winner.avatarColor} size={celebrate ? 34 : 28} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{winner.name}{isMe && <span className="font-normal text-text-muted"> (you)</span>}</p>
                  <p className="text-[10px] font-semibold text-text-muted">
                    {celebrate ? 'Won Q4' : 'Won this quarter'}
                    {row.rolloverIn > 0 && <span className="text-accent-emerald"> · +{row.rolloverIn.toLocaleString()} rolled in</span>}
                  </p>
                </div>
              </div>
              {lp ? <LpBadge points={lp} /> : null}
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
              <span className="text-text-muted">No one won —</span> {unclaimedDestination(row, charityName)}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-[11px] text-text-muted">Not played yet</p>
      )}

      {/* Cross-game rollover: pools carried INTO this Final from earlier finished
          games (with a link back to each). Part of the Final's prize above. */}
      {isFinal && (g.rolledOverFrom?.length ?? 0) > 0 && (
        <div className="mt-2 border-t border-border/60 pt-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Rolled in from</p>
          {g.rolledOverFrom!.map((r) => (
            <Link key={r.gameId} to={`/squares/${r.gameId}`} className="mt-0.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-accent-blue hover:underline">
              <span className="min-w-0 truncate">{r.title}</span>
              <span className="shrink-0 font-mono text-accent-emerald">+{r.amount.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/** Where an unwon quarter's prize went. Under Rollover, unwon Q1–Q3 feed the Final;
 *  an unwon Final carries to the next game. */
function unclaimedDestination(row: PerPeriodPayout, charityName: string | null): string {
  const amt = row.unclaimedAmount.toLocaleString()
  switch (row.unclaimedTo) {
    case 'rollover': return `${amt} rolled to Q4`
    case 'nextGame': return `${amt} rolled over to the next game's Q4 — contact host`
    case 'split':    return `${amt} split among the other winners`
    case 'refund':   return `${amt} refunded pro-rata`
    case 'charity':  return `${amt} → ${charityName ?? 'charity'}`
    default:         return `${amt} unclaimed`
  }
}
