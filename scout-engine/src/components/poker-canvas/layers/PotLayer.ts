import { BaseLayer } from './BaseLayer'
import type { LayerRenderContext } from '../types/canvas-types'
import { PotEntity } from '../entities/Pot'
import { getPortraitLayoutConfig } from '../utils/coordinates'

const pot = new PotEntity()

export class PotLayer extends BaseLayer {
  constructor() {
    super(45)
  }

  render(context: LayerRenderContext) {
    const { state, theme, width, height, dpr, animations, handId, potAnimationVariant, potVisualVariant, now } = context
    const targetAmount = state.pot
    if (targetAmount <= 0.01) return

    // Get the counter animation progress (0 = start, 1 = complete)
    const slotProgress = animations.getValue('pot-slot', 1)
    const fromAmount = animations.getValue('pot-from', targetAmount)

    // Position pot below community cards bottom edge + per-count gap
    // Community cards: centered at height/2, each 60px tall → bottom edge at height/2 + 30
    // BUG-190 FIX: Use community-card-relative positioning instead of fixed %
    // which caused chip stacks to overlap the middle community card on mobile
    const isMobilePortrait = height > width
    let potY: number
    if (isMobilePortrait) {
      const cardBottomY = height / 2 + 30
      const layoutConfig = getPortraitLayoutConfig(state.players.length)
      potY = cardBottomY + layoutConfig.potGapBelowCards
    } else {
      // Landscape: keep existing proportional offset
      potY = height / 2 + height * 0.059
    }

    pot.draw({
      ctx: context.ctx,
      x: width / 2,
      y: potY,
      amount: targetAmount,
      fromAmount,
      slotProgress,
      theme,
      bounceOffset: 0,
      dpr,
      handId,
      animationVariant: potAnimationVariant,
      visualVariant: potVisualVariant,
      now,
    })
  }
}
