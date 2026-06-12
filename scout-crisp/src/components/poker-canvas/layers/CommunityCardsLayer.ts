import { BaseLayer } from './BaseLayer'
import type { LayerRenderContext } from '../types/canvas-types'
import { CardEntity } from '../entities/Card'

const cardEntity = new CardEntity()

export class CommunityCardsLayer extends BaseLayer {
  constructor() {
    super(40)
  }

  render(context: LayerRenderContext) {
    const { state, theme, animations, width, height, dpr, step, previousStep } = context
    const cards = state.communityCards
    if (!cards.length) return

    // Community cards - Medium size (40×60px) for better visibility
    const cardWidth = 40
    const cardHeight = 60
    const gap = 5
    const totalWidth = cards.length * cardWidth + (cards.length - 1) * gap
    const startX = width / 2 - totalWidth / 2
    const y = height / 2 - cardHeight / 2

    // Get the count of cards that were present in the previous step
    const previousCardCount = previousStep?.state.communityCards.length ?? 0

    cards.forEach((card, idx) => {
      // Check if this card is newly added (not present in previous step)
      const isNewCard = idx >= previousCardCount

      // If this is a new card, check if its movement animation is still in progress
      // The AnimationLayer uses `board-${idx}-${stepNumber}` as the progress key
      if (isNewCard) {
        const movementProgress = animations.getValue(`board-${idx}-${step.stepNumber}`, 1)
        // Skip rendering this card in CommunityCardsLayer while AnimationLayer is animating it
        if (movementProgress < 1) {
          return
        }
      }

      const x = startX + idx * (cardWidth + gap)
      const scale = animations.getValue(`community-${idx}-scale`, 1)
      context.ctx.save()
      context.ctx.translate(x + cardWidth / 2, y + cardHeight / 2)
      context.ctx.scale(scale, scale)
      context.ctx.translate(-(x + cardWidth / 2), -(y + cardHeight / 2))
      cardEntity.draw({
        ctx: context.ctx,
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        card,
        faceDown: false,
        theme,
        dpr,
        useImageCards: context.experimentalFeatures?.imageCards,
      })
      context.ctx.restore()
    })
  }
}
