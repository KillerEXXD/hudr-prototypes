export interface Highlight {
  id: string
  hand: number
  type: 'biggest_pot' | 'bluff' | 'elimination' | 'hero_call' | 'cooler' | 'bad_beat'
  tier: 'monster' | 'air' | 'strong' | 'medium'
  board: string
  preview: string
  pot: number
  players: string[]
  ytTime: number
}

export interface QuizHand {
  id: string
  hand: number
  situation: string
  facing: string
  holeCards: [string, string]
  board: string[]
  street: 'Preflop' | 'Flop' | 'Turn' | 'River'
  pot: string
  action: string
  options: string[]
  correct: number
  proAction: string
  proName: string
  equity: number
  explanation: string
  proPercent: number
}

export interface GambitTheme {
  id: string
  name: string
  icon: string
  hand: number
  desc: string
  color: string
}

export interface BluffReport {
  hand: number
  bluffer: string
  victim: string
  street: string
  sizing: string
  holding: string
  board: string[]
  result: 'fold' | 'call'
  success: boolean
}

// ---- Card model (used by the ported poker-canvas replayer) ----
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '?'

export interface Card {
  rank: Rank
  suit: Suit
}

export interface Hand {
  id: string
  position: number
  playerName: string
  cards: [Card, Card]
  isActive?: boolean
}

export const getSuitSymbol = (suit: Suit): string => {
  switch (suit) {
    case 'hearts': return '♥'
    case 'diamonds': return '♦'
    case 'clubs': return '♣'
    case 'spades': return '♠'
  }
}

export const getSuitColor = (suit: Suit): string =>
  suit === 'hearts' || suit === 'diamonds' ? '#ef4444' : '#ffffff'

export const getSuitColorForPlayingCard = (suit: Suit): string =>
  suit === 'hearts' || suit === 'diamonds' ? '#ef4444' : '#000000'
