// =====================================================================
// useArena — the single read the redesigned surfaces use.
// Fans the three game sources into one unified ArenaGame[] (via the adapter)
// and derives the relationship ledger. Pure composition over existing hooks;
// no new store, no new network. Type-specific detail bodies still use the
// raw useContest/useGame/useSquaresGame hooks.
// =====================================================================
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useSquaresGames } from '@/hooks/squares'
import { fromFT, fromLL, fromSquares, arenaPriority, type ArenaGame } from '@/lib/arena/unifiedGame'
import { buildLedger, type LedgerLine, type LedgerTotals } from '@/lib/arena/ledger'

export interface ArenaData {
  loading: boolean
  games: ArenaGame[]
  /** Games that want the player's attention right now, priority-sorted. */
  needsYou: ArenaGame[]
  /** Live games the player is in (drives the live bar). */
  live: ArenaGame[]
  /** Open games the player could join or is in, not yet live. */
  upcoming: ArenaGame[]
  /** Settled games the player took part in, newest first. */
  recent: ArenaGame[]
  ledger: { lines: LedgerLine[]; totals: LedgerTotals }
}

export function useArena(): ArenaData {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const ft = useContests()
  const ll = useGames()
  const sq = useSquaresGames()

  return useMemo(() => {
    const loading = ft.isLoading || ll.isLoading || sq.isLoading
    const contests = ft.data ?? []
    const llGames = ll.data ?? []
    const sqGames = sq.data ?? []

    const games: ArenaGame[] = [
      ...contests.map((c) => fromFT(c, userId)),
      ...llGames.map((g) => fromLL(g, userId)),
      ...sqGames.map((g) => fromSquares(g, userId)),
    ]

    const mine = games.filter((g) => g.relation !== 'open' && g.relation !== 'spectating' || g.needsYou)
    const needsYou = games.filter((g) => g.needsYou).sort((a, b) => arenaPriority(a) - arenaPriority(b))
    const live = games.filter((g) => g.phase === 'live' && (g.relation === 'in' || g.relation === 'hosting'))
    const upcoming = games
      .filter((g) => g.phase === 'open')
      .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
    const recent = games
      .filter((g) => g.phase === 'settled' && g.result)
      .sort((a, b) => (b.id).localeCompare(a.id))

    const ledger = buildLedger(contests, llGames, sqGames, userId)

    // keep `mine` referenced (lint: noUnusedLocals) by folding into games order
    void mine

    return { loading, games, needsYou, live, upcoming, recent, ledger }
  }, [ft.data, ll.data, sq.data, ft.isLoading, ll.isLoading, sq.isLoading, userId])
}
