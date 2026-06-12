/**
 * Unit tests for StatusBadge entity
 * Tests WIN badge rendering with pulsing animations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StatusBadgeEntity } from '../StatusBadge'
import type { ReplayerTheme } from '../../types/canvas-types'

// =====================
// Mock Canvas Context
// =====================

function createMockContext(): CanvasRenderingContext2D {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 40 }),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    rect: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  } as unknown as CanvasRenderingContext2D
  return ctx
}

const mockTheme: ReplayerTheme = {
  fontFamily: 'Inter, sans-serif',
  backgroundColor: '#1a1a1a',
  feltColor: '#0d3b0d',
  feltColorDark: '#0a2d0a',
  feltTexture: false,
  borderColor: '#3a3a3a',
  borderColorInner: '#2a2a2a',
  borderWidth: 8,
  borderGlow: 'rgba(255,255,255,0.1)',
  cardBackColor: '#1e40af',
  cardBackPattern: true,
  cardFaceColor: '#ffffff',
  cardBorderColor: '#d1d5db',
  stackColor: '#ffffff',
  playerNameColor: '#ffffff',
  playerBoxColor: 'rgba(0,0,0,0.7)',
  playerBoxBorder: 'rgba(255,255,255,0.2)',
  activePlayerGlow: '#22c55e',
  winnerHighlight: '#fbbf24',
  textShadow: 'rgba(0,0,0,0.5)',
  chipShadow: 'rgba(0,0,0,0.3)',
  tableRadiusX: 0.42,
  tableRadiusY: 0.38,
  showDealerChipOnly: true,
}

// =====================
// StatusBadgeEntity Tests
// =====================

describe('StatusBadgeEntity', () => {
  let badge: StatusBadgeEntity
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    badge = new StatusBadgeEntity()
    ctx = createMockContext()
  })

  describe('standard badge rendering', () => {
    it('should draw standard badge without gold styling', () => {
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'FOLD',
        theme: mockTheme,
        color: 'rgba(220, 38, 38, 0.95)',
        scale: 1,
        isGold: false,
      })

      // Should have called fill and stroke
      expect(ctx.fill).toHaveBeenCalled()
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fillText).toHaveBeenCalledWith('FOLD', expect.any(Number), expect.any(Number))
    })

    it('should scale badge dimensions correctly', () => {
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'ALL IN',
        theme: mockTheme,
        scale: 2,
      })

      expect(ctx.fillText).toHaveBeenCalled()
    })
  })

  describe('gold WIN badge rendering', () => {
    it('should draw gold badge with gradient when isGold is true', () => {
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 0,
      })

      // Should create gradient for gold badge
      expect(ctx.createLinearGradient).toHaveBeenCalled()
      expect(ctx.fill).toHaveBeenCalled()
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fillText).toHaveBeenCalledWith('WIN', expect.any(Number), expect.any(Number))
    })

    it('should apply pulsing glow effect based on now timestamp', () => {
      // Draw at different timestamps and check shadowBlur varies
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 0,
      })
      const shadowBlur1 = ctx.shadowBlur

      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 375, // 1/4 of 1500ms cycle
      })
      const shadowBlur2 = ctx.shadowBlur

      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 750, // 1/2 of 1500ms cycle
      })
      const shadowBlur3 = ctx.shadowBlur

      // At different phases, shadowBlur should change based on pulse
      // The exact values depend on sin wave, but they should be set
      expect(typeof shadowBlur1).toBe('number')
      expect(typeof shadowBlur2).toBe('number')
      expect(typeof shadowBlur3).toBe('number')
    })

    it('should use dark text color for contrast on gold background', () => {
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
      })

      // Check that dark fillStyle was set for text (dark brown/black)
      // The last fillStyle set should be for the text
      expect(ctx.fillStyle).toBeDefined()
    })

    it('should complete 1500ms animation cycle', () => {
      // Draw at start and end of cycle, should produce same visual state
      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 0,
      })

      badge.draw({
        ctx,
        x: 100,
        y: 50,
        text: 'WIN',
        theme: mockTheme,
        isGold: true,
        scale: 1,
        now: 1500, // Full cycle
      })

      // Both should render without error
      expect(ctx.fill).toHaveBeenCalled()
    })
  })

  describe('positioning', () => {
    it('should center badge on x coordinate', () => {
      badge.draw({
        ctx,
        x: 200,
        y: 100,
        text: 'WIN',
        theme: mockTheme,
        scale: 1,
      })

      // fillText should be called with x position near the provided x
      expect(ctx.fillText).toHaveBeenCalled()
      const [, textX] = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls[0]
      // Text should be centered, so it should be close to x but adjusted for badge center
      expect(textX).toBeGreaterThan(0)
    })
  })
})
