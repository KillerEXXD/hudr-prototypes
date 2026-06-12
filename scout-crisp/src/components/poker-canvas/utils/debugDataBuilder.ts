/**
 * Debug Data Builder
 *
 * Pure utility functions for building debug/diagnostic text
 * from poker replayer state. Used by bug report modal and debug panels.
 */

import type { HandReplay, ReplayStep, ReplayPlayer } from '@/types/replay'
import type { Card } from '@/types/hand'

// =====================
// Types
// =====================

export interface ReplayerDebugData {
  hudrVersion: string
  hudrBuildDate: string
  url: string
  timestamp: string
  userAgent: string
  screenSize: string
  handId: string
  gameType: string
  blinds: { smallBlind: number; bigBlind: number; ante?: number }
  createdAt: string
  // Enriched context for debugging
  tournamentId?: string
  tournamentName?: string
  handStatus?: string
  apiStatus?: {
    httpStatus: number | null
    loadSuccess: boolean
    transformError?: string
    transformErrorCode?: string
    errorMessage?: string
  }
  missingDataFlags?: string[]
  sentryReplayUrl?: string
  sentryIds?: {
    lastEventId: string
    traceId: string
    replayId: string
  }
  initialPlayers: Array<{
    id: string
    name: string
    seatNumber: number
    position: ReplayPlayer['position']
    startingStack: number
    holeCards?: [Card, Card]
  }>
  currentStep: {
    stepIndex: number
    stepNumber: number
    description: string
    highlightedPlayerId: string | null
    street: string
    pot: number
    communityCards: Card[]
    activePlayerIndex: number | null
    winnerIds: string[]
    winnings: Record<string, number>
  }
  actions: Array<{
    playerId: string
    action: string
    amount: number
    timestamp?: number
  }>
  players: Array<{
    id: string
    name: string
    seatNumber: number
    position: ReplayPlayer['position']
    currentStack: number
    startingStack: number
    holeCards?: [Card, Card]
    isActive: boolean
    isFolded: boolean
    isAllIn: boolean
    currentBet: number
    totalBet: number
    lastAction?: string
  }>
  totalSteps: number
  dimensions: { width: number; height: number }
  isPlaying: boolean
  speed: number
  isFullscreen: boolean
  soundEnabled: boolean
}

// =====================
// Data Extraction
// =====================

interface BuildDebugDataOptions {
  hudrVersion: string
  hudrBuildDate: string
  hand: HandReplay | undefined
  step: ReplayStep | undefined
  stepIndex: number
  totalSteps: number
  dimensions: { width: number; height: number }
  isPlaying: boolean
  speed: number
  isFullscreen: boolean
  soundOn: boolean
  // Enriched debugging context (optional)
  tournamentId?: string
  apiStatus?: ReplayerDebugData['apiStatus']
  sentryReplayUrl?: string
  sentryIds?: ReplayerDebugData['sentryIds']
}

/**
 * Build the debug data object from replayer state
 */
