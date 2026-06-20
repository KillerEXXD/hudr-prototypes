// Pure selection logic for the Discover "Open now in your clubs" list. No React
// or data-layer imports (types are erased at build), so it unit-tests without a
// Supabase client. See DiscoverPage.
import type { UnifiedGame } from '@/games/useUnifiedGames'
import type { GameType } from '@/games/types'
import type { MemberRole } from '@/types'

const matchesType = (g: UnifiedGame, filter: 'all' | GameType) => filter === 'all' || g.type === filter

// "Open now" prioritises games you can still join/enter (open registration);
// live games come second. Finished/locked games never appear.
export function isJoinable(g: UnifiedGame): boolean {
  if (g.type === 'ft_fantasy') return g.ft.status === 'open'
  if (g.type === 'last_longer') return g.ll.status === 'registration'
  return g.sq.status === 'registration'
}

/**
 * The Discover "open now" list: not-finished games in clubs the player has
 * joined, narrowed to `filter`, ordered joinable-first then live (each group
 * keeps useUnifiedGames' urgency order).
 */
export function selectOpenGames(items: UnifiedGame[], roleByClub: Map<string, MemberRole>, filter: 'all' | GameType): UnifiedGame[] {
  const open = items.filter((g) => !g.finished && roleByClub.has(g.clubId)).filter((g) => matchesType(g, filter))
  return [...open.filter(isJoinable), ...open.filter((g) => !isJoinable(g))]
}
