/**
 * Unit tests for debugDataBuilder.ts
 */

import { describe, it, expect } from 'vitest'
import { buildDebugData, formatDebugText } from '../debugDataBuilder'
import type { ReplayerDebugData } from '../debugDataBuilder'
import type { HandReplay, ReplayStep, ReplayPlayer } from '@/types/replay'
import type { Card } from '@/types/hand'

// =====================
// Test Fixtures
// =====================

const mockCard: Card = { rank: 'A', suit: 'hearts' }
const mockCard2: Card = { rank: 'K', suit: 'spades' }

const mockPlayer: ReplayPlayer = {
  id: 'p1',
  name: 'Ivey',
  seatNumber: 1,
  startingStack: 5000,
  currentStack: 4500,
  position: 'BTN',
  isActive: true,
  isFolded: false,
  isAllIn: false,
  currentBet: 500,
  totalBet: 500,
  holeCards: [mockCard, mockCard2],
  lastAction: 'raise',
}

const mockPlayer2: ReplayPlayer = {
  id: 'p2',
  name: 'Negreanu',
  seatNumber: 3,
  startingStack: 3000,
  currentStack: 2500,
  position: 'BB',
  isActive: true,
  isFolded: false,
  isAllIn: false,
  currentBet: 500,
  totalBet: 500,
  holeCards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }],
  lastAction: 'call',
}

const mockStep: ReplayStep = {
  stepNumber: 3,
  description: 'Ivey raises to 500',
  highlightedPlayerId: 'p1',
  state: {
    street: 'preflop',
    pot: 1500,
    communityCards: [],
    players: [mockPlayer, mockPlayer2],
    actions: [
      { playerId: 'p1', action: 'raise', amount: 500, timestamp: 1000 },
      { playerId: 'p2', action: 'call', amount: 500, timestamp: 2000 },
    ],
    activePlayerIndex: 0,
    winnerIds: [],
    winnings: {},
  },
}

const mockHand: HandReplay = {
  handId: 'hand-123',
  gameType: 'NLH',
  blinds: { smallBlind: 100, bigBlind: 200, ante: 25 },
  initialPlayers: [mockPlayer, mockPlayer2],
  steps: [mockStep],
  createdAt: new Date('2025-06-15T12:00:00Z'),
}

const baseOptions = {
  hudrVersion: '1.2.0',
  hudrBuildDate: '2025-06-15',
  hand: mockHand,
  step: mockStep,
  stepIndex: 2,
  totalSteps: 10,
  dimensions: { width: 800, height: 600 },
  isPlaying: true,
  speed: 1.5,
  isFullscreen: false,
  soundOn: true,
}

// =====================
// buildDebugData Tests
// =====================

