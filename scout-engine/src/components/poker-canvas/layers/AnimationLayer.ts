import type { Card } from '@/types/hand'
import { BaseLayer } from './BaseLayer'
import type { LayerRenderContext, ChipAnimationVariant } from '../types/canvas-types'
import { CHIP_ANIMATION_VARIANTS } from '../types/canvas-types'
import { ChipEntity } from '../entities/Chip'
import { CardEntity } from '../entities/Card'
import { logger } from '@/lib/logger'

interface Point {
  x: number
  y: number
}

export interface ChipMovement {
  id: string
  denomination: { color: string; textColor: string; value: number }
  from: Point
  to: Point
  progressKey: string
}

export interface CardMovement {
  id: string
  card: Card
  from: Point
  to: Point
  faceDown?: boolean
  progressKey: string
  width?: number
  height?: number
  rotation?: number
  flipKey?: string
  revealFromBack?: boolean
}

/**
 * Get deterministic animation variant from handId
 * Same algorithm as PotLoadingAnimation for consistency
 */
function getAnimationVariant(handId?: string): ChipAnimationVariant {
  if (!handId) {
    return CHIP_ANIMATION_VARIANTS[Math.floor(Math.random() * CHIP_ANIMATION_VARIANTS.length)]
  }
  // Sum character codes for varied distribution
  let sum = 0
  for (let i = 0; i < handId.length; i++) {
    sum += handId.charCodeAt(i)
  }
  return CHIP_ANIMATION_VARIANTS[sum % CHIP_ANIMATION_VARIANTS.length]
}

// =====================
// Easing Functions
// =====================

const easeOutBounce = (t: number): number => {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// =====================
// Animation Renderers
// =====================

interface AnimatedChipParams {
  ctx: CanvasRenderingContext2D
  from: Point
  to: Point
  progress: number
  chipRadius: number
  denomination: { color: string; textColor: string; value: number }
  chipIndex: number
  totalChips: number
}

/**
 * 1. Chip Stack - Chips stack up with bounce as they move
 */
function renderChipStack(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex } = params
  const easedProgress = easeOutBounce(progress)

  // Stagger the chips vertically as they move - MORE DRAMATIC
  const stackOffset = chipIndex * 8 * (1 - easedProgress) // Stack settles as progress completes
  const bounceY = Math.sin(progress * Math.PI) * 35 * (1 - progress) // Much higher bounce

  const x = from.x + (to.x - from.x) * easedProgress
  const y = from.y + (to.y - from.y) * easedProgress - stackOffset - bounceY

  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
}

/**
 * 2. Card Shuffle - Chips sway side-to-side like shuffling cards
 */
function renderCardShuffle(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex } = params
  const easedProgress = easeInOutQuad(progress)

  // Sway amplitude diminishes as chip approaches destination - MORE DRAMATIC
  const swayAmplitude = 50 * (1 - progress) // Double the sway
  const swayFrequency = 4 + chipIndex * 0.5 // More oscillations
  const swayX = Math.sin(progress * Math.PI * swayFrequency) * swayAmplitude

  const x = from.x + (to.x - from.x) * easedProgress + swayX
  const y = from.y + (to.y - from.y) * easedProgress

  // Add stronger rotation effect
  ctx.save()
  ctx.translate(x, y)
  const rotation = Math.sin(progress * Math.PI * swayFrequency) * 0.4 // More rotation
  ctx.rotate(rotation)
  ctx.translate(-x, -y)
  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
  ctx.restore()
}

/**
 * 3. Spinning Suits - Chips spiral inward toward the pot
 */
function renderSpinningSuits(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex, totalChips } = params
  const easedProgress = easeInOutQuad(progress)

  // Spiral motion - radius shrinks as chips approach pot - MORE DRAMATIC
  const spiralRadius = 70 * (1 - easedProgress) // Bigger spiral
  const spiralAngle = progress * Math.PI * 6 + (chipIndex / Math.max(totalChips, 1)) * Math.PI * 2 // More rotations
  const spiralX = Math.cos(spiralAngle) * spiralRadius
  const spiralY = Math.sin(spiralAngle) * spiralRadius

  const baseX = from.x + (to.x - from.x) * easedProgress
  const baseY = from.y + (to.y - from.y) * easedProgress
  const x = baseX + spiralX
  const y = baseY + spiralY

  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
}

/**
 * 4. Pot Growing - Chips fall with gravity arc into pot
 */
