/**
 * Layout Debug Mock Data Generator
 *
 * Generates mock hand data for testing player layout positioning
 * across different table sizes (2-9 players).
 */

import type { Card, Suit, Rank } from '@/types/hand'
import type { HandReplay, ReplayPlayer, ReplayStep, ReplayState, ActionType } from '@/types/replay'

// =====================
// Types
// =====================

export type DebugScenario = 'all-betting' | 'showdown' | 'mixed'
export type CardSizeOption = 'S' | 'M' | 'L' | 'XL'

export interface LayoutDebugConfig {
  playerCount: number // 2-9
  scenario: DebugScenario
  showBets: boolean
  showWinAmounts: boolean
  showActionBadges: boolean
  showHoleCards: boolean
  showStacks: boolean
  cardSize: CardSizeOption // S=0.75x, M=1x, L=1.25x, XL=1.5x
  useImageCards: boolean
  showHandInfo: boolean // Show "Hand #1 - Tournament Name" (auto-enabled for showdown)
}

// Card size multipliers
export const CARD_SIZE_MULTIPLIERS: Record<CardSizeOption, number> = {
  'S': 0.75,
  'M': 1.0,
  'L': 1.25,
  'XL': 1.5,
}

// =====================
// Constants
// =====================

const PLAYER_NAMES = [
  'Negreanu', 'Ivey', 'Hellmuth', 'Dwan', 'Brunson',
  'Antonius', 'Galfond', 'Polk', 'Trickett'
]

const COUNTRY_CODES = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'BR', 'CN', 'RU']

// Full deck for generating random cards
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

// Different bet amounts to test positioning at each seat
const BET_AMOUNTS = [100000, 200000, 300000, 400000, 500000, 600000, 750000, 900000, 1000000]

// Win amounts for testing overlap
const WIN_AMOUNTS = [500000, 750000, 1000000, 1250000, 1500000]

// =====================
// Card Generation
// =====================

function generateDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// =====================
// Player Generation
// =====================

function generatePlayers(
  count: number,
  config: LayoutDebugConfig,
  deck: Card[]
): ReplayPlayer[] {
  const players: ReplayPlayer[] = []
  let cardIndex = 0

  // Position assignments based on player count
  const positions: ReplayPlayer['position'][] = count === 2
    ? ['BTN', 'BB']
    : count === 3
    ? ['BTN', 'SB', 'BB']
    : count === 4
    ? ['BTN', 'SB', 'BB', 'UTG']
    : count === 5
    ? ['BTN', 'SB', 'BB', 'UTG', 'CO']
    : count === 6
    ? ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
    : count === 7
    ? ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO']
    : count === 8
    ? ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO']
    : ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO']

  for (let i = 0; i < count; i++) {
    const holeCards: [Card, Card] = [deck[cardIndex++], deck[cardIndex++]]
    const startingStack = 5000000 + Math.floor(Math.random() * 5000000) // 5M - 10M
    const betAmount = config.showBets ? BET_AMOUNTS[i % BET_AMOUNTS.length] : 0

    // Determine action based on scenario
    let lastAction: ActionType | undefined
    let isFolded = false
    let isAllIn = false

    if (config.scenario === 'all-betting') {
      // Everyone is betting/calling
      lastAction = i === 0 ? 'raise' : 'call'
    } else if (config.scenario === 'showdown') {
      // Showdown - some winners
      lastAction = i < 2 ? 'show' : 'call'
    } else {
      // Mixed - first 2 players always active (raise/call), rest alternate fold/call
      const minActive = 2
      if (i >= minActive && i % 2 === 0) {
        lastAction = 'fold'
        isFolded = true
      } else if (i === 0) {
        lastAction = 'raise'
      } else {
        lastAction = 'call'
      }
    }

    players.push({
      id: `player-${i}`,
      name: PLAYER_NAMES[i % PLAYER_NAMES.length],
      countryCode: COUNTRY_CODES[i % COUNTRY_CODES.length],
      seatNumber: i,
      startingStack,
      currentStack: startingStack - betAmount,
      holeCards: config.showHoleCards ? holeCards : undefined,
      position: positions[i],
      isActive: !isFolded,
      isFolded,
      isAllIn,
      currentBet: betAmount,
      totalBet: betAmount,
      lastAction: config.showActionBadges ? lastAction : undefined,
    })
  }

  return players
}

// =====================
// Step Generation
// =====================

function generateDebugStep(
  players: ReplayPlayer[],
  config: LayoutDebugConfig
): ReplayStep {
  // Calculate pot from all bets
  const pot = players.reduce((sum, p) => sum + p.currentBet, 0) + 500000 // Add base pot

  // Community cards for showdown and mixed scenarios
  const showBoard = config.scenario === 'showdown' || config.scenario === 'mixed'
  const communityCards: Card[] = showBoard
    ? [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
        { rank: '10', suit: 'spades' },
      ]
    : []

  // Winners for showdown and mixed scenarios
  const winnerIds = showBoard && config.showWinAmounts
    ? config.scenario === 'showdown'
      ? [players[0].id, players[1].id] // Split pot for showdown
      : [players[0].id]                // Single winner for mixed
    : []

  const winnings: Record<string, number> = {}
  if (winnerIds.length > 0) {
    const winAmount = WIN_AMOUNTS[Math.floor(Math.random() * WIN_AMOUNTS.length)]
    winnerIds.forEach((id, idx) => {
      winnings[id] = winAmount + idx * 100000 // Slightly different amounts
    })
  }

  const state: ReplayState = {
    street: showBoard ? 'showdown' : 'flop',
    pot,
    communityCards,
    players: players.map(p => ({ ...p })),
    actions: [],
    activePlayerIndex: null,
    winnerIds,
    winnings,
    showWinAmount: config.showWinAmounts && winnerIds.length > 0,
  }

  return {
    stepNumber: 1,
    description: 'Layout Debug Mode',
    state,
  }
}

// =====================
// Main Generator
// =====================

export function generateLayoutDebugHandData(config: LayoutDebugConfig): HandReplay {
  const deck = shuffleDeck(generateDeck())
  const players = generatePlayers(config.playerCount, config, deck)
  const step = generateDebugStep(players, config)

  // For showdown, use a realistic tournament name for testing hand info display
  const tournamentName = config.scenario === 'showdown' || config.showHandInfo
    ? 'WSOP $10K Main Event'
    : `Layout Debug - ${config.playerCount} Players`

  return {
    handId: `debug-${config.playerCount}-players`,
    handNumber: 42, // Specific number for testing display
    tournamentName,
    gameType: 'NLH',
    blinds: {
      smallBlind: 25000,
      bigBlind: 50000,
      ante: 50000,
    },
    initialPlayers: players,
    steps: [step],
    createdAt: new Date(),
  }
}

// =====================
// Default Config
// =====================

export const defaultDebugConfig: LayoutDebugConfig = {
  playerCount: 6,
  scenario: 'all-betting',
  showBets: true,
  showWinAmounts: false,
  showActionBadges: true,
  showHoleCards: true,
  showStacks: true,
  cardSize: 'M',
  useImageCards: true,
  showHandInfo: false,
}
