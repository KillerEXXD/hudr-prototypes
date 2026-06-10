/**
 * Unit tests for playerColors.ts
 */

import { describe, it, expect } from 'vitest'
import { generateAvatarColor, lighten, countryFlags } from '../playerColors'
import type { ReplayPlayer } from '@/types/replay'

// =====================
// Helper
// =====================

function makePlayer(id: string): ReplayPlayer {
  return {
    id,
    name: 'Test',
    seatNumber: 1,
    startingStack: 1000,
    currentStack: 1000,
    position: 'BTN',
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    totalBet: 0,
  }
}

// =====================
// generateAvatarColor Tests
// =====================

describe('generateAvatarColor', () => {
  it('should return an hsl color string', () => {
    const color = generateAvatarColor(makePlayer('player-abc'))
    expect(color).toMatch(/^hsl\(\d+deg 60% 50%\)$/)
  })

  it('should return deterministic color for same id', () => {
    const p = makePlayer('player-123')
    expect(generateAvatarColor(p)).toBe(generateAvatarColor(p))
  })

  it('should return different colors for different ids', () => {
    const c1 = generateAvatarColor(makePlayer('aaa'))
    const c2 = generateAvatarColor(makePlayer('zzz'))
    expect(c1).not.toBe(c2)
  })

  it('should produce hue between 0 and 359', () => {
    const color = generateAvatarColor(makePlayer('test'))
    const hue = parseInt(color.match(/^hsl\((\d+)deg/)![1])
    expect(hue).toBeGreaterThanOrEqual(0)
    expect(hue).toBeLessThan(360)
  })
})

// =====================
// lighten Tests
// =====================

describe('lighten', () => {
  it('should increase lightness of hsl color', () => {
    const result = lighten('hsl(180deg 60% 50%)', 0.2)
    expect(result).toBe('hsl(180deg 60% 70%)')
  })

  it('should cap lightness at 100%', () => {
    const result = lighten('hsl(180deg 60% 90%)', 0.5)
    expect(result).toBe('hsl(180deg 60% 100%)')
  })

  it('should return non-hsl colors unchanged', () => {
    expect(lighten('#ff0000', 0.2)).toBe('#ff0000')
    expect(lighten('rgb(255,0,0)', 0.2)).toBe('rgb(255,0,0)')
  })

  it('should handle zero amount', () => {
    const result = lighten('hsl(180deg 60% 50%)', 0)
    expect(result).toBe('hsl(180deg 60% 50%)')
  })
})

// =====================
// countryFlags Tests
// =====================

describe('countryFlags', () => {
  it('should contain US flag', () => {
    expect(countryFlags['US']).toBeDefined()
    expect(countryFlags['US']).toBe(countryFlags['USA'])
  })

  it('should contain UK/GB flags', () => {
    expect(countryFlags['GB']).toBeDefined()
    expect(countryFlags['GB']).toBe(countryFlags['UK'])
  })

  it('should contain common poker nations', () => {
    const nations = ['CA', 'AU', 'DE', 'FR', 'BR', 'JP', 'CN']
    for (const code of nations) {
      expect(countryFlags[code]).toBeDefined()
    }
  })

  it('should return undefined for unknown codes', () => {
    expect(countryFlags['XX']).toBeUndefined()
  })

  it('should have at least 30 entries', () => {
    expect(Object.keys(countryFlags).length).toBeGreaterThanOrEqual(30)
  })
})
