import { describe, it, expect } from 'vitest'
import { resolveOnboarding, stageOf, tabsForStage, maxStage, type OnboardingState } from './resolveOnboarding'

const base: OnboardingState = { isAdmin: false, isMemberOfAnyClub: false, isHost: false, hasActiveGame: false, hasSettledGame: false }

describe('resolveOnboarding — slow-reveal nav', () => {
  it('fresh user: Home only (the nav is hidden — no empty Clubs/Games)', () => {
    const r = resolveOnboarding(base)
    expect(r.stage).toBe('fresh')
    expect(r.unlockedTabs).toEqual(['home'])
  })

  it('a PENDING-only request does not unlock anything (member=false)', () => {
    expect(resolveOnboarding({ ...base, isMemberOfAnyClub: false }).unlockedTabs).toEqual(['home'])
  })

  it('confirmed club member: Home + Clubs (NO Games yet — you find games in a club)', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true })
    expect(r.stage).toBe('connected')
    expect(r.unlockedTabs).toEqual(['home', 'clubs'])
    expect(r.unlockedTabs).not.toContain('games')
  })

  it('host (owns a club) is connected — Home + Clubs', () => {
    expect(resolveOnboarding({ ...base, isHost: true }).unlockedTabs).toEqual(['home', 'clubs'])
  })

  it('an approved, live game (playing) unlocks the Games tab', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true, hasActiveGame: true })
    expect(r.stage).toBe('playing')
    expect(r.unlockedTabs).toEqual(['home', 'clubs', 'games'])
  })

  it('settled keeps Home + Clubs + Games and NEVER adds a Me tab', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true, hasSettledGame: true })
    expect(r.stage).toBe('settled')
    expect(r.unlockedTabs).toEqual(['home', 'clubs', 'games'])
    expect(r.unlockedTabs).not.toContain('me')
  })

  it('App Admin gets the full nav (incl. Me) regardless of footprint', () => {
    expect(resolveOnboarding({ ...base, isAdmin: true }).unlockedTabs).toEqual(['home', 'clubs', 'games', 'me'])
  })
})

describe('stage helpers', () => {
  it('stageOf maps footprint → stage', () => {
    expect(stageOf(base)).toBe('fresh')
    expect(stageOf({ ...base, isHost: true })).toBe('connected')
    expect(stageOf({ ...base, isMemberOfAnyClub: true, hasActiveGame: true })).toBe('playing')
    expect(stageOf({ ...base, hasSettledGame: true })).toBe('settled')
  })
  it('tabsForStage reveals one tab at a time; Me is never a player/host tab', () => {
    expect(tabsForStage('fresh')).toEqual(['home'])
    expect(tabsForStage('connected')).toEqual(['home', 'clubs'])
    expect(tabsForStage('playing')).toEqual(['home', 'clubs', 'games'])
    expect(tabsForStage('settled')).toEqual(['home', 'clubs', 'games'])
  })
  it('maxStage never goes backwards (monotonic)', () => {
    expect(maxStage('connected', 'fresh')).toBe('connected')
    expect(maxStage('fresh', 'settled')).toBe('settled')
    expect(maxStage('playing', 'connected')).toBe('playing')
    expect(maxStage('connected', 'connected')).toBe('connected')
  })
})
