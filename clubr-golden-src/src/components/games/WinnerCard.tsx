import { Trophy, Coins, Scissors, Ban } from 'lucide-react'
import { Card, Badge } from '@/components/common/ui'
import { gameTypeDef } from '@/games/types'
import type { UnifiedGame } from '@/games/useUnifiedGames'

/** Cancel reason, per game type (set when status === 'cancelled'). */
function cancelReasonOf(g: UnifiedGame): string | undefined {
  return g.type === 'ft_fantasy' ? g.ft.cancelReason : g.type === 'last_longer' ? g.ll.cancelReason : g.sq.cancelReason
}

/** Compact relative time for a completed game. */
function ago(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

interface WinnerLine { name: string; amount?: number; note?: string }
interface Summary { typeId: UnifiedGame['type']; title: string; pool: number; entrants: number; winners: WinnerLine[]; chopped?: boolean }

// Per-type winner/pool/winnings. Money is dollar-blind "Stakes" (never $).
function summarize(g: UnifiedGame): Summary {
  if (g.type === 'ft_fantasy') {
    const c = g.ft
    const entrants = c.entries.length
    const pool = c.stake * entrants
    const wta = c.format === 'winner_takes_all'
    const pays = wta ? [100] : (c.payouts ?? [50, 30, 20])
    // Settled FT entries are sorted finishing-order (winner first).
    const winners = c.entries.slice(0, wta ? 1 : 3).map((e, i) => ({ name: e.name, amount: Math.round((pool * (pays[i] ?? 0)) / 100) }))
    return { typeId: 'ft_fantasy', title: c.ftName, pool, entrants, winners }
  }
  if (g.type === 'last_longer') {
    const ll = g.ll
    const entrants = ll.participants.length
    const pool = ll.stake * entrants
    const pays = ll.payouts ?? [100]
    if (ll.chop) {
      const names = ll.chop.agreements.filter((a) => a.agreed).map((a) => a.name)
      const each = names.length ? Math.round(pool / names.length) : 0
      return { typeId: 'last_longer', title: ll.title, pool, entrants, chopped: true, winners: names.map((n) => ({ name: n, amount: each })) }
    }
    const winners = ll.winnerName ? [{ name: ll.winnerName, amount: Math.round((pool * (pays[0] ?? 100)) / 100) }] : []
    return { typeId: 'last_longer', title: ll.title, pool, entrants, winners }
  }
  const sq = g.sq
  const pool = sq.stake * sq.claimedCount
  const nameOf = (uid?: string) => sq.participants.find((p) => p.userId === uid)?.name
  const winners = sq.periods
    .filter((p) => p.winnerUserId)
    .map((p) => ({ name: nameOf(p.winnerUserId) ?? 'Winner', note: p.label, amount: Math.round((pool * p.pct) / 100) }))
  // Entrants = the number of PEOPLE in the game, not squares claimed (pool still uses
  // claimedCount). Matches FT/LL which count people.
  return { typeId: 'football_squares', title: sq.title, pool, entrants: sq.participants.length, winners }
}

/** Rich Completed card: who won, the prize pool, and each payout. A cancelled
 *  game is terminal too (it shows in the "Finished" pill), but it has no winner —
 *  render a distinct, muted "Cancelled" card with the host's reason instead. */
export function WinnerCard({ g }: { g: UnifiedGame }) {
  const s = summarize(g)
  const def = gameTypeDef(s.typeId)
  if (g.cancelled) {
    const reason = cancelReasonOf(g)
    return (
      <Card className="flex items-center gap-2 opacity-90">
        {def && <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${def.chipActive}`}><def.icon className="h-3 w-3" />{def.short}</span>}
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-text-muted line-through">{s.title}</span>
        {reason ? <span className="hidden truncate text-[11px] text-text-muted sm:block">{reason}</span> : null}
        <Badge tone="red"><Ban className="h-3 w-3" />Cancelled</Badge>
      </Card>
    )
  }
  const top = s.winners[0]
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {def && <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${def.chipActive}`}><def.icon className="h-3 w-3" />{def.short}</span>}
        <span className="truncate font-bold text-text-primary">{s.title}</span>
        <span className="ml-auto shrink-0">{ago(g.settledAt)}</span>
      </div>

      {top ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-3 py-2">
          {s.chopped ? <Scissors className="h-5 w-5 shrink-0 text-accent-amber" /> : <Trophy className="h-5 w-5 shrink-0 text-accent-amber" />}
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-text-primary">
              {s.chopped ? `Chop · ${s.winners.length} players` : top.name}
              {top.note ? <span className="ml-1 text-[11px] font-semibold text-text-muted">{top.note}</span> : null}
            </div>
            {top.amount != null && <div className="text-xs text-text-secondary">{s.chopped ? `${top.amount.toLocaleString()} each` : `won ${top.amount.toLocaleString()} Stakes`}</div>}
          </div>
          <div className="ml-auto shrink-0 text-right text-[11px] text-text-muted">
            <div className="flex items-center justify-end gap-0.5"><Coins className="h-3 w-3" />{s.pool.toLocaleString()}</div>
            <div>{s.entrants} in</div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-text-muted">Completed · {s.pool.toLocaleString()} Stakes pool</div>
      )}

      {!s.chopped && s.winners.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {s.winners.slice(1).map((w, i) => (
            <Badge key={i} tone="neutral">{w.note ? `${w.note}: ` : `${i + 2}. `}{w.name}{w.amount != null ? ` · ${w.amount.toLocaleString()}` : ''}</Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
