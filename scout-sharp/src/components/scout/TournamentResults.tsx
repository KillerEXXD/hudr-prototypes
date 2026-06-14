import { useMemo } from 'react'
import { Trophy, Medal, Skull, Banknote } from 'lucide-react'
import type { Player, Tournament } from '@/lib/api/domain'
import { buildFinalTable } from '@/data/finalTable'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import HandViewerButton from '@/components/scout/HandViewer'
import { cn, fmtChips } from '@/lib/utils'

// Combined Final Standings + Elimination Timeline: finishing order on a single
// rail, each player's $ won, and a watch-the-bust button (clip / replayer).
const placeLabel = (n: number) => n === 1 ? 'Winner' : n === 2 ? 'Runner-up' : `${n}${ord(n)}`
const ord = (n: number) => (n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th'
const medalTone = (n: number) => n === 1 ? 'text-amber-400' : n === 2 ? 'text-slate-300' : 'text-amber-700'

export default function TournamentResults({ tournament, players }: { tournament: Tournament; players: Player[] }) {
  const rows = useMemo(() => buildFinalTable(tournament, players), [tournament, players])
  const nameById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players])

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-text-muted">
        Final standings appear once the event has been played out.
      </div>
    )
  }

  const totalPaid = rows.reduce((acc, r) => acc + r.payout, 0)

  return (
    <div>
      <p className="mb-3 text-[11px] text-text-muted">
        Finishing order, prize money, and the exact hand each player busted — tap <span className="font-medium text-text-secondary">Watch</span> to see the elimination in the clip or replayer.
      </p>

      {/* summary strip */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        {[['Players', String(tournament.playerCount)], ['Hands', String(tournament.handCount)], ['Paid out', fmtChips(totalPaid)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-bg-card py-2">
            <div className="nums text-sm font-bold text-text-primary">{v}</div>
            <div className="text-[10px] uppercase tracking-wide text-text-muted">{k}</div>
          </div>
        ))}
      </div>

      {/* timeline rail */}
      <ol className="relative ml-1 border-l border-border pl-4">
        {rows.map((r) => {
          const first = r.player.name.split(' ')[0]
          const bustedBy = r.eliminatedById && r.eliminatedById !== r.player.id ? nameById[r.eliminatedById] : null
          return (
            <li key={r.player.id} className="relative mb-2.5 last:mb-0">
              {/* rail dot */}
              <span
                className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full ring-2 ring-bg-secondary"
                style={{ backgroundColor: r.player.color }}
              />
              <div className={cn(
                'rounded-xl border bg-bg-card p-3',
                r.isWinner ? 'border-amber-400/40 bg-amber-400/[0.04]' : 'border-border',
              )}>
                <div className="flex items-center gap-3">
                  {/* place */}
                  <div className="flex w-9 shrink-0 flex-col items-center">
                    {r.finish <= 3 ? (
                      r.isWinner
                        ? <Trophy className={cn('h-5 w-5', medalTone(r.finish))} />
                        : <Medal className={cn('h-5 w-5', medalTone(r.finish))} />
                    ) : (
                      <span className="nums text-base font-bold text-text-muted">{r.finish}</span>
                    )}
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-text-muted">{ord(r.finish) === 'th' ? `${r.finish}th` : placeLabel(r.finish)}</span>
                  </div>

                  {/* player */}
                  <PlayerAvatar initials={r.player.initials} color={r.player.color} photoUrl={r.player.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-text-primary">{r.player.name}</span>
                      <span aria-hidden>{r.player.flag}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-accent-emerald">
                      <Banknote className="h-3.5 w-3.5" /><span className="nums">{fmtChips(r.payout)}</span>
                    </div>
                  </div>

                  {/* watch the elimination hand */}
                  {r.eliminationHand != null && (
                    <HandViewerButton
                      className="shrink-0"
                      label={r.isWinner ? 'Final hand' : 'Watch'}
                      hand={{
                        handNumber: r.eliminationHand,
                        title: r.isWinner ? `${first} wins — hand #${r.eliminationHand}` : `${first} out in ${placeLabel(r.finish)} — hand #${r.eliminationHand}`,
                        note: r.eliminationDesc ?? undefined,
                        videoSeconds: r.videoSeconds,
                        hasReplay: true,
                      }}
                    />
                  )}
                </div>

                {/* elimination detail line */}
                <div className="mt-2 flex items-start gap-1.5 border-t border-border/60 pt-2 text-[11px] leading-snug text-text-muted">
                  {r.isWinner
                    ? <Trophy className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    : <Skull className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />}
                  <span>
                    {r.isWinner
                      ? <>Champion — closed it out on <span className="nums text-text-secondary">hand #{r.eliminationHand}</span>.</>
                      : <>
                          Out on <span className="nums text-text-secondary">hand #{r.eliminationHand}</span>
                          {bustedBy && <> to {bustedBy}</>}
                          {r.eliminationDesc && <> — {r.eliminationDesc}</>}
                        </>}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-3 text-center text-[10px] text-text-muted">
        Prize money modeled from a standard final-table payout curve. Elimination hands are real for this event; clips/replayer are demo-linked.
      </p>
    </div>
  )
}
