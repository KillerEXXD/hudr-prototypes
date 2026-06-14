import type { ReplayerTheme } from '../types/canvas-types'
import { drawRoundedRect, withContext } from '../utils/drawing'

interface StatusBadgeOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  text: string
  theme: ReplayerTheme
  color?: string
  scale?: number
  isGold?: boolean
  now?: number
  /** When set, the amount portion (after +) is drawn in this color */
  amountColor?: string
  /** When true, renders a larger badge (for WIN amounts) */
  isLarge?: boolean
  /** Win amount for cycling animation - when set, badge alternates between "WIN" and "+{amount}" */
  cycleWinAmount?: number
}

/** Format win amount for compact display (e.g., 1.5M, 850K) */
function formatCompactAmount(amount: number): string {
  const absAmount = Math.abs(amount)
  const prefix = amount >= 0 ? '+' : '-'

  if (absAmount >= 1000000) {
    const millions = absAmount / 1000000
    return `${prefix}${millions.toFixed(millions >= 10 ? 1 : 2)}M`
  }
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000
    return `${prefix}${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(thousands >= 10 ? 0 : 1)}K`
  }
  return `${prefix}${absAmount.toLocaleString()}`
}

export class StatusBadgeEntity {
  draw({ ctx, x, y, text, theme, color = 'rgba(255,255,255,0.14)', scale = 1, isGold = false, now = 0, amountColor, isLarge = false, cycleWinAmount }: StatusBadgeOptions) {
    withContext(ctx, () => {
      // Large badges (WIN amounts) get slightly bigger text and padding
      const sizeMultiplier = isLarge ? 1.25 : 1
      const paddingX = 10 * scale * sizeMultiplier
      const paddingY = 5 * scale * sizeMultiplier
      const fontSize = Math.round(11 * scale * sizeMultiplier)
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`

      // Determine display text - cycle between "WIN" and "+{amount}" if cycleWinAmount is set
      let displayText = text
      let isShowingAmount = false

      if (isGold && cycleWinAmount && cycleWinAmount > 0) {
        // Cycle: WIN shows for 0.5s, then amount shows for 1.5s (total 2s cycle)
        const cycleMs = now % 2000
        isShowingAmount = cycleMs >= 500  // After 500ms, switch to amount
        displayText = isShowingAmount ? formatCompactAmount(cycleWinAmount) : 'WIN'
      }

      const textWidth = ctx.measureText(displayText).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = height / 2

      // Position centered on x
      const badgeX = x - width / 2
      const badgeY = y

      if (isGold) {
        // Pulsing animation for WIN badge - oscillates over 1.5 seconds
        const pulsePhase = (now % 1500) / 1500
        const pulseValue = 0.7 + 0.3 * Math.sin(pulsePhase * Math.PI * 2)
        const glowPulse = 0.6 + 0.4 * Math.sin(pulsePhase * Math.PI * 2)

        // Special gold WIN badge with animated glow and gradient
        ctx.shadowColor = `rgba(251, 191, 36, ${glowPulse})`
        ctx.shadowBlur = (12 + 6 * pulseValue) * scale
        ctx.shadowOffsetY = 0

        // Draw gold gradient background
        drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
        const goldGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + width, badgeY + height)
        goldGradient.addColorStop(0, '#fbbf24')    // Light gold
        goldGradient.addColorStop(0.3, '#f59e0b')  // Medium gold
        goldGradient.addColorStop(0.7, '#d97706')  // Dark gold
        goldGradient.addColorStop(1, '#fbbf24')    // Back to light
        ctx.fillStyle = goldGradient
        ctx.fill()

        // Gold border
        ctx.strokeStyle = '#fef3c7'
        ctx.lineWidth = 1.5 * scale
        ctx.stroke()

        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0

        // Draw text
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (isShowingAmount && cycleWinAmount) {
          // Amount phase - show in green/white for high contrast
          ctx.fillStyle = '#166534'  // Dark green for amount on gold background
          ctx.fillText(displayText, badgeX + width / 2, badgeY + height / 2)
        } else if (amountColor && text.includes('+')) {
          // Legacy: Split text at the + sign to color the amount differently
          const plusIndex = text.indexOf('+')
          const labelPart = text.substring(0, plusIndex) // "WIN "
          const amountPart = text.substring(plusIndex)   // "+138.5M"

          // Calculate widths for positioning
          const labelWidth = ctx.measureText(labelPart).width
          const amountWidth = ctx.measureText(amountPart).width
          const totalWidth = labelWidth + amountWidth
          const startX = badgeX + width / 2 - totalWidth / 2

          // Draw label part in dark color
          ctx.fillStyle = '#1c1917'
          ctx.textAlign = 'left'
          ctx.fillText(labelPart, startX, badgeY + height / 2)

          // Draw amount part in the specified color
          ctx.fillStyle = amountColor
          ctx.fillText(amountPart, startX + labelWidth, badgeY + height / 2)
        } else {
          // Standard single-color text (WIN or other)
          ctx.fillStyle = '#1c1917'  // Dark brown/black for contrast on gold
          ctx.fillText(displayText, badgeX + width / 2, badgeY + height / 2)
        }
      } else {
        // Standard badge
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 6 * scale
        ctx.shadowOffsetY = 2 * scale

        // Background with border
        drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
        ctx.fillStyle = color
        ctx.fill()

        // Subtle border for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1 * scale
        ctx.stroke()

        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        // Text
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, badgeX + width / 2, badgeY + height / 2)
      }
    })
  }
}
