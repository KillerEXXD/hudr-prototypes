// Progressive onboarding — the pure resolver mapping the user's footprint to the
// unlocked bottom-nav tabs, so the app grows as they do. See
// docs/ONBOARDING_PROGRESSIVE_DISCLOSURE.md.
//
// Slow-reveal order:
//   • fresh (no club) → Home only → the nav is HIDDEN (a lone tab looks broken).
//   • connected (a CONFIRMED club member or a host — never a pending request) →
//     Home + Clubs. NOTE: Games does NOT appear yet — you find games inside a club.
//   • playing (an approved, live game entry) → + Games. The tab earns its place once
//     you actually have a game to track.
//   • settled (a finished game) → same tabs, steady state.
// 'Me' is NEVER a player/host tab — profile/settings/logout live on the Header avatar
// from minute one (only App Admins get a Me/console tab, via the admin branch below).
// Reveal is monotonic — the caller never lets it regress below the furthest stage
// reached — EXCEPT a fully-emptied account, which the hook resets to 'fresh'.

export type OnboardingStage = 'fresh' | 'connected' | 'playing' | 'settled'
export type NavTab = 'home' | 'clubs' | 'games' | 'me'

export interface OnboardingState {
  /** App Admins skip onboarding entirely — full nav. */
  isAdmin: boolean
  /** Confirmed member (or owner) of at least one club — NOT a pending request. */
  isMemberOfAnyClub: boolean
  /** Created/owns or co-hosts a club (host fast-lane — owners are instant members). */
  isHost: boolean
  /** Has an approved, live game entry (playing now — not a pending request, not just hosting). */
  hasActiveGame: boolean
  /** Has entered a game that has completed (a full loop). */
  hasSettledGame: boolean
}

export interface OnboardingResult {
  stage: OnboardingStage
  unlockedTabs: NavTab[]
}

const STAGE_ORDER: OnboardingStage[] = ['fresh', 'connected', 'playing', 'settled']

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
  if (s.hasActiveGame) return 'playing'
  if (s.isMemberOfAnyClub || s.isHost) return 'connected'
  return 'fresh'
}

/**
 * The unlocked tabs for a given stage. Home is always present; Clubs at 'connected';
 * Games only once you're 'playing' (or 'settled'). 'Me' is never here — it's the Header
 * avatar for players/hosts (admins get it via the resolve() admin branch instead).
 */
export function tabsForStage(stage: OnboardingStage): NavTab[] {
  const tabs: NavTab[] = ['home']
  if (stageRank(stage) >= stageRank('connected')) tabs.push('clubs')
  if (stageRank(stage) >= stageRank('playing')) tabs.push('games')
  return tabs
}

/** Pure resolve: footprint → { stage, unlockedTabs }. Admins get the full nav (incl. Me). */
export function resolveOnboarding(s: OnboardingState): OnboardingResult {
  if (s.isAdmin) return { stage: 'settled', unlockedTabs: ['home', 'clubs', 'games', 'me'] }
  const stage = stageOf(s)
  return { stage, unlockedTabs: tabsForStage(stage) }
}
