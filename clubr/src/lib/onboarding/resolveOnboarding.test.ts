import { describe, it, expect } from 'vitest'
import { resolveOnboarding, stageOf, tabsForStage, maxStage, type OnboardingState } from './resolveOnboarding'

const base: OnboardingState = { isAdmin: false, isMemberOfAnyClub: false, isHost: false, hasSettledGame: false }

describe('resolveOnboarding — nav reveal', () => {
  it('fresh user: Home only (no empty Clubs/Games/Me)', () => {
    const r = resolveOnboarding(base)
    expect(r.stage).toBe('fresh')
    expect(r.unlockedTabs).toEqual(['home'])
  })

  it('a PENDING-only request does not unlock anything (member=false)', () => {
    // pending request => isMemberOfAnyClub stays false => still fresh
    expect(resolveOnboarding({ ...base, isMemberOfAnyClub: false }).unlockedTabs).toEqual(['home'])
  })

  it('confirmed club member: Clubs + Games appear together', () => {
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true })
    expect(r.stage).toBe('connected')
    expect(r.unlockedTabs).toEqual(['home', 'clubs', 'games'])
  })

  it('host (owns a club) is connected even with no membership flag', () => {
    expect(resolveOnboarding({ ...base, isHost: true }).unlockedTabs).toEqual(['home', 'clubs', 'games'])
  })

  it('Me appears only after the first settled game', () => {
    expect(resolveOnboarding({ ...base, isMemberOfAnyClub: true }).unlockedTabs).not.toContain('me')
    const r = resolveOnboarding({ ...base, isMemberOfAnyClub: true, hasSettledGame: true })
    expect(r.stage).toBe('settled')
    expect(r.unlockedTabs).toEqual(['home', 'clubs', 'games', 'me'])
  })

  it('App Admin gets the full nav regardless of footprint', () => {
    expect(resolveOnboarding({ ...base, isAdmin: true }).unlockedTabs).toEqual(['home', 'clubs', 'games', 'me'])
  })
})

describe('stage helpers', () => {
  it('stageOf maps footprint → stage', () => {
    expect(stageOf(base)).toBe('fresh')
    expect(stageOf({ ...base, isHost: true })).toBe('connected')
    expect(stageOf({ ...base, hasSettledGame: true })).toBe('settled')
  })
  it('tabsForStage is cumulative', () => {
    expect(tabsForStage('fresh')).toEqual(['home'])
    expect(tabsForStage('connected')).toEqual(['home', 'clubs', 'games'])
    expect(tabsForStage('settled')).toEqual(['home', 'clubs', 'games', 'me'])
  })
  it('maxStage never goes backwards (monotonic)', () => {
    expect(maxStage('connected', 'fresh')).toBe('connected')
    expect(maxStage('fresh', 'settled')).toBe('settled')
    expect(maxStage('connected', 'connected')).toBe('connected')
  })
})
