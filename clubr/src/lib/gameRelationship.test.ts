import { describe, it, expect } from 'vitest'
import { gameRelationship, hostedByMe, isGameHost, isGameCoHost } from './gameRelationship'

const g = { hostId: 'h1', coHostIds: ['c1', 'c2'] }

describe('isGameHost / isGameCoHost / hostedByMe', () => {
  it('isGameHost is the host only — never a co-host', () => {
    expect(isGameHost(g, 'h1')).toBe(true)
    expect(isGameHost(g, 'c1')).toBe(false)
    expect(isGameHost(g, '')).toBe(false)
  })
  it('isGameCoHost is a co-host who is NOT the host', () => {
    expect(isGameCoHost(g, 'c1')).toBe(true)
    expect(isGameCoHost(g, 'c2')).toBe(true)
    expect(isGameCoHost(g, 'h1')).toBe(false) // the host is not a "co-host"
    expect(isGameCoHost(g, 'nobody')).toBe(false)
  })
  it('hostedByMe stays host OR co-host', () => {
    expect(hostedByMe(g, 'h1')).toBe(true)
    expect(hostedByMe(g, 'c2')).toBe(true)
    expect(hostedByMe(g, 'someone')).toBe(false)
  })
})

const base = { isHost: false, isCoHost: false, hasEntry: false, entryPending: false, isMemberOfClub: true, registrationOpen: true }

describe('gameRelationship', () => {
  it('hosting wins (the actual host), even if also playing', () => {
    expect(gameRelationship({ ...base, isHost: true, hasEntry: true })).toBe('hosting')
  })

  it('cohost for a co-host (over playing) — they get the Co-host badge', () => {
    expect(gameRelationship({ ...base, isCoHost: true })).toBe('cohost')
    expect(gameRelationship({ ...base, isCoHost: true, hasEntry: true })).toBe('cohost')
  })

  it('playing when admitted (entry, not pending) and not host/co-host', () => {
    expect(gameRelationship({ ...base, hasEntry: true, entryPending: false })).toBe('playing')
  })

  it('waiting when the entry is still pending approval', () => {
    expect(gameRelationship({ ...base, hasEntry: true, entryPending: true })).toBe('waiting')
  })

  it('join when a club member and registration is open with no entry', () => {
    expect(gameRelationship(base)).toBe('join')
  })

  it('none when registration is closed or not a member', () => {
    expect(gameRelationship({ ...base, registrationOpen: false })).toBe('none')
    expect(gameRelationship({ ...base, isMemberOfClub: false })).toBe('none')
  })

  it('an admin who is only a member never shows hosting — by real participation', () => {
    expect(gameRelationship({ ...base, isHost: false, isCoHost: false, hasEntry: true })).toBe('playing')
    expect(gameRelationship({ ...base, isHost: false, isCoHost: false })).toBe('join')
  })
})
