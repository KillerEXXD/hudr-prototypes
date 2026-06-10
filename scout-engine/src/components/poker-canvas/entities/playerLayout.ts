/**
 * Player Layout Calculation
 *
 * Pure function that computes the visual layout (positions, sizes)
 * for a player entity based on their seat position and options.
 */

import type { SeatPosition } from '../types/canvas-types'

// Base dimensions (at scale 1.0)
const BASE_FRAME_RADIUS = 28
const BASE_NAME_BOX_WIDTH = 72
const BASE_NAME_BOX_HEIGHT = 32
// Player hole cards - Medium size (36×52px) for better visibility
const BASE_CARD_WIDTH = 36
const BASE_CARD_HEIGHT = 52
// Larger card dimensions for image-based rendering (matches winner scale 1.4x)
// This makes the "normal" cards the same size as current winner cards
const IMAGE_CARD_WIDTH = 50
const IMAGE_CARD_HEIGHT = 73
const BASE_CARD_GAP = 5

export interface GetPlayerLayoutOptions {
  position: SeatPosition
  /** Canvas height in pixels - used to calculate if player is at top of table */
  canvasHeight?: number
  /** Canvas width in pixels - used for proportional bet offset scaling on mobile */
  canvasWidth?: number
  /** Use larger card dimensions for image-based rendering */
  useImageCards?: boolean
  /** Card size multiplier (default 1.0, range 0.5-2.0) - from debug mode */
  cardScale?: number
}

export function getPlayerLayout(positionOrOptions: SeatPosition | GetPlayerLayoutOptions) {
  // Handle both old signature (SeatPosition) and new signature (options object)
  const isOptionsObject = 'position' in positionOrOptions && ('canvasHeight' in positionOrOptions || 'canvasWidth' in positionOrOptions || 'useImageCards' in positionOrOptions || 'cardScale' in positionOrOptions)
  const position = isOptionsObject ? (positionOrOptions as GetPlayerLayoutOptions).position : positionOrOptions as SeatPosition
  const canvasHeight = isOptionsObject ? (positionOrOptions as GetPlayerLayoutOptions).canvasHeight : undefined
  const canvasWidth = isOptionsObject ? (positionOrOptions as GetPlayerLayoutOptions).canvasWidth : undefined
  const useImageCards = isOptionsObject ? (positionOrOptions as GetPlayerLayoutOptions).useImageCards : false
  const cardScale = isOptionsObject ? (positionOrOptions as GetPlayerLayoutOptions).cardScale ?? 1 : 1

  const scale = position.scale ?? 1

  // Apply perspective scaling to dimensions
  const frameRadius = BASE_FRAME_RADIUS * scale
  const nameBoxWidth = BASE_NAME_BOX_WIDTH * scale
  const nameBoxHeight = BASE_NAME_BOX_HEIGHT * scale
  // Use larger card dimensions when image-based rendering is enabled
  // Then apply additional cardScale multiplier for user-controlled sizing
  const baseCardWidth = useImageCards ? IMAGE_CARD_WIDTH : BASE_CARD_WIDTH
  const baseCardHeight = useImageCards ? IMAGE_CARD_HEIGHT : BASE_CARD_HEIGHT
  const cardWidth = baseCardWidth * scale * cardScale
  const cardHeight = baseCardHeight * scale * cardScale
  const cardGap = BASE_CARD_GAP * scale * cardScale

  // Frame center position
  const frameX = position.x
  const frameY = position.y - nameBoxHeight / 2 - frameRadius + 4 * scale

  // Cards centered inside the frame
  const totalCardsWidth = cardWidth * 2 - cardGap
  const cardsX = frameX - totalCardsWidth / 2
  const cardsY = frameY - cardHeight / 2

  // Name box below frame
  const nameBoxY = frameY + frameRadius + 2 * scale

  // Determine position zones based on y percentage (needed for bet distance)
  const yPercentage = canvasHeight && canvasHeight > 0 ? (position.y / canvasHeight) * 100 : 50
  const isTopPosition = yPercentage < 35      // Top third
  const isBottomPosition = yPercentage > 65   // Bottom third
  // Middle positions: 35% <= y <= 65%

  // Bet positioning: Place bet on the table felt between player and table center.
  // Uses a vector from the player toward the table center, at a distance that
  // clears the avatar frame. This works uniformly across all screen sizes —
  // the distance is based on avatar geometry (which has fixed pixel size),
  // not proportional to canvas dimensions.
  //
  // BUG-394 FIX: Previous proportional offsets (% of canvas) were too small on
  // mobile (430px wide → 20px X offset, less than the 27px avatar radius).
  // Vector-toward-center with avatar-based clearance ensures bets always land
  // on the felt regardless of screen size.
  let betX: number
  let betY: number

  // Table center (target for the vector direction)
  const tableCenterX = canvasWidth ? canvasWidth * 0.50 : position.x
  const tableCenterY = canvasHeight ? canvasHeight * 0.50 : position.y

  const towardCenterX = tableCenterX - position.x
  const towardCenterY = tableCenterY - position.y
  const distToCenter = Math.sqrt(towardCenterX * towardCenterX + towardCenterY * towardCenterY)

  if (distToCenter > 1 && canvasWidth && canvasHeight) {
    // Distance must clear the avatar frame + nameBox overlap + margin for chips
    // frameRadius * 2 covers from position.y to frame top (the frame center is
    // offset above position.y by ~nameBoxHeight/2 + frameRadius)
    // nameBoxHeight / 2 accounts for the nameBox partial overlap
    // + 12px gap for the chip stack and amount pill
    const betClearance = frameRadius * 2 + nameBoxHeight / 2 + 12

    betX = position.x + (towardCenterX / distToCenter) * betClearance
    betY = position.y + (towardCenterY / distToCenter) * betClearance
  } else {
    // Fallback when canvas size unknown: use angle-based positioning
    const betDistance = 72 * scale
    betX = position.x - Math.cos(position.angle) * betDistance
    betY = position.y - Math.sin(position.angle) * betDistance
  }

  // Status anchor: above frame for most positions, below name box for top positions
  const statusAnchorY = isTopPosition
    ? nameBoxY + nameBoxHeight + 8 * scale  // Below name box for top players
    : frameY - frameRadius - 14 * scale      // Above frame for other players

  return {
    scale,
    frame: {
      x: frameX,
      y: frameY,
      radius: frameRadius,
    },
    cards: [
      {
        x: cardsX,
        y: cardsY,
        width: cardWidth,
        height: cardHeight,
        rotation: -0.1,
      },
      {
        x: cardsX + cardWidth - cardGap,
        y: cardsY,
        width: cardWidth,
        height: cardHeight,
        rotation: 0.1,
      },
    ],
    nameBox: {
      x: position.x - nameBoxWidth / 2,
      y: nameBoxY,
      width: nameBoxWidth,
      height: nameBoxHeight,
    },
    betSpot: {
      x: betX,
      y: betY,
    },
    statusAnchor: {
      x: position.x,
      y: statusAnchorY,
    },
    // Flags to indicate position zones for badge placement
    isTopPosition,
    isBottomPosition,
    levelBadge: {
      x: frameX - frameRadius + 2 * scale,
      y: frameY - frameRadius + 2 * scale,
    },
  }
}
