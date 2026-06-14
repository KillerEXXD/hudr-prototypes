import { BaseLayer } from './BaseLayer'
import type { LayerRenderContext } from '../types/canvas-types'
import { PlayerEntity } from '../entities/Player'
import { logger } from '@/lib/logger'

const playerEntity = new PlayerEntity()

export class PlayersLayer extends BaseLayer {
  constructor() {
    super(30)
  }

  render(context: LayerRenderContext) {
    const { state, seatPositions, theme, step, dpr } = context

    // Determine if using dynamic seating (positions match player count)
    // vs fixed layout (10 positions, players index by seatNumber)
    const isDynamicSeating = seatPositions.length === state.players.length

    state.players.forEach((player, playerIndex) => {
      // Dynamic seating: use sequential index
      // Fixed layout: use player's seatNumber
      const positionIndex = isDynamicSeating
        ? playerIndex
        : player.seatNumber % seatPositions.length
      const position = seatPositions[positionIndex] ?? seatPositions[0]

      // Show hole cards only after deal animation completes.
      // During the deal animation (cards flying from deck), suppress static card rendering
      // so cards don't flash at their destination before the animation arrives.
      const hasCards = player.holeCards !== undefined && player.holeCards !== null
      // Detect deal transition: cards appeared this step but weren't in previous step
      const prevPlayer = context.previousStep?.state.players.find(p => p.id === player.id)
      const justDealt = hasCards && !prevPlayer?.holeCards?.length
      // Use 0 as default: if animation not registered yet, treat as "in progress" (0 < 1 = true)
      // This prevents a one-frame flash before the animation effect runs
      const dealAnimProgress = justDealt
        ? context.animations.getValue(`deal-${player.id}-0-${step.stepNumber}`, 0)
        : 1
      const showCards = hasCards && dealAnimProgress >= 1
      const isActive = step.state.activePlayerIndex !== null && state.players[step.state.activePlayerIndex]?.id === player.id
      const isWinner = step.state.winnerIds.includes(player.id)
      const winAmount = isWinner ? step.state.winnings[player.id] : undefined
      // showWinAmount controls when to show amount with green styling (phase 3 of win animation)
      const showWinAmount = isWinner && step.state.showWinAmount === true

      // Debug: Log win amount details for troubleshooting
      if (isWinner) {
        logger.debug('[PlayersLayer] Winner debug:', {
          playerName: player.name,
          playerId: player.id,
          isWinner,
          showWinAmount,
          winAmount,
          winnings: step.state.winnings,
          winnerIds: step.state.winnerIds,
          stepShowWinAmount: step.state.showWinAmount,
        })
      }

      // Debug: Log folded player details
      if (player.isFolded) {
        logger.debug('[PlayersLayer] Folded player:', {
          playerName: player.name,
          playerId: player.id,
          isFolded: player.isFolded,
          hasHoleCards: !!player.holeCards,
          holeCards: player.holeCards,
          showCards,
        })
      }

      playerEntity.draw({
        ctx: context.ctx,
        player,
        position,
        showCards,
        isActive,
        isWinner,
        isHighlighted: step.highlightedPlayerId === player.id,
        theme,
        dpr,
        now: context.now,
        winAmount,
        showWinAmount,
        canvasHeight: context.height,
        canvasWidth: context.width,
        handId: context.handId,
        actionBadgeVariant: context.actionBadgeVariant,
        badgeStyle: context.badgeStyle,
        badgeAnimation: context.badgeAnimation,
        isRunout: step.state.isRunout, // Don't show action badges on runout streets
        isAllInCall: step.state.isAllInCall, // All-in + call: use static chip-style badges
        winAnimationStyle: context.winAnimationStyle, // Win animation style for winner reveal
        // Experimental features (URL param: ?experiments=... or debug mode)
        useImageCards: context.experimentalFeatures?.imageCards,
        centeredBadges: context.experimentalFeatures?.centeredBadges,
        cardScale: context.experimentalFeatures?.cardScale,
        playerCount: state.players.length,
      })
    })
  }
}