describe('buildDebugData', () => {
  it('should populate all top-level fields', () => {
    const result = buildDebugData(baseOptions)

    expect(result.hudrVersion).toBe('1.2.0')
    expect(result.hudrBuildDate).toBe('2025-06-15')
    expect(result.handId).toBe('hand-123')
    expect(result.gameType).toBe('NLH')
    expect(result.totalSteps).toBe(10)
    expect(result.isPlaying).toBe(true)
    expect(result.speed).toBe(1.5)
    expect(result.isFullscreen).toBe(false)
    expect(result.soundEnabled).toBe(true)
  })

  it('should populate blinds from hand', () => {
    const result = buildDebugData(baseOptions)

    expect(result.blinds.smallBlind).toBe(100)
    expect(result.blinds.bigBlind).toBe(200)
    expect(result.blinds.ante).toBe(25)
  })

  it('should populate dimensions', () => {
    const result = buildDebugData(baseOptions)

    expect(result.dimensions).toEqual({ width: 800, height: 600 })
  })

  it('should map initialPlayers from hand', () => {
    const result = buildDebugData(baseOptions)

    expect(result.initialPlayers).toHaveLength(2)
    expect(result.initialPlayers[0].id).toBe('p1')
    expect(result.initialPlayers[0].name).toBe('Ivey')
    expect(result.initialPlayers[0].seatNumber).toBe(1)
    expect(result.initialPlayers[0].position).toBe('BTN')
    expect(result.initialPlayers[0].startingStack).toBe(5000)
    expect(result.initialPlayers[0].holeCards).toEqual([mockCard, mockCard2])
  })

  it('should populate currentStep from step state', () => {
    const result = buildDebugData(baseOptions)

    expect(result.currentStep.stepIndex).toBe(2)
    expect(result.currentStep.stepNumber).toBe(3)
    expect(result.currentStep.description).toBe('Ivey raises to 500')
    expect(result.currentStep.highlightedPlayerId).toBe('p1')
    expect(result.currentStep.street).toBe('preflop')
    expect(result.currentStep.pot).toBe(1500)
    expect(result.currentStep.communityCards).toEqual([])
    expect(result.currentStep.activePlayerIndex).toBe(0)
    expect(result.currentStep.winnerIds).toEqual([])
    expect(result.currentStep.winnings).toEqual({})
  })

  it('should map actions from step state', () => {
    const result = buildDebugData(baseOptions)

    expect(result.actions).toHaveLength(2)
    expect(result.actions[0]).toEqual({
      playerId: 'p1',
      action: 'raise',
      amount: 500,
      timestamp: 1000,
    })
    expect(result.actions[1]).toEqual({
      playerId: 'p2',
      action: 'call',
      amount: 500,
      timestamp: 2000,
    })
  })

  it('should map players from step state', () => {
    const result = buildDebugData(baseOptions)

    expect(result.players).toHaveLength(2)
    expect(result.players[0].id).toBe('p1')
    expect(result.players[0].currentStack).toBe(4500)
    expect(result.players[0].isActive).toBe(true)
    expect(result.players[0].isFolded).toBe(false)
    expect(result.players[0].isAllIn).toBe(false)
    expect(result.players[0].currentBet).toBe(500)
    expect(result.players[0].totalBet).toBe(500)
    expect(result.players[0].lastAction).toBe('raise')
  })

  it('should handle undefined hand gracefully', () => {
    const result = buildDebugData({ ...baseOptions, hand: undefined })

    expect(result.handId).toBe('N/A')
    expect(result.gameType).toBe('N/A')
    expect(result.blinds).toEqual({ smallBlind: 0, bigBlind: 0 })
    expect(result.createdAt).toBe('N/A')
    expect(result.initialPlayers).toEqual([])
  })

  it('should handle undefined step gracefully', () => {
    const result = buildDebugData({ ...baseOptions, step: undefined })

    expect(result.currentStep.stepNumber).toBe(0)
    expect(result.currentStep.description).toBe('N/A')
    expect(result.currentStep.street).toBe('N/A')
    expect(result.currentStep.pot).toBe(0)
    expect(result.currentStep.communityCards).toEqual([])
    expect(result.currentStep.activePlayerIndex).toBeNull()
    expect(result.currentStep.winnerIds).toEqual([])
    expect(result.currentStep.winnings).toEqual({})
    expect(result.actions).toEqual([])
    expect(result.players).toEqual([])
  })

  it('should handle both hand and step undefined', () => {
    const result = buildDebugData({
      ...baseOptions,
      hand: undefined,
      step: undefined,
    })

    expect(result.handId).toBe('N/A')
    expect(result.initialPlayers).toEqual([])
    expect(result.players).toEqual([])
    expect(result.actions).toEqual([])
  })

  it('should map soundOn to soundEnabled', () => {
    const resultOn = buildDebugData({ ...baseOptions, soundOn: true })
    expect(resultOn.soundEnabled).toBe(true)

    const resultOff = buildDebugData({ ...baseOptions, soundOn: false })
    expect(resultOff.soundEnabled).toBe(false)
  })

  it('should populate createdAt as ISO string', () => {
    const result = buildDebugData(baseOptions)
    expect(result.createdAt).toBe('2025-06-15T12:00:00.000Z')
  })

  it('should include environment info', () => {
    const result = buildDebugData(baseOptions)
    // In test environment these will be real values from jsdom/node
    expect(typeof result.url).toBe('string')
    expect(typeof result.timestamp).toBe('string')
    expect(typeof result.userAgent).toBe('string')
    expect(typeof result.screenSize).toBe('string')
  })
})

// =====================
// formatDebugText Tests
// =====================

