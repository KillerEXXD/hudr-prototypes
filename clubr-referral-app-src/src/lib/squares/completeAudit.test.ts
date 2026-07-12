import { describe, it, expect } from 'vitest'
import { squaresCompleteAudit } from './completeAudit'

describe('squaresCompleteAudit', () => {
  it('blocks while still in registration (board not locked)', () => {
    const a = squaresCompleteAudit('registration', false)
    expect(a).not.toBeNull()
    expect(a?.blockers[0]).toMatch(/locked/i)
  })

  it('blocks while live until the Final score is entered', () => {
    const a = squaresCompleteAudit('live', false)
    expect(a).not.toBeNull()
    expect(a?.blockers[0]).toMatch(/Final score/i)
  })

  it('returns null once the Final score is in (the game auto-completes)', () => {
    expect(squaresCompleteAudit('live', true)).toBeNull()
    expect(squaresCompleteAudit('completed', true)).toBeNull()
  })
})
