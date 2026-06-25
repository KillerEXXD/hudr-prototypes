import { Crown, Coins } from 'lucide-react'
import type { FTContestView } from '@/types/ft'
import { FINISH_POINTS } from '@/types/ft'
import { Avatar, Badge, Card, Section } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { picksToNames, playerFull } from '@/lib/utils/ftFormat'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { awardMap, ftAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { LpBadge } from '@/components/leaderboard/LpBadge'

// Split a pot 50 / 30 / 20 across the top three (remainder to 3rd so it sums exact).
function splitPot(pot: number): number[] {
  const a = Math.round(pot * 0.5)
  const b = Math.round(pot * 0.3)
  return [a, b, pot - a - b]
}

// Settled-contest result: prize pot, the winner (or podium), and the full
// leaderboard. Format-aware — 'winner_takes_all' pays only 1st; 'points' splits
// the pot across the top three. Scores still rank the table either way.
export function SettledResult({ c, meId }: { c: FTContestView; meId?: string }) {
  const entries = [...c.entries].filter((e) => e.status === 'approved').sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const wta = c.format === 'winner_takes_all'
  const pot = c.stake * entries.length
  const split = splitPot(pot)
  const prizeFor = (i: number) => (wta ? (i === 0 ? pot : 0) : split[i] ?? 0)
  const winner = entries[0]
  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`)
  const fmtS = (n: number) => n.toLocaleString('en-US')
  // Leaderboard points each entrant earned toward the club board (same math as the board).
  const lpCfg = useLeaderboardConfig().data ?? DEFAULT_LEADERBOARD
  const lp = awardMap(ftAward(c, lpCfg))

  return (
    <>
      <Section
        title={wta ? 'Winner takes all' : 'Final result'}
        action={<Badge tone={wta ? 'amber' : 'purple'}>{wta ? 'WTA' : 'Points'}</Badge>}
      >
        {/* prize pot */}
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs">
          <Coins className="h-4 w-4 text-accent-emerald" />
          <span className="text-text-muted">Prize pool</span>
          <span className="font-mono text-text-muted">· {entries.length} × {c.stake}</span>
          <span className="ml-auto font-mono font-bold text-text-primary">{fmtS(pot)} Stakes</span>
        </div>

        {/* winner spotlight */}
        {winner && (
          <div className={cn('relative overflow-hidden rounded-2xl border p-4 text-center', wta ? 'border-accent-amber/50 bg-gradient-to-br from-accent-amber/25 via-accent-amber/10 to-bg-card' : 'border-accent-purple/40 bg-gradient-to-br from-accent-purple/20 to-bg-card')}>
            <span className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:14px_14px]" />
            <div className="relative mb-1.5 inline-flex items-center gap-1 rounded-full bg-accent-amber/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-amber">
              <Crown className="h-3 w-3" />{wta ? 'Takes the whole pot' : 'Champion'}
            </div>
            <div className="relative flex items-center justify-center gap-2.5">
              <Avatar name={winner.name} color={winner.avatarColor} size={40} />
              <div className="text-left">
                <div className="text-base font-extrabold text-text-primary">{winner.name}{winner.userId === meId && <span className="ml-1 text-[10px] text-accent-blue">(you)</span>}</div>
                <div className="truncate text-xs text-text-secondary">{winner.score} pts · {picksToNames(winner.picks, c.players)}</div>
              </div>
            </div>
            <div className="relative mt-2 font-mono text-lg font-extrabold text-accent-emerald">+{fmtS(prizeFor(0))} Stakes</div>
            {lp.get(winner.userId) ? <div className="relative mt-1.5 flex justify-center"><LpBadge points={lp.get(winner.userId)!} /></div> : null}
          </div>
        )}

        {/* full leaderboard */}
        <div className="mt-2 flex flex-col gap-1.5">
          {entries.map((e, i) => {
            const prize = prizeFor(i)
            return (
              <div
                key={e.userId}
                className={cn('flex items-center gap-2.5 rounded-xl border px-3 py-2',
                  e.userId === meId ? 'border-accent-purple/40 bg-accent-purple/10' : 'border-border bg-bg-card',
                  wta && i !== 0 && 'opacity-70')}
              >
                <span className="w-6 text-center text-sm font-extrabold text-text-muted">{medal(i)}</span>
                <Avatar name={e.name} color={e.avatarColor} pic={e.avatarUrl} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{e.name}{e.userId === meId && <span className="ml-1 text-[10px] text-accent-blue">(you)</span>}</p>
                  <p className="truncate text-[11px] text-text-muted">{picksToNames(e.picks, c.players)}</p>
                </div>
                <div className="text-right leading-tight">
                  <div className="font-mono text-sm font-bold text-accent-purple">{e.score} pts</div>
                  {prize > 0 ? (
                    <div className="font-mono text-[11px] font-bold text-accent-emerald">+{fmtS(prize)}</div>
                  ) : (
                    <div className="text-[11px] text-text-muted">{wta ? 'no payout' : 'out of money'}</div>
                  )}
                  {lp.get(e.userId) ? <div className="mt-0.5 flex justify-end"><LpBadge points={lp.get(e.userId)!} /></div> : null}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] leading-snug text-text-muted">
          {wta
            ? 'Winner-takes-all — only 1st place is paid; points still rank the table.'
            : 'Points payout — the pot splits 50 / 30 / 20 across the top three.'}
        </p>
      </Section>

      {/* the real final-table finishing order */}
      <Section title="Result — final table">
        <Card className="flex flex-wrap gap-1.5">
          {c.finishingOrder?.map((seat, i) => (
            <span key={seat} className="flex items-center gap-1 rounded-lg bg-bg-surface px-2 py-1 text-xs">
              <span className="font-bold text-text-muted">{i + 1}.</span>
              <span className="font-bold text-text-primary">{playerFull(c.players.find((p) => p.seat === seat))}</span>
              <span className="font-mono text-[10px] text-accent-emerald">+{FINISH_POINTS[i]}</span>
            </span>
          ))}
        </Card>
      </Section>
    </>
  )
}
