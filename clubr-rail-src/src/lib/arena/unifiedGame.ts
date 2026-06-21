// =====================================================================
// Arena — Unified game adapter (DERIVED; does not touch the verbatim stores).
//
// The redesign's core UX move: FT Fantasy, Last Longer, and Squares are three
// different data shapes but ONE mental model to a player — "a game my crew is
// running." This adapter projects all three into a single `ArenaGame` so the
// home screen, the live bar, and the unified game-detail shell can read one
// shape. Type-specific bodies still read the raw view; this is only the
// common chrome + lifecycle + your-relationship layer.
// =====================================================================
import type { FTContestView } from '@/types/ft'
import type { LLGameView } from '@/types/ll'
import type { SquaresGameView } from '@/types/squares'

export type ArenaType = 'ft' | 'll' | 'squares'

/** One lifecycle across every game type. The raw statuses map onto this. */
export type ArenaPhase = 'open' | 'live' | 'settling' | 'settled' | 'cancelled'

/** The player's relationship to a game — drives the action zone + home grouping. */
export type ArenaRelation =
  | 'hosting'      // you run it
  | 'in'           // you're an approved participant
  | 'pending'      // you requested, awaiting host
  | 'open'         // you could join
  | 'spectating'   // member of club, not joined
  | 'done'         // settled, you took part

export interface ArenaGame {
  type: ArenaType
  id: string
  /** Canonical route to this game's unified detail page. */
  href: string
  title: string
  clubId: string
  clubName: string
  clubEmoji: string
  phase: ArenaPhase
  /** A short human label for the phase, type-aware (e.g. 'Drafting', 'Last 3'). */
  phaseLabel: string
  stake: number
  /** ISO close/lock time while open, else undefined. Drives the countdown. */
  deadline?: string
  relation: ArenaRelation
  /** True when this game is the single most important pixel for the player. */
  needsYou: boolean
  /** Live participation snapshot: alive/total, drafted/total, claimed/total. */
  progress?: { value: number; total: number; unit: string }
  /** When settled & you played: your finishing position + field size. */
  result?: { rank: number; field: number; won: boolean }
}

const TYPE_HREF: Record<ArenaType, (id: string) => string> = {
  ft: (id) => `/fantasy/${id}`,
  ll: (id) => `/lastlonger/${id}`,
  squares: (id) => `/squares/${id}`,
}

// ---- FT ----
export function fromFT(c: FTContestView, _userId: string): ArenaGame {
  const phase: ArenaPhase =
    c.status === 'open' ? 'open' : c.status === 'locked' ? 'live' : c.status === 'cancelled' ? 'cancelled' : 'settled'
  const me = c.myEntry
  const drafted = c.entries.filter((e) => e.picks.length > 0).length
  const relation: ArenaRelation = c.canManage
    ? 'hosting'
    : me?.status === 'approved'
      ? phase === 'settled' ? 'done' : 'in'
      : me?.status === 'pending'
        ? 'pending'
        : phase === 'open'
          ? 'open'
          : c.isMemberOfClub ? 'spectating' : 'open'
  // You're needed when: open & you can still draft, or it's your entry mid-draft.
  const needsYou =
    (phase === 'open' && (relation === 'in' || relation === 'open') && (me?.picks.length ?? 0) < 4) ||
    (phase === 'open' && relation === 'hosting')
  const phaseLabel =
    phase === 'open' ? (me && me.picks.length > 0 ? `Drafted ${me.picks.length}/4` : 'Drafting open')
    : phase === 'live' ? 'Locked · live'
    : phase === 'settled' ? 'Final' : 'Cancelled'
  const myRank = me?.rank
  return {
    type: 'ft', id: c.id, href: TYPE_HREF.ft(c.id), title: c.ftName,
    clubId: c.clubId, clubName: c.clubName, clubEmoji: c.clubEmoji,
    phase, phaseLabel, stake: c.stake, deadline: c.locksAtTs, relation, needsYou,
    progress: { value: drafted, total: c.entries.length || 0, unit: 'drafted' },
    result: phase === 'settled' && myRank ? { rank: myRank, field: c.entries.length, won: myRank === 1 } : undefined,
  }
}

