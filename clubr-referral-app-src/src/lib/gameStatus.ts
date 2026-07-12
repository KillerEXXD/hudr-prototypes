/**
 * Single source of truth for the game lifecycle badge, shared by all three
 * games (FT Fantasy, Last Longer, Squares) so their status wording can never
 * drift apart again. (CLAUDE.md invariant #7: one canonical constants module.)
 *
 * Canonical lifecycle: registration → live → completed (or → cancelled).
 *   - 'registration' — sign-up / draft / claiming phase is open.
 *   - 'live'         — registration closed; game in play.
 *   - 'completed'    — results are in.
 *   - 'cancelled'    — host voided the game (with a reason); no winner.
 *
 * The phase only advances when the server/host transitions the game (host
 * action), NOT when a client-side countdown hits zero — see CLAUDE.md
 * invariant #2 (no business logic in the browser). The registration countdown
 * elapsing is purely informational; the badge keeps reading "Registration
 * open" until the host locks the game and the server reports the new status.
 */
export type GamePhase = 'registration' | 'live' | 'completed' | 'cancelled'

export type LifecycleTone = 'blue' | 'green' | 'dark' | 'red'

export interface LifecycleBadge {
  tone: LifecycleTone
  label: string
  /** True only for the in-play phase — drives the pulsing red "live now" dot. */
  live: boolean
}

const LIFECYCLE_BADGES: Record<GamePhase, LifecycleBadge> = {
  registration: { tone: 'blue', label: 'Registration open', live: false },
  live: { tone: 'green', label: 'Running', live: true },
  completed: { tone: 'dark', label: 'Finished', live: false },
  cancelled: { tone: 'red', label: 'Cancelled', live: false },
}

/** Unified badge (tone + label) for a canonical lifecycle phase. */
export function lifecycleBadge(phase: GamePhase): LifecycleBadge {
  return LIFECYCLE_BADGES[phase]
}

/**
 * Normalize FT Fantasy's own status enum (open | locked | settled) onto the
 * canonical lifecycle so it shows the SAME badge as Last Longer & Squares.
 * Last Longer and Squares already use the canonical enum, so they call
 * `lifecycleBadge(status)` directly.
 */
export function ftPhase(status: 'open' | 'locked' | 'settled' | 'cancelled'): GamePhase {
  return status === 'open' ? 'registration' : status === 'locked' ? 'live' : status === 'cancelled' ? 'cancelled' : 'completed'
}
