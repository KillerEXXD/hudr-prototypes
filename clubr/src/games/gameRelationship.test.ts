import { describe, it, expect } from 'vitest'
import { relationshipOf, relationshipPills, defaultRelationship } from './gameRelationship'
import type { UnifiedGame } from './useUnifiedGames'

const g = (over: Partial<UnifiedGame>) =>
  ({ type: 'last_longer', id: 'x', clubId: 'c', canManage: false, iHost: false, iCoHost: false, finished: false, phase: 'reg', mine: false, pending: false, sort: 0, ...over } as unknown as UnifiedGame)

describe('relationshipOf', () => {
  it('hosting when you actually host it (even if you also play it)', () => {
    expect(relationshipOf(g({ iHost: true }))).toBe('hosting')
    expect(relationshipOf(g({ iHost: true, mine: true, phase: 'live' }))).toBe('hosting')
  })
  it('a CO-host (not the host) buckets into Playing, never Hosting', () => {
    expect(relationshipOf(g({ iCoHost: true, phase: 'live' }))).toBe('playing')             // co-host, not a player
    expect(relationshipOf(g({ iCoHost: true, mine: true, phase: 'live' }))).toBe('playing') // co-host who also plays
    expect(relationshipOf(g({ iCoHost: true, phase: 'reg' }))).toBe('playing')              // even on a reg-open game
  })
  it('playing when you joined it and do not host it', () => {
    expect(relationshipOf(g({ mine: true }))).toBe('playing')
    expect(relationshipOf(g({ mine: true, phase: 'live' }))).toBe('playing')
  })
  it('regression: a PENDING join request stays Available (waiting for approval), NOT Playing', () => {
    // You requested to join an Open game but aren't approved yet → still "available".
    expect(relationshipOf(g({ mine: true, pending: true, phase: 'reg' }))).toBe('available')
    // Once the host approves you (pending=false) it becomes "playing".
    expect(relationshipOf(g({ mine: true, pending: false, phase: 'reg' }))).toBe('playing')
  })
  it('regression: an App Admin / club-owner who can manage but does NOT host is Playing, not Hosting', () => {
    // canManage is true (admin/owner) but iHost false → bucket by REAL role.
    expect(relationshipOf(g({ canManage: true, iHost: false, mine: true, phase: 'live' }))).toBe('playing')
    // canManage true, not playing, Open → still joinable, never "Hosting".
    expect(relationshipOf(g({ canManage: true, iHost: false, mine: false, phase: 'reg' }))).toBe('available')
    // canManage true, Running, not playing → no bucket (oversight only).
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
