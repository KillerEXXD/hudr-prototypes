import { describe, it, expect } from 'vitest'
import { lifecycleBadge, ftPhase } from './gameStatus'

describe('lifecycleBadge', () => {
  it('maps each canonical phase to the unified tone + label', () => {
    expect(lifecycleBadge('registration')).toEqual({ tone: 'blue', label: 'Registration open', live: false })
    expect(lifecycleBadge('live')).toEqual({ tone: 'green', label: 'Running', live: true })
    expect(lifecycleBadge('completed')).toEqual({ tone: 'dark', label: 'Completed', live: false })
  })

  it('flags only the in-play phase as live (for the pulsing dot)', () => {
    expect(lifecycleBadge('live').live).toBe(true)
    expect(lifecycleBadge('registration').live).toBe(false)
    expect(lifecycleBadge('completed').live).toBe(false)
  })
})

describe('ftPhase', () => {
  it('normalizes FT Fantasy status onto the canonical lifecycle', () => {
    expect(ftPhase('open')).toBe('registration')
    expect(ftPhase('locked')).toBe('live')
    expect(ftPhase('settled')).toBe('completed')
  })
})

describe('cross-game lifecycle consistency', () => {
  // The whole point of this change: FT Fantasy, Last Longer and Squares must
  // render an IDENTICAL badge for the same lifecycle phase. (Last Longer and
  // Squares use the canonical enum directly; FT maps via ftPhase.)
  it('FT, Last Longer and Squares share the same badge per phase', () => {
    // registration: FT 'open' === LL/Squares 'registration'
    expect(lifecycleBadge(ftPhase('open'))).toEqual(lifecycleBadge('registration'))
    // live: FT 'locked' === LL/Squares 'live'
    expect(lifecycleBadge(ftPhase('locked'))).toEqual(lifecycleBadge('live'))
    // completed: FT 'settled' === LL/Squares 'completed'
    expect(lifecycleBadge(ftPhase('settled'))).toEqual(lifecycleBadge('completed'))
  })
})