// ---- Last Longer ----
export function fromLL(g: LLGameView, _userId: string): ArenaGame {
  const phase: ArenaPhase =
    g.status === 'registration' ? 'open' : g.status === 'live' ? 'live' : g.status === 'cancelled' ? 'cancelled' : 'settled'
  const me = g.me
  const alive = g.participants.filter((p) => p.status === 'active').length
  const relation: ArenaRelation = g.canManage
    ? 'hosting'
    : me?.status === 'active'
      ? phase === 'settled' ? 'done' : 'in'
      : me?.status === 'pending'
        ? 'pending'
        : phase === 'open'
          ? 'open'
          : g.isMemberOfClub ? 'spectating' : 'open'
  // You're needed when it's live and you're still alive (keep your chips current).
  const needsYou = phase === 'live' && me?.status === 'active'
  const phaseLabel =
    phase === 'open' ? 'Registration open'
    : phase === 'live' ? (alive <= 3 ? `Last ${alive}` : `${alive} alive`)
    : phase === 'settled' ? 'Settled' : 'Cancelled'
  const myFinish = me?.finishPos
  return {
    type: 'll', id: g.id, href: TYPE_HREF.ll(g.id), title: g.title,
    clubId: g.clubId, clubName: g.clubName, clubEmoji: g.clubEmoji,
    phase, phaseLabel, stake: g.stake, deadline: g.registrationClosesAt, relation, needsYou,
    progress: { value: alive, total: g.participants.length, unit: 'alive' },
    result: phase === 'settled' && myFinish ? { rank: myFinish, field: g.participants.length, won: myFinish === 1 } : undefined,
  }
}

// ---- Squares ----
export function fromSquares(g: SquaresGameView, userId: string): ArenaGame {
  const phase: ArenaPhase =
    g.status === 'registration' ? 'open' : g.status === 'live' ? 'live' : g.status === 'cancelled' ? 'cancelled' : 'settled'
  const me = g.me
  const myCells = g.cells.filter((c) => c.userId === userId).length
  const relation: ArenaRelation = g.canManage
    ? 'hosting'
    : me?.status === 'active'
      ? phase === 'settled' ? 'done' : 'in'
      : me?.status === 'pending'
        ? 'pending'
        : phase === 'open'
          ? 'open'
          : g.isMemberOfClub ? 'spectating' : 'open'
  // You're needed when open & you have no squares yet (claim some).
  const needsYou = phase === 'open' && (relation === 'in' || relation === 'open') && myCells === 0
  const periodsDone = g.periods.filter((p) => p.winnerCell != null).length
  const phaseLabel =
    phase === 'open' ? `${g.claimedCount}/100 claimed`
    : phase === 'live' ? `${periodsDone}/${g.periods.length} periods`
    : phase === 'settled' ? 'Final' : 'Cancelled'
  // Did any of my cells win a period?
  const myWins = g.periods.filter((p) => p.winnerUserId === userId).length
  return {
    type: 'squares', id: g.id, href: TYPE_HREF.squares(g.id), title: g.title,
    clubId: g.clubId, clubName: g.clubName, clubEmoji: g.clubEmoji,
    phase, phaseLabel, stake: g.stake, deadline: g.registrationClosesAt, relation, needsYou,
    progress: { value: g.claimedCount, total: 100, unit: 'claimed' },
    result: phase === 'settled' && me ? { rank: myWins > 0 ? 1 : 0, field: g.participants.length, won: myWins > 0 } : undefined,
  }
}

/** Sort for the home "what needs you" stack: needsYou first, then live, then by deadline. */
export function arenaPriority(a: ArenaGame): number {
  if (a.needsYou && a.phase === 'live') return 0
  if (a.needsYou) return 1
  if (a.phase === 'live') return 2
  if (a.phase === 'open' && (a.relation === 'in' || a.relation === 'hosting')) return 3
  if (a.phase === 'open') return 4
  return 5
}

export const PHASE_TONE: Record<ArenaPhase, 'blue' | 'green' | 'amber' | 'neutral' | 'red'> = {
  open: 'blue', live: 'green', settling: 'amber', settled: 'neutral', cancelled: 'red',
}

export const TYPE_META: Record<ArenaType, { label: string; glyph: string; tone: 'purple' | 'amber' | 'green' }> = {
  ft: { label: 'FT Fantasy', glyph: '♠', tone: 'purple' },
  ll: { label: 'Last Longer', glyph: '◆', tone: 'amber' },
  squares: { label: 'Squares', glyph: '▦', tone: 'green' },
}