function renderPotGrowing(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex } = params

  // Gravity-influenced arc - parabolic motion - MORE DRAMATIC
  const arcHeight = 80 + chipIndex * 15 // Much higher arc

  // Horizontal: linear interpolation
  const x = from.x + (to.x - from.x) * progress

  // Vertical: parabolic arc (goes up then down)
  const arcProgress = progress * 2 - 1 // -1 to 1
  const arcOffset = -arcHeight * (1 - arcProgress * arcProgress) // Parabola peaking at midpoint
  const baseY = from.y + (to.y - from.y) * progress
  const y = baseY + arcOffset

  // Scale effect - chips start small and grow
  const scale = 0.5 + 0.5 * easeOutBounce(progress)

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.translate(-x, -y)
  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
  ctx.restore()
}

/**
 * 5. Card Flip - Chips tumble/flip as they move
 */
function renderCardFlip(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex } = params
  const easedProgress = easeInOutQuad(progress)

  const baseX = from.x + (to.x - from.x) * easedProgress
  const baseY = from.y + (to.y - from.y) * easedProgress

  // Flip effect - scale X to simulate 3D flip - MORE DRAMATIC
  const flipCycles = 3 + chipIndex * 0.5 // More flips
  const flipProgress = Math.abs(Math.cos(progress * Math.PI * flipCycles))
  const scaleX = 0.1 + 0.9 * flipProgress // Goes almost flat

  // Much bigger vertical bounce during flip
  const bounceY = Math.sin(progress * Math.PI) * 30

  // Add horizontal wobble
  const wobbleX = Math.sin(progress * Math.PI * 5) * 15 * (1 - progress)

  const x = baseX + wobbleX
  const y = baseY - bounceY

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scaleX, 1)
  ctx.translate(-x, -y)
  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
  ctx.restore()
}

/**
 * 6. Dealer Bounce - Chips bounce energetically toward pot
 */
function renderDealerBounce(params: AnimatedChipParams, chipEntity: ChipEntity, theme: Parameters<ChipEntity['draw']>[0]['theme'], dpr: number) {
  const { ctx, from, to, progress, chipRadius, denomination, chipIndex } = params

  // Multiple bounces that diminish - MORE DRAMATIC
  const bounceCount = 4
  const bounceDecay = Math.pow(1 - progress, 1.2) // Bounces get smaller but stay visible longer
  const bounceHeight = 60 * bounceDecay // Much higher bounces
  const bounceY = Math.abs(Math.sin(progress * Math.PI * bounceCount)) * bounceHeight

  // Stagger chips slightly
  const staggerDelay = chipIndex * 0.08
  const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)))
  const adjustedEased = easeOutBack(adjustedProgress)

  const x = from.x + (to.x - from.x) * adjustedEased
  const baseY = from.y + (to.y - from.y) * adjustedEased
  const y = baseY - bounceY

  // Stronger scale pulse on bounce
  const scalePulse = 1 + Math.sin(progress * Math.PI * bounceCount) * 0.25 * bounceDecay

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scalePulse, scalePulse)
  ctx.translate(-x, -y)
  chipEntity.draw({ ctx, x, y, radius: chipRadius, denomination, theme, dpr })
  ctx.restore()
}

const chipEntity = new ChipEntity()
const cardEntity = new CardEntity()

export class AnimationLayer extends BaseLayer {
  private chipMovements: ChipMovement[] = []
  private cardMovements: CardMovement[] = []
  private handId: string | undefined = undefined
  private animationVariant: ChipAnimationVariant = 'chip-stack'
  private overrideVariant: ChipAnimationVariant | undefined = undefined

  constructor() {
    super(60)
  }

  /**
   * Set the hand ID to determine which animation variant to use
   * Should be called when hand changes
   */
  setHandId(handId: string | undefined) {
    if (this.handId !== handId) {
      this.handId = handId
      this.animationVariant = getAnimationVariant(handId)
    }
  }

  /**
   * Set an override animation variant (for testing/preview)
   * Pass undefined to use the automatic handId-based selection
   */
  setAnimationVariant(variant: ChipAnimationVariant | undefined) {
    this.overrideVariant = variant
  }

  /**
   * Get the current active variant (override or auto-selected)
   */
  getActiveVariant(): ChipAnimationVariant {
    return this.overrideVariant ?? this.animationVariant
  }

