// =====================================================================
// Rail — Crew Pulse (DERIVED). Rail's thesis is people, not games: the home
// leads with your CREWS as living surfaces. This groups the unified arena
// games + ledger by club, so each crew shows its pulse: live now, opening
// soon, your standing, and recent results — without touching any store.
// =====================================================================
import { useMemo } from 'react'
import { useArena } from '@/hooks/arena'
import { useMyClubs } from '@/hooks'
import type { ArenaGame } from '@/lib/arena/unifiedGame'
import type { LedgerLine } from '@/lib/arena/ledger'

export interface CrewPulse {
  clubId: string
  clubName: string
  clubEmoji: string
  clubColor?: string
  memberCount: number
  myRole: string | null
  live: ArenaGame[]        // running games in this crew
  open: ArenaGame[]        // open games in this crew
  needsYou: ArenaGame[]    // games in this crew awaiting your action
  ledger?: LedgerLine      // your standing with this crew
  /** Sort weight — crews with action you're needed for float to the top. */
  heat: number
}

export function useCrews(): { loading: boolean; crews: CrewPulse[] } {
  const arena = useArena()
  const myClubs = useMyClubs()

  return useMemo(() => {
    const loading = arena.loading || myClubs.isLoading
    const clubs = (myClubs.data ?? []).filter((c) => c.myStatus === 'member')
    const ledgerByClub = new Map(arena.ledger.lines.map((l) => [l.clubId, l]))

    const crews: CrewPulse[] = clubs.map((c) => {
      const gamesHere = arena.games.filter((g) => g.clubId === c.id)
      const live = gamesHere.filter((g) => g.phase === 'live')
      const open = gamesHere.filter((g) => g.phase === 'open')
      const needsYou = gamesHere.filter((g) => g.needsYou)
      const heat =
        needsYou.length * 100 +
        live.length * 40 +
        open.filter((g) => g.relation === 'in' || g.relation === 'hosting').length * 10 +
        open.length
      return {
        clubId: c.id, clubName: c.name, clubEmoji: c.emoji, clubColor: c.color,
        memberCount: c.members.length, myRole: c.myRole,
        live, open, needsYou, ledger: ledgerByClub.get(c.id), heat,
      }
    }).sort((a, b) => b.heat - a.heat || b.memberCount - a.memberCount)

    return { loading, crews }
  }, [arena, myClubs.data, myClubs.isLoading])
}
