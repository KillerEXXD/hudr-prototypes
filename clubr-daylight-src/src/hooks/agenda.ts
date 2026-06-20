// =====================================================================
// Daylight — Agenda (DERIVED). Daylight's model: club life is a recurring
// SCHEDULE, not a feed. This buckets the player's games by time so the home
// reads like a calendar — and, critically, it's the SAME structure whether you
// have one game or twenty. Sections only appear when they have content, so a
// brand-new member with one invited game sees a focused, full-looking screen,
// and a veteran with ten clubs sees a rich week — no empty modules, ever.
// =====================================================================
import { useMemo } from 'react'
import { useArena } from '@/hooks/arena'
import { regDeadline } from '@/components/common/Countdown'
import type { ArenaGame } from '@/lib/arena/unifiedGame'

export type Bucket = 'now' | 'today' | 'week' | 'later' | 'recent'

export interface AgendaSection {
  bucket: Bucket
  label: string
  games: ArenaGame[]
}

const DAY = 86_400_000

function bucketFor(g: ArenaGame, now: number): Bucket {
  if (g.phase === 'live') return 'now'
  if (g.phase === 'settled') return 'recent'
  const d = regDeadline(g.deadline ?? null)
  if (d == null) return 'later'
  const delta = d - now
  if (delta <= 0) return 'now'            // closing/closed but still open-phase → treat as immediate
  if (delta < DAY) return 'today'
  if (delta < 7 * DAY) return 'week'
  return 'later'
}

const LABEL: Record<Bucket, string> = {
  now: 'Happening now',
  today: 'Today',
  week: 'This week',
  later: 'Coming up',
  recent: 'Just wrapped',
}

export interface Agenda {
  loading: boolean
  /** The player's own games (in / hosting / pending), time-bucketed. */
  sections: AgendaSection[]
  /** Open games in your clubs you haven't joined — the gentle "more" surface. */
  openToJoin: ArenaGame[]
  /** Total games the player is involved in — drives the single-thread vs rich layout. */
  mineCount: number
  /** Anything that needs the player's action right now. */
  needsYou: ArenaGame[]
}

export function useAgenda(): Agenda {
  const arena = useArena()
  return useMemo(() => {
    const now = Date.now()
    const mine = arena.games.filter(
      (g) => g.relation === 'in' || g.relation === 'hosting' || g.relation === 'pending' ||
        (g.phase === 'settled' && g.result),
    )
    const order: Bucket[] = ['now', 'today', 'week', 'later', 'recent']
    const byBucket = new Map<Bucket, ArenaGame[]>()
    for (const g of mine) {
      const b = bucketFor(g, now)
      if (!byBucket.has(b)) byBucket.set(b, [])
      byBucket.get(b)!.push(g)
    }
    // sort each bucket by imminence (deadline asc; live first)
    for (const arr of byBucket.values()) {
      arr.sort((a, b) => {
        if (a.phase === 'live' && b.phase !== 'live') return -1
        if (b.phase === 'live' && a.phase !== 'live') return 1
        return (regDeadline(a.deadline ?? null) ?? Infinity) - (regDeadline(b.deadline ?? null) ?? Infinity)
      })
    }
    const sections: AgendaSection[] = order
      .filter((b) => (byBucket.get(b)?.length ?? 0) > 0)
      .map((b) => ({ bucket: b, label: LABEL[b], games: byBucket.get(b)! }))

    const openToJoin = arena.games.filter((g) => g.phase === 'open' && g.relation === 'open')
    const needsYou = arena.needsYou

    return { loading: arena.loading, sections, openToJoin, mineCount: mine.length, needsYou }
  }, [arena])
}
