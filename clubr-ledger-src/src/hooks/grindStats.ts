// =====================================================================
// Ledger — Grinder Stats (DERIVED). The stats-cockpit thesis: a serious player
// wants their numbers, not a feed. This derives per-game-type performance, cash
// rate, net Stakes, and a simple form trend from settled results — composed over
// the existing arena ledger + unified games. No store touched.
// =====================================================================
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useSquaresGames } from '@/hooks/squares'
import { useArena } from '@/hooks/arena'
import type { ArenaType } from '@/lib/arena/unifiedGame'

export interface TypeStat {
  type: ArenaType
  label: string
  played: number
  cashes: number
  wins: number
  net: number
  cashRate: number
}

export interface GrindStats {
  loading: boolean
  totals: { played: number; cashes: number; wins: number; net: number; cashRate: number; clubs: number }
  byType: TypeStat[]
  /** Net per settled game, oldest→newest, for a cumulative trend line. */
  trend: { cum: number; net: number; label: string }[]
  ledgerLines: ReturnType<typeof useArena>['ledger']['lines']
}

const TYPE_LABEL: Record<ArenaType, string> = { ft: 'FT Fantasy', ll: 'Last Longer', squares: 'Squares' }

export function useGrindStats(): GrindStats {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const ft = useContests()
  const ll = useGames()
  const sq = useSquaresGames()
  const arena = useArena()

  return useMemo(() => {
    const loading = ft.isLoading || ll.isLoading || sq.isLoading || arena.loading

    // Per-type settled outcomes (mirror the ledger's math, but split by type).
    type O = { type: ArenaType; staked: number; won: number; cashed: boolean; win: boolean; when?: string }
    const out: O[] = []

    for (const c of ft.data ?? []) {
      if (c.status !== 'settled' || !c.myEntry) continue
      const me = c.myEntry, field = c.entries.length || 1, pay = c.payouts ?? [100]
      const cashed = (me.rank ?? 99) <= pay.length, win = me.rank === 1
      const pot = c.stake * field, share = cashed ? (pay[(me.rank ?? 1) - 1] ?? 0) / 100 : 0
      out.push({ type: 'ft', staked: c.stake, won: Math.round(pot * share), cashed, win, when: c.settledAt })
    }
    for (const g of ll.data ?? []) {
      if (g.status !== 'completed' || !g.me) continue
      const pos = g.me.finishPos ?? 99, field = g.participants.length || 1, pay = g.payouts ?? [100]
      const cashed = pos <= pay.length, win = pos === 1
      const pot = g.stake * field, share = cashed ? (pay[pos - 1] ?? 0) / 100 : 0
      out.push({ type: 'll', staked: g.stake, won: Math.round(pot * share), cashed, win, when: g.settledAt })
    }
    for (const g of sq.data ?? []) {
      if (g.status !== 'completed' || !g.me) continue
      const myWins = g.periods.filter((p) => p.winnerUserId === userId)
      const cashed = myWins.length > 0
      const pot = g.claimedCount * g.stake, share = myWins.reduce((s, p) => s + p.pct / 100, 0)
      const myCells = g.cells.filter((cl) => cl.userId === userId).length
      out.push({ type: 'squares', staked: myCells * g.stake, won: Math.round(pot * share), cashed, win: cashed, when: g.settledAt })
    }

    const types: ArenaType[] = ['ft', 'll', 'squares']
    const byType: TypeStat[] = types.map((t) => {
      const rows = out.filter((o) => o.type === t)
      const net = rows.reduce((s, o) => s + (o.won - o.staked), 0)
      const cashes = rows.filter((o) => o.cashed).length
      return {
        type: t, label: TYPE_LABEL[t], played: rows.length, cashes, wins: rows.filter((o) => o.win).length,
        net, cashRate: rows.length ? cashes / rows.length : 0,
      }
    }).filter((s) => s.played > 0)

    const sorted = [...out].sort((a, b) => (a.when ?? '').localeCompare(b.when ?? ''))
    let cum = 0
    const trend = sorted.map((o, i) => { const net = o.won - o.staked; cum += net; return { cum, net, label: `#${i + 1}` } })

    const totals = {
      played: out.length,
      cashes: out.filter((o) => o.cashed).length,
      wins: out.filter((o) => o.win).length,
      net: out.reduce((s, o) => s + (o.won - o.staked), 0),
      cashRate: out.length ? out.filter((o) => o.cashed).length / out.length : 0,
      clubs: arena.ledger.lines.length,
    }

    return { loading, totals, byType, trend, ledgerLines: arena.ledger.lines }
  }, [ft.data, ll.data, sq.data, ft.isLoading, ll.isLoading, sq.isLoading, arena, userId])
}
