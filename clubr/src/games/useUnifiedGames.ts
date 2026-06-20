import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useSquaresGames } from '@/hooks/squares'
import { regDeadline } from '@/components/common/Countdown'
import { useAuth } from '@/contexts/AuthContext'
import { hostedByMe } from '@/lib/gameRelationship'
import type { GameType } from '@/games/types'
import type { FTContestView } from '@/types/ft'
import type { LLGameView } from '@/types/ll'
import type { SquaresGameView } from '@/types/squares'

// One unified, urgency-sorted list of every game type the user can see — the
// single data source for the Games feed (and reusable elsewhere, e.g. a club's
// games section). Each item carries common flags + the raw typed view.
//
// To add a game type: add its list hook + one more `.map(...)` spread below,
// and a render case wherever items are drawn. Nothing else changes.

// Lifecycle phase, normalized across the 3 game types:
//   reg    = registration open  (FT 'open',   LL/SQ 'registration')
//   live   = in play / locked   (FT 'locked', LL/SQ 'live')
//   closed = done               (FT 'settled', LL/SQ 'completed')  == `finished`
export type GamePhase = 'reg' | 'live' | 'closed'

// `iHost` is the viewer's REAL host/co-host role (hostId/coHostIds === me) — NOT
// `canManage` (which also includes App Admins). The relationship pill keys off
// `iHost` so an admin/club-owner who merely oversees a game they play isn't
// mislabelled "Hosting" (the card chip already uses this real signal).
export type UnifiedGame =
  | { type: 'ft_fantasy'; id: string; clubId: string; canManage: boolean; iHost: boolean; finished: boolean; phase: GamePhase; mine: boolean; pending: boolean; sort: number; settledAt?: string; createdAt?: string; joinedAt?: string; ft: FTContestView }
  | { type: 'last_longer'; id: string; clubId: string; canManage: boolean; iHost: boolean; finished: boolean; phase: GamePhase; mine: boolean; pending: boolean; sort: number; settledAt?: string; createdAt?: string; joinedAt?: string; ll: LLGameView }
  | { type: 'football_squares'; id: string; clubId: string; canManage: boolean; iHost: boolean; finished: boolean; phase: GamePhase; mine: boolean; pending: boolean; sort: number; settledAt?: string; createdAt?: string; joinedAt?: string; sq: SquaresGameView }

export function useUnifiedGames(): { isLoading: boolean; items: UnifiedGame[] } {
  const contests = useContests()
  const games = useGames()
  const squares = useSquaresGames()
  const me = useAuth().user?.id ?? ''

  const items: UnifiedGame[] = [
    ...(contests.data ?? []).map((c): UnifiedGame => ({
      type: 'ft_fantasy', id: c.id, clubId: c.clubId, canManage: c.canManage, iHost: hostedByMe(c, me),
      finished: c.status === 'settled', phase: c.status === 'settled' ? 'closed' : c.status === 'locked' ? 'live' : 'reg', mine: c.myEntry != null, pending: c.myEntry?.status === 'pending',
      sort: c.status === 'settled' ? Number.MAX_SAFE_INTEGER : (regDeadline(c.locksAtTs ?? c.locksAt) ?? Number.MAX_SAFE_INTEGER),
      settledAt: c.settledAt, createdAt: c.createdAt, joinedAt: c.myEntry?.joinedAt,
      ft: c,
    })),
    ...(games.data ?? []).map((g): UnifiedGame => ({
      type: 'last_longer', id: g.id, clubId: g.clubId, canManage: g.canManage, iHost: hostedByMe(g, me),
      finished: g.status === 'completed', phase: g.status === 'completed' ? 'closed' : g.status === 'live' ? 'live' : 'reg', mine: g.me != null, pending: g.me?.status === 'pending',
      sort: g.status === 'completed' ? Number.MAX_SAFE_INTEGER : (g.status === 'live' ? 0 : (regDeadline(g.registrationClosesAt) ?? Number.MAX_SAFE_INTEGER)),
      settledAt: g.settledAt, createdAt: g.createdAt, joinedAt: g.me?.joinedAt,
      ll: g,
    })),
    ...(squares.data ?? []).map((s): UnifiedGame => ({
      type: 'football_squares', id: s.id, clubId: s.clubId, canManage: s.canManage, iHost: hostedByMe(s, me),
      finished: s.status === 'completed', phase: s.status === 'completed' ? 'closed' : s.status === 'live' ? 'live' : 'reg', mine: s.me != null, pending: s.me?.status === 'pending',
      sort: s.status === 'completed' ? Number.MAX_SAFE_INTEGER : (s.status === 'live' ? 0 : (regDeadline(s.registrationClosesAt) ?? Number.MAX_SAFE_INTEGER)),
      settledAt: s.settledAt, createdAt: s.createdAt, joinedAt: s.me?.joinedAt,
      sq: s,
    })),
  ].sort((a, b) => a.sort - b.sort)

  return { isLoading: contests.isLoading || games.isLoading || squares.isLoading, items }
}

/** Filter helper for the type-chip row. */
export const matchesType = (g: UnifiedGame, filter: 'all' | GameType) => filter === 'all' || g.type === filter

// Home-feed ordering lives in a hook-free module (so it's unit-testable in
// isolation); re-exported here for ergonomic imports alongside useUnifiedGames.
export { orderActiveGames } from './gameOrdering'
