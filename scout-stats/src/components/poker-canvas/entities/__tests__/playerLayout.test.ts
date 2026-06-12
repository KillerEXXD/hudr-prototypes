/**
 * Unit tests for playerLayout.ts
 */

import { describe, it, expect } from 'vitest'
import { getPlayerLayout } from '../playerLayout'
import type { SeatPosition } from '../../types/canvas-types'

// =====================
// Helpers
// =====================

const baseSeat: SeatPosition = {
  x: 200,
  y: 300,
  angle: 0,
  scale: 1,
}

// =====================
// getPlayerLayout Tests
// =====================

describe('getPlayerLayout', () => {
  it('should return layout object with all expected keys', () => {
    const layout = getPlayerLayout(baseSeat)
    expect(layout).toHaveProperty('scale')
    expect(layout).toHaveProperty('frame')
    expect(layout).toHaveProperty('cards')
    expect(layout).toHaveProperty('nameBox')
    expect(layout).toHaveProperty('betSpot')
    expect(layout).toHaveProperty('statusAnchor')
    expect(layout).toHaveProperty('isTopPosition')
    expect(layout).toHaveProperty('isBottomPosition')
    expect(layout).toHaveProperty('levelBadge')
  })

  it('should use scale from position', () => {
    const layout = getPlayerLayout({ ...baseSeat, scale: 0.8 })
    expect(layout.scale).toBe(0.8)
  })

  it('should default scale to 1 when undefined', () => {
    const { scale: _, ...noScale } = baseSeat
    const layout = getPlayerLayout(noScale as SeatPosition)
    expect(layout.scale).toBe(1)
  })

  it('should return two card slots', () => {
    const layout = getPlayerLayout(baseSeat)
    expect(layout.cards).toHaveLength(2)
    expect(layout.cards[0]).toHaveProperty('x')
    expect(layout.cards[0]).toHaveProperty('y')
    expect(layout.cards[0]).toHaveProperty('width')
    expect(layout.cards[0]).toHaveProperty('height')
    expect(layout.cards[0]).toHaveProperty('rotation')
  })

  it('should accept options object with canvasHeight', () => {
    const layout = getPlayerLayout({
      position: baseSeat,
      canvasHeight: 600,
    })
    expect(layout).toHaveProperty('frame')
  })

  it('should detect top position when y < 35% of canvas', () => {
    const layout = getPlayerLayout({
      position: { ...baseSeat, y: 50 },
      canvasHeight: 600,
    })
    expect(layout.isTopPosition).toBe(true)
    expect(layout.isBottomPosition).toBe(false)
  })

  it('should detect bottom position when y > 65% of canvas', () => {
    const layout = getPlayerLayout({
      position: { ...baseSeat, y: 500 },
      canvasHeight: 600,
    })
    expect(layout.isTopPosition).toBe(false)
    expect(layout.isBottomPosition).toBe(true)
  })

  it('should detect middle position', () => {
    const layout = getPlayerLayout({
      position: { ...baseSeat, y: 300 },
      canvasHeight: 600,
    })
    expect(layout.isTopPosition).toBe(false)
    expect(layout.isBottomPosition).toBe(false)
  })

  it('should use larger card dimensions when useImageCards is true', () => {
    const normal = getPlayerLayout({ position: baseSeat })
    const large = getPlayerLayout({ position: baseSeat, useImageCards: true })
    expect(large.cards[0].width).toBeGreaterThan(normal.cards[0].width)
    expect(large.cards[0].height).toBeGreaterThan(normal.cards[0].height)
  })

  it('should apply cardScale multiplier', () => {
    const base = getPlayerLayout({ position: baseSeat })
    const scaled = getPlayerLayout({ position: baseSeat, cardScale: 2 })
    expect(scaled.cards[0].width).toBeCloseTo(base.cards[0].width * 2, 0)
  })

  it('should scale frame radius with position scale', () => {
    const layout1 = getPlayerLayout({ ...baseSeat, scale: 1 })
    const layout2 = getPlayerLayout({ ...baseSeat, scale: 0.5 })
    expect(layout2.frame.radius).toBeCloseTo(layout1.frame.radius * 0.5, 0)
  })

  it('should position bet for bottom players above the player (toward center)', () => {
    const layout = getPlayerLayout({
      position: { ...baseSeat, y: 500 },
      canvasHeight: 600,
      canvasWidth: 400,
    })
    expect(layout.betSpot.y).toBeLessThan(500)
  })

  it('should position bet for top players below the player (toward center)', () => {
    const layout = getPlayerLayout({
      position: { ...baseSeat, y: 50 },
      canvasHeight: 600,
      canvasWidth: 400,
    })
    expect(layout.betSpot.y).toBeGreaterThan(50)
  })

  it('should position bet for left-side player to the right (toward center)', () => {
    const layout = getPlayerLayout({
      position: { x: 30, y: 300, angle: Math.PI, scale: 1 },
      canvasHeight: 600,
      canvasWidth: 400,
    })
    expect(layout.betSpot.x).toBeGreaterThan(30)
  })

  it('should position bet for right-side player to the left (toward center)', () => {
    const layout = getPlayerLayout({
      position: { x: 370, y: 300, angle: 0, scale: 1 },
      canvasHeight: 600,
      canvasWidth: 400,
    })
    expect(layout.betSpot.x).toBeLessThan(370)
  })

  it('BUG-394: bet clears avatar frame on mobile (430px wide)', () => {
    // SB at bottom-left on 430x873 mobile screen
    const layout = getPlayerLayout({
      position: { x: 69, y: 646, angle: Math.atan2(74 - 50, 16 - 50), scale: 0.96 },
      canvasHeight: 873,
      canvasWidth: 430,
    })
    // Bet should be at least frameRadius (~27px) away from position
    const dx = layout.betSpot.x - 69
    const dy = layout.betSpot.y - 646
    const dist = Math.sqrt(dx * dx + dy * dy)
    expect(dist).toBeGreaterThan(40) // Must clear avatar
  })
})
