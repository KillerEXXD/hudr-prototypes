import { describe, it, expect } from 'vitest'
import { isLiveForMe, isFinishedForMe, isInProgressForMe } from './liveBuckets'
import type { UnifiedGame } from '@/games/useUnifiedGames'

// A game's two dimensions that decide its Live/Finished bucket. (ll payload is
// irrelevant to the predicates — cast a stub.)
const g = (o: Partial<UnifiedGame>): UnifiedGame => ({
  type: 'last_longer', id: 'x', clubId: 'c', canManage: false, iHost: false, iCoHost: false,
  finished: false, cancelled: false, phase: 'reg', mine: false, pending: false, sort: 0,
  ll: {} as never, ...o,
} as UnifiedGame)

describe('Live page buckets', () => {
  it('Live = not ended AND you are involved (playing, waiting approval, or hosting)', () => {
    expect(isLiveForMe(g({ mine: true, phase: 'reg' }))).toBe(true)                 // approved / playing
    expect(isLiveForMe(g({ mine: true, pending: true, phase: 'reg' }))).toBe(true)  // waiting approval
    expect(isLiveForMe(g({ iHost: true, phase: 'live' }))).toBe(true)               // hosting
    expect(isLiveForMe(g({ iCoHost: true, phase: 'live' }))).toBe(true)             // co-hosting
  })

  it('Live EXCLUDES games you have not joined (available) and ended games', () => {
    expect(isLiveForMe(g({ mine: false, phase: 'reg' }))).toBe(false)               // available — not yours
    expect(isLiveForMe(g({ mine: true, phase: 'closed', finished: true }))).toBe(false) // ended
  })

  it('Finished = ended AND yours or hosted (cancelled included)', () => {
    expect(isFinishedForMe(g({ finished: true, mine: true }))).toBe(true)
    expect(isFinishedForMe(g({ finished: true, canManage: true }))).toBe(true)
    expect(isFinishedForMe(g({ finished: true, cancelled: true, mine: true }))).toBe(true)
    expect(isFinishedForMe(g({ finished: false, mine: true }))).toBe(false)          // still live
    expect(isFinishedForMe(g({ finished: true, mine: false, canManage: false }))).toBe(false) // not yours
  })

  it('In progress = phase "live" AND you are involved (drives the pulsing-red dot)', () => {
    expect(isInProgressForMe(g({ mine: true, phase: 'live' }))).toBe(true)           // playing a rolling game
    expect(isInProgressForMe(g({ iHost: true, phase: 'live' }))).toBe(true)          // hosting a rolling game
    expect(isInProgressForMe(g({ mine: true, phase: 'reg' }))).toBe(false)           // registration, not rolling yet
    expect(isInProgressForMe(g({ mine: true, phase: 'closed', finished: true }))).toBe(false) // ended
    expect(isInProgressForMe(g({ mine: false, phase: 'live' }))).toBe(false)         // live, but not yours
  })
})