  setChipMovements(movements: ChipMovement[]) {
    if (movements.length > 0 && movements.length !== this.chipMovements.length) {
      const collectMoves = movements.filter(m => m.progressKey.startsWith('collect-') || m.progressKey.startsWith('win-'))
      const betMoves = movements.filter(m => m.progressKey.startsWith('bet-'))
      const activeVariant = this.getActiveVariant()
      logger.debug('[AnimationLayer] setChipMovements:', movements.length, 'chips, variant:', activeVariant)
      logger.debug('[AnimationLayer] Movement types: bet=' + betMoves.length + ', collect/win=' + collectMoves.length)
      if (collectMoves.length > 0) {
        logger.debug('[AnimationLayer] 🎰 POT COLLECTION DETECTED! Will use themed animation:', activeVariant)
      }
    }
    this.chipMovements = movements
  }

  setCardMovements(movements: CardMovement[]) {
    this.cardMovements = movements
  }

  render(context: LayerRenderContext) {
    const { animations, ctx, theme, dpr } = context
    const totalChips = this.chipMovements.length

    this.chipMovements.forEach((move, chipIndex) => {
      const progress = animations.getValue(move.progressKey, 1)
      if (progress >= 1) return

      const params: AnimatedChipParams = {
        ctx,
        from: move.from,
        to: move.to,
        progress,
        chipRadius: 10,
        denomination: move.denomination,
        chipIndex,
        totalChips,
      }

      // Only apply themed animations to POT movements (collect-* and win-*)
      // Player-to-bet-spot (bet-*) uses simple linear movement
      const isPotMovement = move.progressKey.startsWith('collect-') || move.progressKey.startsWith('win-')

      if (!isPotMovement) {
        // Simple linear movement for player-to-bet-spot
        const x = move.from.x + (move.to.x - move.from.x) * progress
        const y = move.from.y + (move.to.y - move.from.y) * progress
        chipEntity.draw({ ctx, x, y, radius: 10, denomination: move.denomination, theme, dpr })
        return
      }

      // Get the active variant (override or auto-selected)
      const activeVariant = this.getActiveVariant()

      // DEBUG: Log pot movement animation
      if (chipIndex === 0) {
        logger.debug(`[CHIP ANIM TO POT] variant=${activeVariant} progress=${progress.toFixed(2)} key=${move.progressKey}`)
      }

      // Render pot movements using the selected animation variant
      switch (activeVariant) {
        case 'chip-stack':
          renderChipStack(params, chipEntity, theme, dpr)
          break
        case 'card-shuffle':
          renderCardShuffle(params, chipEntity, theme, dpr)
          break
        case 'spinning-suits':
          renderSpinningSuits(params, chipEntity, theme, dpr)
          break
        case 'pot-growing':
          renderPotGrowing(params, chipEntity, theme, dpr)
          break
        case 'card-flip':
          renderCardFlip(params, chipEntity, theme, dpr)
          break
        case 'dealer-bounce':
          renderDealerBounce(params, chipEntity, theme, dpr)
          break
        default:
          // Fallback to simple linear movement
          const x = move.from.x + (move.to.x - move.from.x) * progress
          const y = move.from.y + (move.to.y - move.from.y) * progress
          chipEntity.draw({ ctx, x, y, radius: 10, denomination: move.denomination, theme, dpr })
      }
    })

    this.cardMovements.forEach((move) => {
      const progress = animations.getValue(move.progressKey, 1)
      if (progress >= 1) return
      const x = move.from.x + (move.to.x - move.from.x) * progress
      const y = move.from.y + (move.to.y - move.from.y) * progress
      const width = move.width ?? 46
      const height = move.height ?? 64
      const flipProgress = move.flipKey ? animations.getValue(move.flipKey, 1) : 1
      const scaleX = move.flipKey ? Math.max(0.08, flipProgress) : 1
      const faceDown = move.revealFromBack ? flipProgress < 0.5 : move.faceDown

      ctx.save()
      ctx.translate(x + width / 2, y + height / 2)
      ctx.scale(scaleX, 1)
      ctx.translate(-(x + width / 2), -(y + height / 2))
      cardEntity.draw({
        ctx,
        x,
        y,
        width,
        height,
        card: move.card,
        faceDown,
        theme,
        rotation: move.rotation,
        dpr,
        useImageCards: context.experimentalFeatures?.imageCards,
      })
      ctx.restore()
    })
  }
}
