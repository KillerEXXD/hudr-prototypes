import type { ChipDenomination } from '@/types/replay'
import { calculateChipBreakdown, defaultChipDenominations } from '@/types/replay'
import type { ReplayerTheme } from '../types/canvas-types'
import { ChipEntity } from './Chip'

interface ChipStackOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  amount: number
  stackHeight?: number
  stackGap?: number
  chipRadius?: number
  denominations?: ChipDenomination[]
  theme: ReplayerTheme
  dpr?: number
}

const chip = new ChipEntity()

export class ChipStackEntity {
  draw({
    ctx,
    x,
    y,
    amount,
    stackHeight = 4,
    stackGap = 12,
    chipRadius = 12,
    denominations = defaultChipDenominations,
    theme,
    dpr = 1,
  }: ChipStackOptions) {
    const breakdown = calculateChipBreakdown(amount, denominations)
    let currentX = x

    breakdown.forEach(({ denomination, count }, stackIndex) => {
      const chipsToDraw = Math.min(count, stackHeight)
      for (let i = 0; i < chipsToDraw; i += 1) {
        const chipX = currentX
        const chipY = y - i * (stackGap * 0.7)
        chip.draw({
          ctx,
          x: chipX,
          y: chipY,
          radius: chipRadius,
          denomination,
          theme,
          dpr,
        })
      }
      currentX += stackGap + stackIndex * 0.5
    })
  }
}
