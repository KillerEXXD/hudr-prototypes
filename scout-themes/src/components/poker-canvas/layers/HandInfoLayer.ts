/**
 * HandInfoLayer - Renders hand number and tournament name overlay
 *
 * Visibility logic:
 * - Show during preflop with no community cards (blind posting phase)
 * - Hide when community cards appear
 * - Show again above community cards when winner is determined
 *
 * Dynamic positioning:
 * - Shifts down when top players' bets would overlap with the overlay
 */

import { BaseLayer } from './BaseLayer'
import type { LayerRenderContext } from '../types/canvas-types'
import { HandInfoOverlayEntity } from '../entities/HandInfoOverlay'
import { getPortraitLayoutConfig } from '../utils/coordinates'

const handInfoOverlay = new HandInfoOverlayEntity()

// Constants for collision detection
const OVERLAY_HEIGHT = 60 // Approximate height of the hand info pill
const BET_PILL_HEIGHT = 50 // Approximate height of bet amount display (chip stack + pill)
const COLLISION_PADDING = 15 // Extra padding between bet and overlay

export class HandInfoLayer extends BaseLayer {
  constructor() {
    // Render above pot (45) but below action badges
    super(50)
  }

  render(context: LayerRenderContext) {
    const { state, theme, width, height, handNumber, tournamentName, now, seatPositions } = context

    // Skip if no hand info to show
    if (!handNumber && !tournamentName) return

    // Determine visibility and position mode
    const hasCommunityCards = state.communityCards.length > 0
    const hasWinner = state.winnerIds.length > 0 || state.showWinAmount

    // Visibility logic:
    // 1. Show during preflop before community cards
    // 2. Hide when community cards appear
    // 3. Show again when winner is determined
    let visible = false
    let positionMode: 'center' | 'above-cards' = 'center'

    if (!hasCommunityCards && state.street === 'preflop') {
      // Phase 1: Preflop with no community cards - show in center
      visible = true
      positionMode = 'center'
    } else if (hasWinner) {
      // Phase 3: Winner determined - show above community cards
      visible = true
      positionMode = 'above-cards'
    }
    // Phase 2: Community cards dealt but no winner yet - hidden

    // Update animation and get current progress
    const animationProgress = handInfoOverlay.updateAnimation(visible, now)

    const isMobilePortrait = height > width
    const centerX = width / 2
    let centerY: number

    if (isMobilePortrait) {
      // BUG-190 FIX: Use per-count handInfoY instead of hardcoded 0.28
      const layoutConfig = getPortraitLayoutConfig(state.players.length)

      if (positionMode === 'above-cards') {
        // Showdown: position above community cards top edge
        // Community cards top = height/2 - 30, place 40px above that
        centerY = height / 2 - 30 - 40
      } else {
        centerY = height * layoutConfig.handInfoY
      }
    } else {
      // Desktop/landscape: position at ~45% (slightly above center)
      centerY = height / 2 - 20
    }

    // Dynamic positioning: Check if any top player's bet would overlap with the overlay
    // Only check during preflop when overlay is visible and there are bets
    if (visible && positionMode === 'center' && isMobilePortrait && seatPositions.length > 0 && state.players.length > 0) {
      const overlayTopY = centerY - OVERLAY_HEIGHT / 2

      // Check each player for potential collision
      for (let i = 0; i < state.players.length; i++) {
        const player = state.players[i]
        if (!player || player.currentBet <= 0) continue

        const seatPos = seatPositions[i]
        if (!seatPos) continue

        // Check if this is a top player (y < 35% of canvas)
        const yPercentage = (seatPos.y / height) * 100
        const isTopPosition = yPercentage < 35

        if (isTopPosition) {
          // Top player's bet is positioned BELOW them (y + offset)
          const scale = seatPos.scale ?? 1
          const betOffsetY = 50 * scale
          const betY = seatPos.y + betOffsetY
          const betBottomY = betY + BET_PILL_HEIGHT

          // Check for collision: bet bottom overlaps overlay top
          if (betBottomY + COLLISION_PADDING > overlayTopY) {
            // Calculate how much to shift the overlay down
            const overlap = betBottomY + COLLISION_PADDING - overlayTopY
            centerY = centerY + overlap
          }
        }
      }

      // Cap the maximum shift to avoid pushing overlay too far down
      const maxY = height * 0.45 // Don't go below 45% of canvas
      centerY = Math.min(centerY, maxY)
    }

    handInfoOverlay.draw({
      ctx: context.ctx,
      x: centerX,
      y: centerY,
      handNumber,
      tournamentName,
      theme,
      animationProgress,
      positionMode,
    })
  }
}
