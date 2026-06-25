import { describe, it, expect } from 'vitest'
import { resolveOnboarding, stageOf, tabsForStage, maxStage, type OnboardingState } from './resolveOnboarding'

const base: OnboardingState = { isAdmin: false, isMemberOfAnyClub: false, isHost: false, hasActiveGame: false, hasSettledGame: false }

describe('resolveOnboarding — slow-reveal nav', () => {
  it('fresh user: NO tabs (just the center "+")', () => {
    const r = resolveOnboarding(base)
    expect(r.stage).toBe('fresh')
    expect(r.unlockedTabs).toEqual([])
  })

  it('a PENDING-only request does not unlock anything (still fresh → no tabs)', () => {
    expect(resolveOnboarding({ ...base, isMemberOfAnyClub: false }).unlockedTabs).toEqual([])
  })

  it('confirmed club member: Home + Live (no Clubs/Games tabs ever)', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true })
    expect(r.stage).toBe('connected')
    expect(r.unlockedTabs).toEqual(['home', 'live'])
    expect(r.unlockedTabs).not.toContain('clubs')
    expect(r.unlockedTabs).not.toContain('games')
  })

  it('host (owns a club) is connected — Home + Live', () => {
    expect(resolveOnboarding({ ...base, isHost: true }).unlockedTabs).toEqual(['home', 'live'])
  })

  it('playing keeps the steady-state Home + Live', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true, hasActiveGame: true })
    expect(r.stage).toBe('playing')
    expect(r.unlockedTabs).toEqual(['home', 'live'])
  })

  it('settled keeps Home + Live and NEVER adds a Me tab', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true, hasSettledGame: true })
    expect(r.stage).toBe('settled')
    expect(r.unlockedTabs).toEqual(['home', 'live'])
    expect(r.unlockedTabs).not.toContain('me')
  })

  it('App Admin gets the steady-state Home + Live regardless of footprint', () => {
    expect(resolveOnboarding({ ...base, isAdmin: true }).unlockedTabs).toEqual(['home', 'live'])
  })
})

describe('stage helpers', () => {
  it('stageOf maps footprint → stage', () => {
    expect(stageOf(base)).toBe('fresh')
    expect(stageOf({ ...base, isHost: true })).toBe('connected')
    expect(stageOf({ ...base, isMemberOfAnyClub: true, hasActiveGame: true })).toBe('playing')
    expect(stageOf({ ...base, hasSettledGame: true })).toBe('settled')
  })
  it('tabsForStage: fresh = none (just "+"); every later stage = Home + Live', () => {
    expect(tabsForStage('fresh')).toEqual([])
    expect(tabsForStage('connected')).toEqual(['home', 'live'])
    expect(tabsForStage('playing')).toEqual(['home', 'live'])
    expect(tabsForStage('settled')).toEqual(['home', 'live'])
  })
  it('maxStage never goes backwards (monotonic)', () => {
    expect(maxStage('connected', 'fresh')).toBe('connected')
    expect(maxStage('fresh', 'settled')).toBe('settled')
    expect(maxStage('playing', 'connected')).toBe('playing')
    expect(maxStage('connected', 'connected')).toBe('connected')
  })
})
