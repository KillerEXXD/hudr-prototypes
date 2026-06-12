import type { ReplayerTheme, PotAnimationVariant, PotVisualVariant } from '../types/canvas-types'
import { getRandomPotAnimationVariant, getRandomPotVisualVariant } from '../types/canvas-types'
import { ChipStackEntity } from './ChipStack'
import { drawRoundedRect, withContext } from '../utils/drawing'

const chipStack = new ChipStackEntity()

// Visual animation timing constants
const VISUAL_ANIM_DURATION = 600 // ms

interface PotOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  amount: number
  fromAmount?: number
  slotProgress?: number
  theme: ReplayerTheme
  bounceOffset?: number
  dpr?: number
  handId?: string
  /** Override the automatic counter animation variant selection */
  animationVariant?: PotAnimationVariant
  /** Override the visual effect variant */
  visualVariant?: PotVisualVariant
  /** Current timestamp in ms for time-based animations */
  now?: number
}

// =====================
// Easing Functions
// =====================

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

const easeOutBounce = (t: number): number => {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export class PotEntity {
  private currentVariant: PotAnimationVariant = 'counter-blur'
  private currentVisualVariant: PotVisualVariant = 'none'
  private currentHandId: string | undefined = undefined
  // Track visual animation state
  private visualAnimStartTime: number = 0
  private lastPotAmount: number = 0

  draw({ ctx, x, y, amount, fromAmount, slotProgress = 1, theme, bounceOffset = 0, dpr = 1, handId, animationVariant, visualVariant, now = 0 }: PotOptions) {
    // Use override variant if provided, otherwise use deterministic selection based on handId
    if (animationVariant) {
      this.currentVariant = animationVariant
    } else if (handId !== this.currentHandId) {
      this.currentVariant = getRandomPotAnimationVariant(handId)
    }

    // Use override visual variant if provided, otherwise use deterministic selection based on handId
    if (visualVariant !== undefined) {
      this.currentVisualVariant = visualVariant
    } else if (handId !== this.currentHandId) {
      this.currentVisualVariant = getRandomPotVisualVariant(handId)
    }

    // Track handId change (must be after variant selections)
    if (handId !== this.currentHandId) {
      this.currentHandId = handId
    }

    if (amount <= 0) return

    // Track pot changes for visual animation timing
    if (amount !== this.lastPotAmount && amount > this.lastPotAmount) {
      this.visualAnimStartTime = now
      this.lastPotAmount = amount
    }

    // Calculate visual animation progress (0-1)
    const visualElapsed = now - this.visualAnimStartTime
    const visualProgress = Math.min(1, visualElapsed / VISUAL_ANIM_DURATION)
    const activeVisualVariant = this.currentVisualVariant
    const isVisualAnimating = visualProgress < 1 && activeVisualVariant !== 'none'

    withContext(ctx, () => {
      const displayY = y + bounceOffset

      // Draw visual effects BEHIND the pot elements
      if (isVisualAnimating) {
        this.drawVisualEffect(ctx, x, displayY, activeVisualVariant, visualProgress)
      }

      // Draw chip stack (positioned above the pill)
      chipStack.draw({
        ctx,
        x,
        y: displayY - 28,
        amount,
        theme,
        stackHeight: 4,
        stackGap: 10,
        chipRadius: 12,
        dpr,
      })

      // Calculate the display values
      const isAnimating = slotProgress < 1 && fromAmount !== undefined && fromAmount !== amount

      // Interpolate the actual number value for counter animation
      let displayAmount = amount
      let easedProgress = slotProgress

      if (isAnimating) {
        // Apply different easing based on variant
        switch (this.currentVariant) {
          case 'counter-bounce':
            easedProgress = easeOutBounce(slotProgress)
            break
          case 'counter-elastic':
            easedProgress = easeOutElastic(slotProgress)
            break
          case 'counter-scale':
          case 'counter-glow':
          case 'counter-shake':
            easedProgress = easeOutBack(slotProgress)
            break
          default:
            easedProgress = easeOutCubic(slotProgress)
        }
        displayAmount = Math.round(fromAmount! + (amount - fromAmount!) * easedProgress)
      }

      const displayText = formatAmount(displayAmount)
      const fontSize = 18
      const labelFontSize = 11

      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(displayText).width

      const pillPadding = 16
      const labelWidth = 36
      const pillWidth = labelWidth + textWidth + pillPadding * 2
      const pillHeight = 32
      const pillX = x - pillWidth / 2
      const pillY = displayY + 8

      // Pill background with gradient and strong shadow
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4
      drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2)

      // Dark gradient background
      const gradient = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight)
      gradient.addColorStop(0, 'rgba(30, 30, 40, 0.95)')
      gradient.addColorStop(1, 'rgba(15, 15, 25, 0.98)')
      ctx.fillStyle = gradient
      ctx.fill()

      // Gold border for visibility - enhanced glow for glow variant
      if (isAnimating && this.currentVariant === 'counter-glow') {
        const glowIntensity = Math.sin(slotProgress * Math.PI) // Peak at 50%
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 + glowIntensity * 0.6})`
        ctx.lineWidth = 1.5 + glowIntensity * 2
      } else {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
        ctx.lineWidth = 1.5
      }
      ctx.stroke()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // POT label (left side of pill)
      ctx.font = `700 ${labelFontSize}px ${theme.fontFamily}`
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('POT', pillX + pillPadding, pillY + pillHeight / 2)

      // Amount text with animation effects
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
      ctx.textAlign = 'right'

      const textX = pillX + pillWidth - pillPadding
      const textY = pillY + pillHeight / 2

      // Apply visual effects based on variant during animation
      if (isAnimating) {
        ctx.save()

        switch (this.currentVariant) {
          case 'counter-blur': {
            // Blur effect - simulated with multiple offset draws
            const blurIntensity = Math.sin(slotProgress * Math.PI) * 0.5 // Peak at 50%
            if (blurIntensity > 0.1) {
              // Draw blurred copies
              for (let i = 0; i < 3; i++) {
                const offset = blurIntensity * 2 * (i - 1)
                ctx.fillStyle = `rgba(251, 191, 36, ${0.2})`
                ctx.fillText(displayText, textX, textY + offset)
              }
            }
            ctx.fillStyle = '#fbbf24'
            ctx.fillText(displayText, textX, textY)
            break
          }

          case 'counter-scale': {
            // Scale pulse effect
            const scalePulse = 1 + Math.sin(slotProgress * Math.PI) * 0.15
            const centerX = textX - textWidth / 2
            ctx.translate(centerX, textY)
            ctx.scale(scalePulse, scalePulse)
            ctx.translate(-centerX, -textY)
            ctx.fillStyle = '#fbbf24'
            ctx.fillText(displayText, textX, textY)
            break
          }

          case 'counter-glow': {
            // Glow effect - draw with shadow
            const glowIntensity = Math.sin(slotProgress * Math.PI)
            ctx.shadowColor = `rgba(251, 191, 36, ${glowIntensity * 0.8})`
            ctx.shadowBlur = 8 + glowIntensity * 12
            ctx.fillStyle = '#fbbf24'
            ctx.fillText(displayText, textX, textY)
            break
          }

          case 'counter-shake': {
            // Shake effect
            const shakeIntensity = Math.sin(slotProgress * Math.PI) * 2
            const shakeX = Math.sin(slotProgress * Math.PI * 20) * shakeIntensity
            const shakeY = Math.cos(slotProgress * Math.PI * 15) * shakeIntensity * 0.5
            ctx.fillStyle = '#fbbf24'
            ctx.fillText(displayText, textX + shakeX, textY + shakeY)
            break
          }

          default: {
            // counter-bounce and counter-elastic just use easing, no extra visual effect
            ctx.fillStyle = '#fbbf24'
            ctx.fillText(displayText, textX, textY)
          }
        }

        ctx.restore()

        // Draw floating "+amount" text that rises and fades
        const addedAmount = amount - fromAmount!
        if (addedAmount > 0) {
          const floatText = `+${formatAmount(addedAmount)}`
          const floatFontSize = 20

          // Float up and fade out over the animation
          const floatY = pillY - 12 - (slotProgress * 40) // Rise 40px
          const floatOpacity = 1 - slotProgress // Fade out as animation progresses

          ctx.save()
          ctx.font = `bold ${floatFontSize}px ${theme.fontFamily}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = `rgba(74, 222, 128, ${floatOpacity})` // Green color (#4ade80)
          ctx.fillText(floatText, x, floatY)
          ctx.restore()
        }
      } else {
        // Static display
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(displayText, textX, textY)
      }
    })
  }

  /**
   * Draw visual effect based on variant
   */
  private drawVisualEffect(ctx: CanvasRenderingContext2D, x: number, y: number, variant: PotVisualVariant, progress: number) {
    ctx.save()

    switch (variant) {
      case 'stack-growth':
        this.drawStackGrowth(ctx, x, y, progress)
        break
      case 'radial-pulse':
        this.drawRadialPulse(ctx, x, y, progress)
        break
      case 'gravity-drop':
        this.drawGravityDrop(ctx, x, y, progress)
        break
      case 'chip-burst':
        this.drawChipBurst(ctx, x, y, progress)
        break
      case 'magnetic-pull':
        this.drawMagneticPull(ctx, x, y, progress)
        break
      case 'ring-fill':
        this.drawRingFill(ctx, x, y, progress)
        break
    }

    ctx.restore()
  }

  /**
   * Stack Growth: Chips fall and stack from above
   */
  private drawStackGrowth(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const chipColors = ['#ffd700', '#e74c3c', '#3498db']
    const numChips = 3
    const chipHeight = 8
    const chipWidth = 32

    for (let i = 0; i < numChips; i++) {
      const delay = i * 0.15
      const chipProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay * numChips)))

      if (chipProgress <= 0) continue

      // Bounce easing for landing
      const bounceProgress = easeOutBounce(chipProgress)
      const startY = y - 60
      const endY = y - 30 - (i * chipHeight)
      const currentY = startY + (endY - startY) * bounceProgress
      const opacity = chipProgress

      ctx.fillStyle = chipColors[i % chipColors.length]
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.ellipse(x, currentY, chipWidth / 2, chipHeight / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      // Add highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.ellipse(x - 5, currentY - 2, chipWidth / 4, chipHeight / 4, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /**
   * Radial Pulse: Golden glow with expanding rings
   */
  private drawRadialPulse(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const centerY = y - 10

    // Draw expanding rings
    for (let i = 0; i < 3; i++) {
      const ringDelay = i * 0.1
      const ringProgress = Math.max(0, Math.min(1, (progress - ringDelay) / 0.6))

      if (ringProgress <= 0) continue

      const scale = 0.5 + ringProgress * 2
      const opacity = 0.8 * (1 - ringProgress)
      const radius = 30 * scale

      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw central glow
    const glowOpacity = Math.sin(progress * Math.PI)
    const glowRadius = 40 + progress * 20
    const gradient = ctx.createRadialGradient(x, centerY, 0, x, centerY, glowRadius)
    gradient.addColorStop(0, `rgba(255, 215, 0, ${glowOpacity * 0.4})`)
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, centerY, glowRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Gravity Drop: Chips fall from above with bounce
   */
  private drawGravityDrop(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const chipPositions = [
      { offsetX: -20, color: '#ffd700' },
      { offsetX: 0, color: '#e74c3c' },
      { offsetX: 20, color: '#3498db' },
    ]

    for (let i = 0; i < chipPositions.length; i++) {
      const chip = chipPositions[i]
      const delay = i * 0.1
      const chipProgress = Math.max(0, Math.min(1, (progress - delay) / 0.4))

      if (chipProgress <= 0) continue

      // Gravity with bounce easing
      const startY = y - 100
      const endY = y - 20
      const bounced = easeOutBounce(chipProgress)
      const currentY = startY + (endY - startY) * bounced
      const opacity = chipProgress

      ctx.globalAlpha = opacity
      ctx.fillStyle = chip.color
      ctx.beginPath()
      ctx.arc(x + chip.offsetX, currentY, 12, 0, Math.PI * 2)
      ctx.fill()

      // Inner border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(x + chip.offsetX - 3, currentY - 3, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /**
   * Chip Burst: Chips appear with spin and sparkles
   */
  private drawChipBurst(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const centerY = y - 10

    // Draw sparkles
    const numSparkles = 8
    for (let i = 0; i < numSparkles; i++) {
      const angle = (i / numSparkles) * Math.PI * 2
      const distance = 30 + progress * 40
      const sparkleX = x + Math.cos(angle) * distance
      const sparkleY = centerY + Math.sin(angle) * distance
      const sparkleOpacity = 1 - progress
      const sparkleSize = 3 * (1 - progress * 0.5)

      ctx.fillStyle = `rgba(255, 215, 0, ${sparkleOpacity})`
      ctx.beginPath()
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw central chip with scale and rotation
    const scale = progress < 0.5 ? progress * 2 * 1.2 : 1 + (1 - progress) * 0.2
    const rotation = progress * Math.PI * 2

    ctx.save()
    ctx.translate(x, centerY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

    // Chip body
    const chipRadius = 15
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(0, 0, chipRadius, 0, Math.PI * 2)
    ctx.fill()

    // Chip border
    ctx.strokeStyle = '#cc8800'
    ctx.lineWidth = 2
    ctx.stroke()

    // Chip highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(-4, -4, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * Magnetic Pull: Effect showing chips being drawn toward center
   */
  private drawMagneticPull(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const centerY = y - 10
    const numChips = 4
    const startRadius = 80
    const endRadius = 20

    for (let i = 0; i < numChips; i++) {
      const angle = (i / numChips) * Math.PI * 2 + Math.PI / 4
      const easedProgress = easeOutCubic(progress)
      const currentRadius = startRadius - (startRadius - endRadius) * easedProgress
      const chipX = x + Math.cos(angle) * currentRadius
      const chipY = centerY + Math.sin(angle) * currentRadius
      const chipScale = 1 - progress * 0.7 // Shrink as they approach
      const chipOpacity = 1 - progress * 0.8

      ctx.globalAlpha = chipOpacity
      ctx.save()
      ctx.translate(chipX, chipY)
      ctx.scale(chipScale, chipScale)

      // Chip
      ctx.fillStyle = ['#ffd700', '#e74c3c', '#3498db', '#27ae60'][i]
      ctx.beginPath()
      ctx.arc(0, 0, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.restore()
    }

    // Central pot glow growing
    const glowScale = 1 + progress * 0.5
    const glowOpacity = progress * 0.6
    ctx.globalAlpha = glowOpacity
    const gradient = ctx.createRadialGradient(x, centerY, 0, x, centerY, 30 * glowScale)
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, centerY, 30 * glowScale, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  }

  /**
   * Ring Fill: Circular progress ring fills up
   */
  private drawRingFill(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    const centerY = y - 10
    const radius = 35
    const lineWidth = 6

    // Background ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(x, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Filled ring
    const fillAngle = progress * Math.PI * 2
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x, centerY, radius, -Math.PI / 2, -Math.PI / 2 + fillAngle)
    ctx.stroke()

    // Glow effect at the end
    if (progress > 0 && progress < 1) {
      const endX = x + Math.cos(-Math.PI / 2 + fillAngle) * radius
      const endY = centerY + Math.sin(-Math.PI / 2 + fillAngle) * radius
      const glowRadius = 8

      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(endX, endY, glowRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Completion flash
    if (progress >= 0.95) {
      const flashOpacity = (progress - 0.95) / 0.05 * 0.5
      ctx.fillStyle = `rgba(255, 215, 0, ${flashOpacity})`
      ctx.beginPath()
      ctx.arc(x, centerY, radius + 10, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function formatAmount(amount: number): string {
  const normalized = Math.max(0, amount)
  if (normalized >= 1000000) {
    return `${(normalized / 1000000).toFixed(2)}M`
  }
  if (normalized >= 1000) {
    return `${(normalized / 1000).toFixed(normalized >= 10000 ? 0 : 2)}K`
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: normalized < 100 ? 2 : 0,
  }).format(normalized)
}
