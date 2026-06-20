import { describe, it, expect } from 'vitest'
import { relationshipOf, relationshipPills, defaultRelationship } from './gameRelationship'
import type { UnifiedGame } from './useUnifiedGames'

const g = (over: Partial<UnifiedGame>) =>
  ({ type: 'last_longer', id: 'x', clubId: 'c', canManage: false, iHost: false, finished: false, phase: 'reg', mine: false, sort: 0, ...over } as unknown as UnifiedGame)

describe('relationshipOf', () => {
  it('hosting when you actually host it (even if you also play it)', () => {
    expect(relationshipOf(g({ iHost: true }))).toBe('hosting')
    expect(relationshipOf(g({ iHost: true, mine: true, phase: 'live' }))).toBe('hosting')
  })
  it('playing when you joined it and do not host it', () => {
    expect(relationshipOf(g({ mine: true }))).toBe('playing')
    expect(relationshipOf(g({ mine: true, phase: 'live' }))).toBe('playing')
  })
  it('regression: an App Admin / club-owner who can manage but does NOT host is Playing, not Hosting', () => {
    expect(relationshipOf(g({ canManage: true, iHost: false, mine: true, phase: 'live' }))).toBe('playing')
    expect(relationshipOf(g({ canManage: true, iHost: false, mine: false, phase: 'reg' }))).toBe('available')
    expect(relationshipOf(g({ canManage: true, iHost: false, mine: false, phase: 'live' }))).toBeNull()
  })
  it('available only when Open, not yours, not joined', () => {
    expect(relationshipOf(g({ phase: 'reg' }))).toBe('available')
  })
  it('null for a Running game you neither host nor play (no pill, no All)', () => {
    expect(relationshipOf(g({ phase: 'live' }))).toBeNull()
  })
})

describe('relationshipPills / defaultRelationship', () => {
  it('host sees Available · Playing · Hosting (in that order); default Hosting', () => {
    expect(relationshipPills(true)).toEqual(['available', 'playing', 'hosting'])
    expect(defaultRelationship(true)).toBe('hosting')
  })
  it('player sees Available · Playing only; default Playing', () => {
    expect(relationshipPills(false)).toEqual(['available', 'playing'])
    expect(defaultRelationship(false)).toBe('playing')
  })
})
