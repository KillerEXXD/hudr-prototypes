import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { regDeadline } from '@/components/common/Countdown'
import type { GameType } from '@/games/types'
import type { FTContestView } from '@/types/ft'
import type { LLGameView } from '@/types/ll'

// One unified, urgency-sorted list of every game type the user can see — the
// single data source for the Games feed (and reusable elsewhere, e.g. a club's
// games section). Each item carries common flags + the raw typed view.
//
// To add a game type: add its list hook + one more `.map(...)` spread below,
// and a render case wherever items are drawn. Nothing else changes.

export type UnifiedGame =
  | { type: 'ft_fantasy'; id: string; canManage: boolean; finished: boolean; mine: boolean; sort: number; ft: FTContestView }
  | { type: 'last_longer'; id: string; canManage: boolean; finished: boolean; mine: boolean; sort: number; ll: LLGameView }

export function useUnifiedGames(): { isLoading: boolean; items: UnifiedGame[] } {
  const contests = useContests()
  const games = useGames()

  const items: UnifiedGame[] = [
    ...(contests.data ?? []).map((c): UnifiedGame => ({
      type: 'ft_fantasy', id: c.id, canManage: c.canManage,
      finished: c.status === 'settled', mine: c.myEntry != null,
      sort: c.status === 'settled' ? Number.MAX_SAFE_INTEGER : regDeadline(c.id, c.locksAtTs),
      ft: c,
    })),
    ...(games.data ?? []).map((g): UnifiedGame => ({
      type: 'last_longer', id: g.id, canManage: g.canManage,
      finished: g.status === 'completed', mine: g.me != null,
      sort: g.status === 'completed' ? Number.MAX_SAFE_INTEGER : (g.status === 'live' ? 0 : regDeadline(g.id, g.registrationClosesAt)),
      ll: g,
    })),
  ].sort((a, b) => a.sort - b.sort)

  return { isLoading: contests.isLoading || games.isLoading, items }
}

/** Filter helper for the type-chip row. */
export const matchesType = (g: UnifiedGame, filter: 'all' | GameType) => filter === 'all' || g.type === filter