describe('formatDebugText', () => {
  const sampleData: ReplayerDebugData = {
    hudrVersion: '1.2.0',
    hudrBuildDate: '2025-06-15',
    url: 'http://localhost:5173/hand/123',
    timestamp: '2025-06-15T12:00:00.000Z',
    userAgent: 'TestAgent',
    screenSize: '1920x1080',
    handId: 'hand-123',
    gameType: 'NLH',
    blinds: { smallBlind: 100, bigBlind: 200, ante: 25 },
    createdAt: '2025-06-15T12:00:00.000Z',
    initialPlayers: [
      { id: 'p1', name: 'Ivey', seatNumber: 1, position: 'BTN', startingStack: 5000, holeCards: [mockCard, mockCard2] },
      { id: 'p2', name: 'Negreanu', seatNumber: 3, position: 'BB', startingStack: 3000 },
    ],
    currentStep: {
      stepIndex: 2,
      stepNumber: 3,
      description: 'Ivey raises to 500',
      highlightedPlayerId: 'p1',
      street: 'preflop',
      pot: 1500,
      communityCards: [],
      activePlayerIndex: 0,
      winnerIds: [],
      winnings: {},
    },
    actions: [
      { playerId: 'p1', action: 'raise', amount: 500, timestamp: 1000 },
      { playerId: 'p2', action: 'call', amount: 500, timestamp: 2000 },
    ],
    players: [
      {
        id: 'p1', name: 'Ivey', seatNumber: 1, position: 'BTN',
        currentStack: 4500, startingStack: 5000,
        holeCards: [mockCard, mockCard2],
        isActive: true, isFolded: false, isAllIn: false,
        currentBet: 500, totalBet: 500, lastAction: 'raise',
      },
      {
        id: 'p2', name: 'Negreanu', seatNumber: 3, position: 'BB',
        currentStack: 2500, startingStack: 3000,
        isActive: true, isFolded: false, isAllIn: false,
        currentBet: 500, totalBet: 500, lastAction: 'call',
      },
    ],
    totalSteps: 10,
    dimensions: { width: 800, height: 600 },
    isPlaying: true,
    speed: 1.5,
    isFullscreen: false,
    soundEnabled: true,
  }

  it('should include header', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('=== POKER REPLAYER DEBUG DATA ===')
  })

  it('should include version info', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('HUDR Version: 1.2.0 (Build: 2025-06-15)')
  })

  it('should include hand info section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('HAND INFO:')
    expect(text).toContain('Hand ID: hand-123')
    expect(text).toContain('Game Type: NLH')
    expect(text).toContain('Blinds: 100/200 (ante: 25)')
    expect(text).toContain('Total Players: 2')
  })

  it('should format blinds without ante when absent', () => {
    const noAnte = { ...sampleData, blinds: { smallBlind: 50, bigBlind: 100 } }
    const text = formatDebugText(noAnte)
    expect(text).toContain('Blinds: 50/100')
    expect(text).not.toContain('ante')
  })

  it('should include initial players section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('INITIAL PLAYERS (at hand start):')
    expect(text).toContain('[Seat 1] Ivey (BTN) - Stack: 5000 - Cards: Ahearts Kspades')
    expect(text).toContain('[Seat 3] Negreanu (BB) - Stack: 3000')
  })

  it('should include current step section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('CURRENT STEP (2/9):')
    expect(text).toContain('Description: Ivey raises to 500')
    expect(text).toContain('Street: preflop')
    expect(text).toContain('Pot: 1500')
  })

  it('should show community cards when present', () => {
    const withCards = {
      ...sampleData,
      currentStep: {
        ...sampleData.currentStep,
        communityCards: [
          { rank: 'A' as const, suit: 'hearts' as const },
          { rank: 'K' as const, suit: 'diamonds' as const },
          { rank: 'Q' as const, suit: 'spades' as const },
        ],
      },
    }
    const text = formatDebugText(withCards)
    expect(text).toContain('Community Cards: Ahearts Kdiamonds Qspades')
  })

  it('should show "None" for empty community cards', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('Community Cards: None')
  })

  it('should include actions section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('ACTIONS IN STEP:')
    expect(text).toContain('p1: raise 500')
    expect(text).toContain('p2: call 500')
  })

  it('should show "(No actions)" when actions empty', () => {
    const noActions = { ...sampleData, actions: [] }
    const text = formatDebugText(noActions)
    expect(text).toContain('(No actions)')
  })

  it('should include player states section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('CURRENT PLAYER STATES:')
    expect(text).toContain('[Seat 1] Ivey (BTN)')
    expect(text).toContain('Stack: 4500 (started: 5000)')
    expect(text).toContain('Cards: Ahearts Kspades')
  })

  it('should show "Hidden" for players without hole cards', () => {
    const text = formatDebugText(sampleData)
    // Negreanu (p2) has no holeCards in the players array
    expect(text).toContain('Cards: Hidden')
  })

  it('should show correct player status', () => {
    const withFolded = {
      ...sampleData,
      players: [
        { ...sampleData.players[0], isFolded: true, isActive: false },
        { ...sampleData.players[1], isAllIn: true },
      ],
    }
    const text = formatDebugText(withFolded)
    expect(text).toContain('Status: FOLDED')
    expect(text).toContain('Status: ALL-IN')
  })

  it('should include playback state section', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('PLAYBACK STATE:')
    expect(text).toContain('Playing: true')
    expect(text).toContain('Speed: 1.5x')
    expect(text).toContain('Dimensions: 800x600')
    expect(text).toContain('Fullscreen: false')
    expect(text).toContain('Sound: true')
  })

  it('should include raw JSON at end', () => {
    const text = formatDebugText(sampleData)
    expect(text).toContain('=== RAW JSON (for developers) ===')
    // JSON should be valid and contain handId
    const jsonStr = text.split('=== RAW JSON (for developers) ===\n')[1]
    const parsed = JSON.parse(jsonStr)
    expect(parsed.handId).toBe('hand-123')
  })

  it('should show winners when present', () => {
    const withWinners = {
      ...sampleData,
      currentStep: {
        ...sampleData.currentStep,
        winnerIds: ['p1'],
        winnings: { p1: 3000 },
      },
    }
    const text = formatDebugText(withWinners)
    expect(text).toContain('Winners: p1')
    expect(text).toContain('"p1":3000')
  })
})
