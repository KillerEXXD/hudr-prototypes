/**
 * Unit tests for coordinate utilities
 * Tests dynamic seat positioning around the perspective poker table
 */

import { describe, it, expect } from 'vitest'
import {
  buildSeatPositions,
  calculateDynamicSeatPositions,
  getSeatPositionNormalized,
} from '../utils/coordinates'

// =====================
// calculateDynamicSeatPositions Tests
// =====================

describe('calculateDynamicSeatPositions', () => {
  it('should return correct number of positions for each player count', () => {
    for (let count = 2; count <= 10; count++) {
      const positions = calculateDynamicSeatPositions(count)
      expect(positions).toHaveLength(count)
    }
  })

  it('should clamp player count to minimum of 2', () => {
    const positions = calculateDynamicSeatPositions(1)
    expect(positions).toHaveLength(2)
  })

  it('should clamp player count to maximum of 10', () => {
    const positions = calculateDynamicSeatPositions(15)
    expect(positions).toHaveLength(10)
  })

  it('should place first seat at bottom center (hero position)', () => {
    for (let count = 2; count <= 9; count++) {
      const positions = calculateDynamicSeatPositions(count)
      const [x, y] = positions[0]
      // Bottom center should be around x=50 and y > 80 (near bottom)
      expect(x).toBeCloseTo(50, 0)
      expect(y).toBeGreaterThan(80)
    }
  })

  it('should distribute seats evenly around the table for 2 players (heads-up)', () => {
    const positions = calculateDynamicSeatPositions(2)
    expect(positions).toHaveLength(2)

    // Seat 0: bottom center
    expect(positions[0][0]).toBeCloseTo(50, 0)
    expect(positions[0][1]).toBeGreaterThan(80)

    // Seat 1: top center (opposite)
    expect(positions[1][0]).toBeCloseTo(50, 0)
    expect(positions[1][1]).toBeLessThan(20)
  })

  it('should distribute seats going LEFT on screen (clockwise around physical table)', () => {
    const positions = calculateDynamicSeatPositions(4)
    // 4 players: seats go LEFT on screen from bottom (clockwise around physical table)
    // From BTN's perspective: bottom -> left -> top -> right

    // Seat 0: bottom center (y high)
    expect(positions[0][1]).toBeGreaterThan(80)

    // Seat 1: left side (x < 20) - clockwise from BTN goes LEFT on screen
    expect(positions[1][0]).toBeLessThan(20)

    // Seat 2: top (y low)
    expect(positions[2][1]).toBeLessThan(20)

    // Seat 3: right side (x > 80)
    expect(positions[3][0]).toBeGreaterThan(80)
  })

  it('should return fixed 10-seat layout for 10 players', () => {
    const positions = calculateDynamicSeatPositions(10)
    expect(positions).toHaveLength(10)

    // First position should be bottom center (hero)
    expect(positions[0][0]).toBe(50)
    expect(positions[0][1]).toBe(93)
  })

  it('should return positions within valid percentage range (0-100)', () => {
    for (let count = 2; count <= 10; count++) {
      const positions = calculateDynamicSeatPositions(count)
      positions.forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(100)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(100)
      })
    }
  })
})

// =====================
// buildSeatPositions Tests
// =====================

describe('buildSeatPositions', () => {
  const testWidth = 800
  const testHeight = 600

  it('should return empty array for invalid dimensions', () => {
    expect(buildSeatPositions(0, 600)).toEqual([])
    expect(buildSeatPositions(800, 0)).toEqual([])
    expect(buildSeatPositions(-100, 600)).toEqual([])
    expect(buildSeatPositions(NaN, 600)).toEqual([])
    expect(buildSeatPositions(800, Infinity)).toEqual([])
  })

  it('should return 10 positions by default (fixed layout)', () => {
    const positions = buildSeatPositions(testWidth, testHeight)
    expect(positions).toHaveLength(10)
  })

  it('should return dynamic positions when playerCount is specified', () => {
    const positions = buildSeatPositions(testWidth, testHeight, { playerCount: 6 })
    expect(positions).toHaveLength(6)
  })

  it('should convert percentage coordinates to pixel coordinates', () => {
    const positions = buildSeatPositions(testWidth, testHeight, { playerCount: 2 })

    // First position should be bottom center (50%, ~93%)
    const [first] = positions
    expect(first.x).toBeCloseTo(testWidth / 2, 0) // 50% of 800 = 400
    expect(first.y).toBeGreaterThan(testHeight * 0.8) // > 80% of 600
  })

  it('should include angle and scale in returned positions', () => {
    const positions = buildSeatPositions(testWidth, testHeight, { playerCount: 4 })

    positions.forEach((pos) => {
      expect(pos).toHaveProperty('x')
      expect(pos).toHaveProperty('y')
      expect(pos).toHaveProperty('angle')
      expect(pos).toHaveProperty('scale')
      expect(typeof pos.angle).toBe('number')
      expect(typeof pos.scale).toBe('number')
    })
  })

  it('should apply perspective scale based on Y position', () => {
    const positions = buildSeatPositions(testWidth, testHeight, { playerCount: 2 })

    // Bottom seat (larger scale) vs top seat (smaller scale)
    const bottomSeat = positions[0]
    const topSeat = positions[1]

    expect(bottomSeat.scale).toBeGreaterThan(topSeat.scale)
  })

  it('should support legacy array format for overrides', () => {
    const overrides = [{ x: 50, y: 50 }]
    const positions = buildSeatPositions(testWidth, testHeight, overrides)

    // Should still return 10 positions (fixed layout with override for first)
    expect(positions).toHaveLength(10)
    expect(positions[0].x).toBe(testWidth / 2)
    expect(positions[0].y).toBe(testHeight / 2)
  })

  it('should allow custom overrides for specific seats', () => {
    const positions = buildSeatPositions(testWidth, testHeight, {
      playerCount: 4,
      overrides: [
        { x: 25, y: 75 }, // Override seat 0
        undefined,
        { x: 75, y: 25 }, // Override seat 2
      ],
    })

    expect(positions[0].x).toBe(testWidth * 0.25)
    expect(positions[0].y).toBe(testHeight * 0.75)
    expect(positions[2].x).toBe(testWidth * 0.75)
    expect(positions[2].y).toBe(testHeight * 0.25)
  })
})

// =====================
// getSeatPositionNormalized Tests
// =====================

describe('getSeatPositionNormalized', () => {
  it('should return normalized position for valid seat indices', () => {
    for (let i = 0; i < 10; i++) {
      const pos = getSeatPositionNormalized(i)
      expect(pos).toHaveProperty('x')
      expect(pos).toHaveProperty('y')
      expect(pos).toHaveProperty('angle')
      expect(pos).toHaveProperty('scale')
    }
  })

  it('should clamp seat index to valid range', () => {
    const posNegative = getSeatPositionNormalized(-1)
    const pos0 = getSeatPositionNormalized(0)
    expect(posNegative.x).toBe(pos0.x)
    expect(posNegative.y).toBe(pos0.y)

    const pos10 = getSeatPositionNormalized(10)
    const pos9 = getSeatPositionNormalized(9)
    expect(pos10.x).toBe(pos9.x)
    expect(pos10.y).toBe(pos9.y)
  })

  it('should return hero position (seat 0) at bottom center', () => {
    const heroPos = getSeatPositionNormalized(0)
    expect(heroPos.x).toBe(50)
    expect(heroPos.y).toBe(93)
  })
})
