import { describe, it, expect } from 'vitest'
import { resolveOnboarding, stageOf, tabsForStage, maxStage, stageRank, type OnboardingState } from './resolveOnboarding'

// QA Set 3 (09_navigation_ia + onboarding reveal) — progressive nav-reveal invariants,
// tagged to NAVX Test IDs. Pure footprint -> unlocked tabs.

const base: OnboardingState = { isAdmin: false, isMemberOfAnyClub: false, isHost: false, hasActiveGame: false, hasSettledGame: false }

describe('onboarding progressive reveal (Set 3 NAVX)', () => {
  it('[NAVX-001] fresh = no tabs (just "+"); every later stage = Home + Live (no Clubs/Games/Me tabs)', () => {
    expect(tabsForStage('fresh')).toEqual([])
    expect(tabsForStage('connected')).toEqual(['home', 'live'])
    expect(tabsForStage('playing')).toEqual(['home', 'live'])
    expect(tabsForStage('settled')).toEqual(['home', 'live'])
  })

  it('[NAVX] stageOf: member/host => connected; live game => playing; settled game => settled; else fresh', () => {
    expect(stageOf(base)).toBe('fresh')
    expect(stageOf({ ...base, isMemberOfAnyClub: true })).toBe('connected')
    expect(stageOf({ ...base, isHost: true })).toBe('connected')
    expect(stageOf({ ...base, isMemberOfAnyClub: true, hasActiveGame: true })).toBe('playing')
    expect(stageOf({ ...base, isMemberOfAnyClub: true, isHost: true, hasSettledGame: true })).toBe('settled')
  })

  it('[NAVX] a pending-only requester stays fresh (no tabs at all before real membership)', () => {
    expect(resolveOnboarding(base).unlockedTabs).toEqual([])
  })

  it('[NAVX] App Admins skip onboarding -> steady-state Home + Live', () => {
    expect(resolveOnboarding({ ...base, isAdmin: true }).unlockedTabs).toEqual(['home', 'live'])
  })

  it('[NAVX] reveal is monotonic (maxStage never regresses; ranks are ordered)', () => {
    expect(maxStage('settled', 'fresh')).toBe('settled')
    expect(maxStage('fresh', 'connected')).toBe('connected')
    expect(maxStage('playing', 'connected')).toBe('playing')
    expect(stageRank('fresh')).toBeLessThan(stageRank('connected'))
    expect(stageRank('connected')).toBeLessThan(stageRank('playing'))
    expect(stageRank('playing')).toBeLessThan(stageRank('settled'))
  })
})
