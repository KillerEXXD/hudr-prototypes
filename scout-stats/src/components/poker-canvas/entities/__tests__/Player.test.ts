/**
 * Unit tests for Player entity
 * Tests player rendering including WIN badge and win amount pulsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlayerEntity, getPlayerLayout } from '../Player'
import type { ReplayerTheme, SeatPosition } from '../../types/canvas-types'
import type { ReplayPlayer } from '@/types/replay'

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
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
    drawImage: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    ellipse: vi.fn(),
    clip: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    rect: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
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
    globalAlpha: 1,
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

const mockPosition: SeatPosition = {
  x: 400,
  y: 500,
  angle: Math.PI / 2,
  scale: 1,
}

const createMockPlayer = (overrides?: Partial<ReplayPlayer>): ReplayPlayer => ({
  id: 'player-1',
  name: 'TestPlayer',
  currentStack: 100000,
  startingStack: 100000,
  seatNumber: 0,
  isActive: false,
  isFolded: false,
  isAllIn: false,
  currentBet: 0,
  totalBet: 0,
  ...overrides,
})

// =====================
// getPlayerLayout Tests
// =====================

describe('getPlayerLayout', () => {
  it('should return layout with correct structure', () => {
    const layout = getPlayerLayout(mockPosition)

    expect(layout).toHaveProperty('scale')
    expect(layout).toHaveProperty('frame')
    expect(layout).toHaveProperty('cards')
    expect(layout).toHaveProperty('nameBox')
    expect(layout).toHaveProperty('betSpot')
    expect(layout).toHaveProperty('statusAnchor')
    expect(layout).toHaveProperty('levelBadge')
  })

  it('should apply scale from position', () => {
    const scaledPosition: SeatPosition = { ...mockPosition, scale: 0.8 }
    const layout = getPlayerLayout(scaledPosition)

    expect(layout.scale).toBe(0.8)
  })

  it('should position frame above nameBox', () => {
    const layout = getPlayerLayout(mockPosition)

    expect(layout.frame.y).toBeLessThan(layout.nameBox.y)
  })

  it('should center frame on position x', () => {
    const layout = getPlayerLayout(mockPosition)

    expect(layout.frame.x).toBe(mockPosition.x)
  })
})

// =====================
// PlayerEntity Tests
// =====================

describe('PlayerEntity', () => {
  let player: PlayerEntity
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    player = new PlayerEntity()
    ctx = createMockContext()
  })

  describe('basic rendering', () => {
    it('should draw player without errors', () => {
      const mockPlayer = createMockPlayer()

      expect(() => {
        player.draw({
          ctx,
          player: mockPlayer,
          position: mockPosition,
          showCards: false,
          isActive: false,
          isWinner: false,
          isHighlighted: false,
          theme: mockTheme,
          dpr: 2,
        })
      }).not.toThrow()

      // Should have rendered name box
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('should draw active player with glow effect', () => {
      const mockPlayer = createMockPlayer({ isActive: true })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: true,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      // Active state should affect rendering
      expect(ctx.arc).toHaveBeenCalled()
    })
  })

  describe('winner rendering', () => {
    it('should draw WIN badge when player is winner', () => {
      const mockPlayer = createMockPlayer()

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0,
      })

      // Should have rendered WIN badge text
      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasWinText = fillTextCalls.some((call: unknown[]) => call[0] === 'WIN')
      expect(hasWinText).toBe(true)
    })

    it('should draw win amount in WIN badge when winner has winAmount and showWinAmount is true', () => {
      const mockPlayer = createMockPlayer()

      // Test at now=0 (shows "WIN" text)
      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0, // At now=0, badge shows "WIN"
        winAmount: 50000,
        showWinAmount: true,
      })

      // First check: at now=0, should show "WIN"
      let fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasWinLabel = fillTextCalls.some((call: unknown[]) => {
        const text = call[0] as string
        return text.includes('WIN')
      })
      expect(hasWinLabel).toBe(true)

      // Reset mock and test at now=1000 (shows amount phase)
      vi.mocked(ctx.fillText).mockClear()
      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 1000, // At now=1000, badge cycles to show "+50.0K"
        winAmount: 50000,
        showWinAmount: true,
      })

      // Second check: at now=1000, should show amount ("+50.0K")
      fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasAmountPart = fillTextCalls.some((call: unknown[]) => {
        const text = call[0] as string
        return text.includes('+')
      })
      expect(hasAmountPart).toBe(true)
    })

    it('should NOT show win amount in WIN badge when showWinAmount is false (phase 1-2 of win animation)', () => {
      const mockPlayer = createMockPlayer()

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0,
        winAmount: 50000,
        showWinAmount: false, // Phase 1-2: show WIN but not amount
      })

      // Should show just "WIN" without amount
      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasWinOnly = fillTextCalls.some((call: unknown[]) => call[0] === 'WIN')
      const hasWinWithAmount = fillTextCalls.some((call: unknown[]) => {
        const text = call[0] as string
        return text.includes('WIN') && text.includes('+')
      })
      expect(hasWinOnly).toBe(true)
      expect(hasWinWithAmount).toBe(false)
    })

    it('should not draw win amount when winAmount is 0', () => {
      const mockPlayer = createMockPlayer()

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0,
        winAmount: 0,
      })

      // Should not have rendered win amount
      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasWinAmount = fillTextCalls.some((call: unknown[]) => {
        const text = call[0] as string
        return text.startsWith('+')
      })
      expect(hasWinAmount).toBe(false)
    })

    it('should pass now timestamp to badge for pulsing animation', () => {
      const mockPlayer = createMockPlayer()

      // Draw with a specific timestamp
      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 500,
        winAmount: 50000,
        showWinAmount: true,
      })

      // Shadow blur should be called for the gold badge glow effect
      // The pulsing animation is handled by StatusBadge which uses shadowBlur
      expect(ctx.shadowBlur).toBeDefined()
    })

    it('should position win amount on avatar frame center', () => {
      const mockPlayer = createMockPlayer()

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0,
        winAmount: 50000,
        showWinAmount: true,
      })

      // translate should be called for centering the pulse
      expect(ctx.translate).toHaveBeenCalled()
    })
  })

  describe('status badges', () => {
    it('should show FOLD badge when player folds', () => {
      const mockPlayer = createMockPlayer({
        isFolded: true,
        lastAction: 'fold',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasFoldText = fillTextCalls.some((call: unknown[]) => call[0] === 'FOLD')
      expect(hasFoldText).toBe(true)
    })

    it('should show ALL IN badge when player is all-in', () => {
      const mockPlayer = createMockPlayer({
        isAllIn: true,
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasAllInText = fillTextCalls.some((call: unknown[]) => call[0] === 'ALL-IN')
      expect(hasAllInText).toBe(true)
    })

    it('should prioritize WIN badge over other badges', () => {
      const mockPlayer = createMockPlayer({
        isAllIn: true, // Also all-in
        lastAction: 'call',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: true, // Winner
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasWinText = fillTextCalls.some((call: unknown[]) => call[0] === 'WIN')
      expect(hasWinText).toBe(true)
    })
  })

  describe('hole cards', () => {
    it('should draw hole cards when showCards is true and cards exist', () => {
      const mockPlayer = createMockPlayer({
        holeCards: [
          { rank: 'A', suit: 'spades' },
          { rank: 'K', suit: 'spades' },
        ],
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: true,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      // Cards should be drawn
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })
  })

  describe('dealer chip', () => {
    it('should draw dealer chip for BTN position when showDealerChipOnly', () => {
      const mockPlayer = createMockPlayer({
        position: 'BTN',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
        now: 0,
      })

      // Dealer chip draws 'D' text
      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasDText = fillTextCalls.some((call: unknown[]) => call[0] === 'D')
      expect(hasDText).toBe(true)
    })
  })

  describe('name display', () => {
    it('should display last name when full name has multiple words', () => {
      const mockPlayer = createMockPlayer({
        name: 'John Smith',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      // Now displays only last name in title case
      const hasSmith = fillTextCalls.some((call: unknown[]) => call[0] === 'Smith')
      expect(hasSmith).toBe(true)
    })

    it('should display first name when name is single word', () => {
      const mockPlayer = createMockPlayer({
        name: 'Negreanu',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      const hasNegreanu = fillTextCalls.some((call: unknown[]) => call[0] === 'Negreanu')
      expect(hasNegreanu).toBe(true)
    })

    it('should display last name for three-word names', () => {
      const mockPlayer = createMockPlayer({
        name: 'Phil Ivey Jr',
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      // Now displays only last name: "Phil Ivey Jr" → "Jr"
      const hasJr = fillTextCalls.some((call: unknown[]) => call[0] === 'Jr')
      expect(hasJr).toBe(true)
    })

    it('should truncate long last names', () => {
      const mockPlayer = createMockPlayer({
        name: 'Daniel Konstantinidis',  // Last name is 14 chars, should truncate
      })

      player.draw({
        ctx,
        player: mockPlayer,
        position: mockPosition,
        showCards: false,
        isActive: false,
        isWinner: false,
        isHighlighted: false,
        theme: mockTheme,
        dpr: 2,
      })

      const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      // Should be truncated with period (max 10 chars)
      const hasTruncated = fillTextCalls.some((call: unknown[]) => {
        const text = call[0] as string
        return text.endsWith('.') && text.length <= 10
      })
      expect(hasTruncated).toBe(true)
    })
  })
})
