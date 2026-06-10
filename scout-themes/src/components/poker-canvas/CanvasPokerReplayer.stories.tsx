import type { Meta, StoryObj } from '@storybook/react'
import { CanvasPokerReplayer } from './CanvasPokerReplayer'
import { sampleHandReplay } from '@/data/sampleHandReplay'
import { sample10PlayerHand } from '@/data/sample10PlayerHand'
import type { HandReplay, ReplayPlayer } from '@/types/replay'

// Wrapper component to constrain dimensions
function StoryWrapper({ children, width = 420 }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="flex items-center justify-center p-4" style={{ minHeight: '100vh' }}>
      <div style={{ width, maxWidth: '100%' }}>{children}</div>
    </div>
  )
}

// Player names for generating test hands
const PLAYER_NAMES = [
  'Kyle J.', 'Alex M.', 'Sarah P.', 'Mike T.', 'Emma L.',
  'James W.', 'Lisa R.', 'David K.', 'Amy C.', 'Tom B.',
]

const POSITIONS: Record<number, ReplayPlayer['position'][]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'UTG'],
  5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'CO'],
  9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'],
  10: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'HJ', 'CO'],
}

// Map player count to evenly distributed seat numbers around the 10-seat table
const SEAT_DISTRIBUTION: Record<number, number[]> = {
  2: [0, 9],           // bottom and top
  3: [0, 4, 8],        // bottom, top-left, bottom-right
  4: [0, 3, 6, 9],     // bottom, left-upper, right-upper, top
  5: [0, 2, 4, 6, 8],  // evenly around left/right
  6: [0, 2, 4, 5, 7, 9], // distributed around table
  7: [0, 1, 3, 4, 6, 7, 9],
  8: [0, 1, 2, 4, 5, 7, 8, 9],
  9: [0, 1, 2, 3, 5, 6, 7, 8, 9],
  10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // all seats
}

// Generate a test hand with N players distributed around the table
function generateTestHand(playerCount: number): HandReplay {
  const seatNumbers = SEAT_DISTRIBUTION[playerCount] || Array.from({ length: playerCount }, (_, i) => i)
  const players: ReplayPlayer[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i + 1}`,
    name: PLAYER_NAMES[i] || `Player ${i + 1}`,
    seatNumber: seatNumbers[i],
    startingStack: 20000 + Math.floor(Math.random() * 30000),
    currentStack: 20000 + Math.floor(Math.random() * 30000),
    holeCards: [
      { rank: ['A', 'K', 'Q', 'J', '10', '9', '8', '7'][Math.floor(Math.random() * 8)] as any, suit: ['hearts', 'diamonds', 'clubs', 'spades'][Math.floor(Math.random() * 4)] as any },
      { rank: ['A', 'K', 'Q', 'J', '10', '9', '8', '7'][Math.floor(Math.random() * 8)] as any, suit: ['hearts', 'diamonds', 'clubs', 'spades'][Math.floor(Math.random() * 4)] as any },
    ],
    position: POSITIONS[playerCount]?.[i] || 'UTG',
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    totalBet: 0,
  }))

  return {
    handId: `test-${playerCount}-players`,
    gameType: 'NLH',
    blinds: { smallBlind: 100, bigBlind: 200 },
    initialPlayers: [],
    createdAt: new Date(),
    steps: [
      {
        stepNumber: 0,
        description: `${playerCount}-player table`,
        state: {
          street: 'preflop',
          pot: 300,
          communityCards: [],
          players,
          actions: [],
          activePlayerIndex: 0,
          winnerIds: [],
          winnings: {},
        },
      },
    ],
  }
}

const meta = {
  title: 'Poker/CanvasPokerReplayer',
  component: CanvasPokerReplayer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'darker', value: '#020617' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    autoplay: { control: 'boolean' },
    initialSpeed: { control: { type: 'range', min: 0.5, max: 3, step: 0.1 } },
    soundEnabled: { control: 'boolean' },
  },
} satisfies Meta<typeof CanvasPokerReplayer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    handData: sampleHandReplay,
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const Portrait: Story = {
  args: {
    handData: sampleHandReplay,
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper width={380}>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const Mobile: Story = {
  args: {
    handData: sampleHandReplay,
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <StoryWrapper width={360}>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const Autoplay: Story = {
  args: {
    handData: sampleHandReplay,
    autoplay: true,
    initialSpeed: 1.5,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const Muted: Story = {
  args: {
    handData: sampleHandReplay,
    soundEnabled: false,
    autoplay: true,
    initialSpeed: 1,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const Landscape: Story = {
  args: {
    handData: sampleHandReplay,
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper width={800}>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const TenPlayers: Story = {
  args: {
    handData: sample10PlayerHand,
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const TwoPlayers: Story = {
  args: {
    handData: generateTestHand(2),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const ThreePlayers: Story = {
  args: {
    handData: generateTestHand(3),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const FourPlayers: Story = {
  args: {
    handData: generateTestHand(4),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const FivePlayers: Story = {
  args: {
    handData: generateTestHand(5),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const SixPlayers: Story = {
  args: {
    handData: generateTestHand(6),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const SevenPlayers: Story = {
  args: {
    handData: generateTestHand(7),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const EightPlayers: Story = {
  args: {
    handData: generateTestHand(8),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}

export const NinePlayers: Story = {
  args: {
    handData: generateTestHand(9),
    autoplay: false,
    initialSpeed: 1,
    showControls: true,
  },
  render: (args) => (
    <StoryWrapper>
      <CanvasPokerReplayer {...args} />
    </StoryWrapper>
  ),
}
