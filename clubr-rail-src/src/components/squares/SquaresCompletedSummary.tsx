import { Link } from 'react-router-dom'
import { NoWinnerRuleChip } from './NoWinnerRuleChip'
import { SquaresQuarterCards } from './SquaresQuarterCards'
import { squaresChampion } from './squaresChampion'
import { ChampionCard } from '@/components/common/ChampionCard'
import { computeSquaresPayouts } from '@/lib/squaresPayouts'
import type { SquaresGameView } from '@/types/squares'

/**
 * The completed-game summary for a Squares board: the house-rule chip, cross-game
 * rollover provenance (links back to the source games whose unwon Final pool was
 * carried in), the shared ChampionCard (Final winner = overall champion), and the
 * per-quarter breakdown.
 */
export function SquaresCompletedSummary({ g, userId, lpRows }: { g: SquaresGameView; userId?: string; lpRows: { userId: string; points: number }[] }) {
  const champ = squaresChampion(g)
  const payouts = computeSquaresPayouts(g)
  const lpByUser = new Map(lpRows.map((r) => [r.userId, r.points]))
  // The REAL Final-row actual prize (base + rolled-in) — can differ from champ.prize
  // when earlier quarters (or another game) fed the Final under the Rollover rule.
  const finalRow = payouts.perPeriod.find((r) => r.label === 'Final')
  const champPrize = finalRow?.actualPrize ?? champ?.prize ?? 0

  return (
    <>
      <div className="mt-3"><NoWinnerRuleChip rule={payouts.rule} charityName={payouts.charityName} /></div>
      {(g.rolledOverFrom?.length ?? 0) > 0 && (
        <div className="mt-1.5 rounded-xl border border-accent-emerald/30 bg-accent-emerald/[0.06] px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Rolled over from</p>
          {g.rolledOverFrom!.map((r) => (
            <Link key={r.gameId} to={`/squares/${r.gameId}`} className="mt-0.5 flex items-center justify-between gap-2 text-xs font-semibold text-accent-blue hover:underline">
              <span className="min-w-0 truncate">{r.title}</span>
              <span className="shrink-0 font-mono text-accent-emerald">+{r.amount.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
      {champ && (
        <div className="mt-3">
          <ChampionCard
            title="Squares Champion"
            subtitle="Won Q4"
            name={champ.winner.name}
            avatarColor={champ.winner.avatarColor}
            isMe={champ.winner.userId === userId}
            prizeStakes={champPrize}
            lpPoints={lpByUser.get(champ.winner.userId) || undefined}
          />
        </div>
      )}
      <SquaresQuarterCards g={g} userId={userId} lpByUser={lpByUser} />
    </>
  )
}