export function buildDebugData(options: BuildDebugDataOptions): ReplayerDebugData {
  const { hand, step, stepIndex, totalSteps, dimensions, isPlaying, speed, isFullscreen, soundOn } = options

  const blinds = hand?.blinds ?? { smallBlind: 0, bigBlind: 0 }
  const actions = step?.state?.actions ?? []

  // Detect missing data flags from hand state
  const missingDataFlags: string[] = []
  if (hand) {
    const lastStep = hand.steps[hand.steps.length - 1]
    const hasWinners = lastStep?.state?.winnerIds?.length > 0
    const hasCommunityCards = hand.steps.some(s => s.state.communityCards.length > 0)
    const hasEndingStacks = hand.initialPlayers.every(p => p.currentStack !== undefined)

    if (!hasWinners) missingDataFlags.push('winners')
    if (!hasCommunityCards && hand.steps.length > 3) missingDataFlags.push('communityCards')
    if (!hasEndingStacks) missingDataFlags.push('endingStacks')
    if (!hand.blinds.smallBlind && !hand.blinds.bigBlind) missingDataFlags.push('blinds')
    if (hand.initialPlayers.length < 2) missingDataFlags.push('players (<2)')
    if (hand.steps.length <= 1) missingDataFlags.push('actions (no steps)')
  }

  return {
    hudrVersion: options.hudrVersion,
    hudrBuildDate: options.hudrBuildDate,
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    screenSize: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'N/A',
    handId: hand?.handId ?? 'N/A',
    gameType: hand?.gameType ?? 'N/A',
    blinds,
    createdAt: hand?.createdAt?.toISOString?.() ?? 'N/A',
    // Enriched context
    tournamentId: options.tournamentId,
    tournamentName: hand?.tournamentName,
    handStatus: hand ? (hand.steps.some(s => s.state.winnerIds?.length > 0) ? 'complete' : 'in_progress') : 'not_loaded',
    apiStatus: options.apiStatus,
    missingDataFlags: missingDataFlags.length > 0 ? missingDataFlags : undefined,
    sentryReplayUrl: options.sentryReplayUrl,
    sentryIds: options.sentryIds,
    initialPlayers: hand?.initialPlayers?.map((p) => ({
      id: p.id,
      name: p.name,
      seatNumber: p.seatNumber,
      position: p.position,
      startingStack: p.startingStack,
      holeCards: p.holeCards,
    })) ?? [],
    currentStep: {
      stepIndex,
      stepNumber: step?.stepNumber ?? 0,
      description: step?.description ?? 'N/A',
      highlightedPlayerId: step?.highlightedPlayerId ?? null,
      street: step?.state?.street ?? 'N/A',
      pot: step?.state?.pot ?? 0,
      communityCards: step?.state?.communityCards ?? [],
      activePlayerIndex: step?.state?.activePlayerIndex ?? null,
      winnerIds: step?.state?.winnerIds ?? [],
      winnings: step?.state?.winnings ?? {},
    },
    actions: actions.map((a) => ({
      playerId: a.playerId,
      action: a.action,
      amount: a.amount,
      timestamp: a.timestamp,
    })),
    players: step?.state?.players?.map((p) => ({
      id: p.id,
      name: p.name,
      seatNumber: p.seatNumber,
      position: p.position,
      currentStack: p.currentStack,
      startingStack: p.startingStack,
      holeCards: p.holeCards,
      isActive: p.isActive,
      isFolded: p.isFolded,
      isAllIn: p.isAllIn,
      currentBet: p.currentBet,
      totalBet: p.totalBet,
      lastAction: p.lastAction,
    })) ?? [],
    totalSteps,
    dimensions,
    isPlaying,
    speed,
    isFullscreen,
    soundEnabled: soundOn,
  }
}

// =====================
// Text Formatting
// =====================

/**
 * Format debug data into a human-readable text block
 */
