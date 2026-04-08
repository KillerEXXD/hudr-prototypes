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
