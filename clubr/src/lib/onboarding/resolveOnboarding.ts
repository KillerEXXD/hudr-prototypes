// Progressive onboarding — the pure Next-Best-Action resolver (Phase 1: nav reveal).
// See docs/ONBOARDING_PROGRESSIVE_DISCLOSURE.md. One deterministic function maps the
// user's footprint to the unlocked bottom-nav tabs, so the app grows as they do.
//
// Reveal order (this app's 4-tab nav): Home is always present (the coach surface);
// Clubs + Games appear together once you're a CONFIRMED club member or a host (never
// on a pending request — a lonely tab looks broken, so we reveal two at once); Me
// appears after your first settled game (before that, /me is reachable via the Header
// avatar, so settings/logout are never locked). Reveal is monotonic — the caller never
// lets it regress below the furthest stage reached.

export type OnboardingStage = 'fresh' | 'connected' | 'settled'
export type NavTab = 'home' | 'clubs' | 'games' | 'me'

export interface OnboardingState {
  /** App Admins skip onboarding entirely — full nav. */
  isAdmin: boolean
  /** Confirmed member (or owner) of at least one club — NOT a pending request. */
  isMemberOfAnyClub: boolean
  /** Created/owns or co-hosts a club (host fast-lane — owners are instant members). */
  isHost: boolean
  /** Has entered a game that has completed (a full loop). */
  hasSettledGame: boolean
}

export interface OnboardingResult {
  stage: OnboardingStage
  unlockedTabs: NavTab[]
}

const STAGE_ORDER: OnboardingStage[] = ['fresh', 'connected', 'settled']

/** Ordinal for monotonic comparison (higher = further along). */
export function stageRank(s: OnboardingStage): number {
  return STAGE_ORDER.indexOf(s)
}

/** The greater of two stages (used by the hook to enforce monotonic reveal). */
export function maxStage(a: OnboardingStage, b: OnboardingStage): OnboardingStage {
  return stageRank(a) >= stageRank(b) ? a : b
}

/** The viewer's current stage from their footprint (ignores history/monotonicity). */
export function stageOf(s: OnboardingState): OnboardingStage {
  if (s.hasSettledGame) return 'settled'
  if (s.isMemberOfAnyClub || s.isHost) return 'connected'
  return 'fresh'
}

/** The unlocked tabs for a given stage. */
export function tabsForStage(stage: OnboardingStage): NavTab[] {
  const tabs: NavTab[] = ['home']
  if (stageRank(stage) >= stageRank('connected')) tabs.push('clubs', 'games')
  if (stageRank(stage) >= stageRank('settled')) tabs.push('me')
  return tabs
}

/** Pure resolve: footprint → { stage, unlockedTabs }. Admins get the full nav. */
export function resolveOnboarding(s: OnboardingState): OnboardingResult {
  if (s.isAdmin) return { stage: 'settled', unlockedTabs: ['home', 'clubs', 'games', 'me'] }
  const stage = stageOf(s)
  return { stage, unlockedTabs: tabsForStage(stage) }
}
