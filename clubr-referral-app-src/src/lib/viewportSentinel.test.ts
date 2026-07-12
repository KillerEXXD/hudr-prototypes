import { describe, it, expect } from 'vitest'
import { isZoomed, overflowPx, selectorOf } from './viewportSentinel'

describe('viewportSentinel decision helpers', () => {
  it('isZoomed: only flags a visual scale that deviates from 1 (locked viewport)', () => {
    expect(isZoomed(1)).toBe(false)
    expect(isZoomed(1.005)).toBe(false) // within tolerance
    expect(isZoomed(1.3)).toBe(true) // iOS auto-zoom regression
    expect(isZoomed(0.9)).toBe(true) // collapsed
  })

  it('overflowPx: reports horizontal overflow, clamped at 0', () => {
    expect(overflowPx(390, 390)).toBe(0)
    expect(overflowPx(420, 390)).toBe(30) // content pushed 30px wider than the screen
    expect(overflowPx(388, 390)).toBe(0) // never negative
    expect(overflowPx(390.6, 390)).toBe(1) // rounds
  })

  it('selectorOf: builds a short, attributable selector (tag#id.class [label])', () => {
    const btn = document.createElement('button')
    btn.id = 'send'
    btn.className = 'flex h-9 w-9'
    btn.setAttribute('aria-label', 'Send')
    expect(selectorOf(btn)).toBe('button#send.flex.h-9 [Send]')

    const plain = document.createElement('input')
    expect(selectorOf(plain)).toBe('input')

    expect(selectorOf(null)).toBe('')
    expect(selectorOf(undefined)).toBe('')
  })
})