export function formatDebugText(data: ReplayerDebugData): string {
  // Build API status section
  const apiStatusText = data.apiStatus
    ? `\nAPI STATUS:
- HTTP Status: ${data.apiStatus.httpStatus ?? 'N/A'}
- Load Success: ${data.apiStatus.loadSuccess}${data.apiStatus.transformError ? `\n- Transform Error: ${data.apiStatus.transformError}` : ''}${data.apiStatus.transformErrorCode ? `\n- Error Code: ${data.apiStatus.transformErrorCode}` : ''}${data.apiStatus.errorMessage ? `\n- Error Message: ${data.apiStatus.errorMessage}` : ''}`
    : ''

  // Build missing data flags section
  const missingDataText = data.missingDataFlags && data.missingDataFlags.length > 0
    ? `\nMISSING DATA FLAGS: ${data.missingDataFlags.join(', ')}`
    : ''

  return `=== POKER REPLAYER DEBUG DATA ===
HUDR Version: ${data.hudrVersion} (Build: ${data.hudrBuildDate})
URL: ${data.url}
Timestamp: ${data.timestamp}
User Agent: ${data.userAgent}
Screen: ${data.screenSize}${data.sentryReplayUrl ? `\nSentry Replay: ${data.sentryReplayUrl}` : ''}${data.sentryIds?.lastEventId ? `\nSentry Event ID: ${data.sentryIds.lastEventId}` : ''}${data.sentryIds?.traceId ? `\nSentry Trace ID: ${data.sentryIds.traceId}` : ''}${data.sentryIds?.replayId ? `\nSentry Replay ID: ${data.sentryIds.replayId}` : ''}

HAND INFO:
- Hand ID: ${data.handId}
- Game Type: ${data.gameType}
- Blinds: ${data.blinds.smallBlind ?? 0}/${data.blinds.bigBlind ?? 0}${data.blinds.ante ? ` (ante: ${data.blinds.ante})` : ''}
- Created: ${data.createdAt}
- Hand Status: ${data.handStatus ?? 'unknown'}
- Total Players: ${data.initialPlayers.length}${data.tournamentId ? `\n- Tournament ID: ${data.tournamentId}` : ''}${data.tournamentName ? `\n- Tournament: ${data.tournamentName}` : ''}${apiStatusText}${missingDataText}

INITIAL PLAYERS (at hand start):
${data.initialPlayers
  .map(
    (p) =>
      `  [Seat ${p.seatNumber}] ${p.name} (${p.position ?? 'N/A'}) - Stack: ${p.startingStack}${p.holeCards ? ` - Cards: ${p.holeCards.map((c) => `${c.rank}${c.suit}`).join(' ')}` : ''}`
  )
  .join('\n')}

CURRENT STEP (${data.currentStep.stepIndex}/${data.totalSteps - 1}):
- Step Number: ${data.currentStep.stepNumber}
- Description: ${data.currentStep.description}
- Street: ${data.currentStep.street}
- Pot: ${data.currentStep.pot}
- Community Cards: ${data.currentStep.communityCards.length > 0 ? data.currentStep.communityCards.map((c) => `${c.rank}${c.suit}`).join(' ') : 'None'}
- Active Player Index: ${data.currentStep.activePlayerIndex ?? 'None'}
- Highlighted Player: ${data.currentStep.highlightedPlayerId ?? 'None'}
- Winners: ${data.currentStep.winnerIds.length > 0 ? data.currentStep.winnerIds.join(', ') : 'None'}
- Winnings: ${Object.keys(data.currentStep.winnings).length > 0 ? JSON.stringify(data.currentStep.winnings) : 'None'}

ACTIONS IN STEP:
${data.actions.length > 0 ? data.actions.map((a) => `  - ${a.playerId}: ${a.action} ${a.amount > 0 ? a.amount : ''}`).join('\n') : '  (No actions)'}

CURRENT PLAYER STATES:
${data.players
  .map(
    (p) =>
      `  [Seat ${p.seatNumber}] ${p.name} (${p.position ?? 'N/A'})
    Stack: ${p.currentStack} (started: ${p.startingStack})
    Cards: ${p.holeCards ? p.holeCards.map((c) => `${c.rank}${c.suit}`).join(' ') : 'Hidden'}
    Status: ${p.isFolded ? 'FOLDED' : p.isAllIn ? 'ALL-IN' : p.isActive ? 'Active' : 'Waiting'}
    Bets: current=${p.currentBet}, total=${p.totalBet}, Last Action: ${p.lastAction ?? 'None'}`
  )
  .join('\n')}

PLAYBACK STATE:
- Playing: ${data.isPlaying}
- Speed: ${data.speed}x
- Dimensions: ${data.dimensions.width}x${data.dimensions.height}
- Fullscreen: ${data.isFullscreen}
- Sound: ${data.soundEnabled}

=== RAW JSON (for developers) ===
${JSON.stringify(data, null, 2)}`
}
