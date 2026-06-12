/**
 * HandInfoOverlay - Displays hand number and tournament name
 *
 * Shows in center during blind posting, floats up when community cards dealt,
 * floats back down above community cards when winner is determined.
 */

import type { ReplayerTheme } from '../types/canvas-types'
import { withContext } from '../utils/drawing'

// Animation timing constants
const FLOAT_DURATION = 400 // ms for float in/out animation

interface HandInfoOverlayOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  handNumber?: number
  tournamentName?: string
  theme: ReplayerTheme
  /** Animation progress 0-1 (0 = hidden, 1 = fully visible) */
  animationProgress: number
  /** Position mode: 'center' for initial, 'above-cards' for after winner */
  positionMode: 'center' | 'above-cards'
}

// Easing functions
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t: number): number => t * t * t

/**
 * Truncate text to maxLength characters with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 1).trim() + '…'
}

export class HandInfoOverlayEntity {
  private lastVisible: boolean = false
  private animationStartTime: number = 0
  private currentProgress: number = 0

  /**
   * Update animation state and return current progress
   */
  updateAnimation(visible: boolean, now: number): number {
    // Detect visibility change
    if (visible !== this.lastVisible) {
      this.animationStartTime = now
      this.lastVisible = visible
    }

    const elapsed = now - this.animationStartTime
    const rawProgress = Math.min(1, elapsed / FLOAT_DURATION)

    if (visible) {
      // Animating in - ease out for smooth arrival
      this.currentProgress = easeOutCubic(rawProgress)
    } else {
      // Animating out - ease in for smooth departure, then invert
      this.currentProgress = 1 - easeInCubic(rawProgress)
    }

    return this.currentProgress
  }

  draw({
    ctx,
    x,
    y,
    handNumber,
    tournamentName,
    theme,
    animationProgress,
    positionMode,
  }: HandInfoOverlayOptions) {
    // Don't draw if completely hidden
    if (animationProgress <= 0) return

    // Skip if no content to show
    if (!handNumber && !tournamentName) return

    withContext(ctx, () => {
      // Calculate float offset - float up when hiding
      const floatOffset = (1 - animationProgress) * 50 // Float up 50px when hiding

      // Adjust Y position based on mode and animation
      let displayY = y - floatOffset
      if (positionMode === 'above-cards') {
        // Position above community cards area (higher up)
        displayY = y - 60 - floatOffset
      }

      // Apply opacity based on animation progress
      ctx.globalAlpha = animationProgress

      // Prepare text content
      const handText = handNumber ? `Hand #${handNumber}` : ''
      const tourneyText = tournamentName ? truncateText(tournamentName, 22) : ''

      // Font settings
      const handFontSize = 16
      const tourneyFontSize = 13
      const lineSpacing = 6
      const padding = { x: 20, y: 12 }

      // Measure text widths
      ctx.font = `bold ${handFontSize}px ${theme.fontFamily}`
      const handWidth = handText ? ctx.measureText(handText).width : 0

      ctx.font = `500 ${tourneyFontSize}px ${theme.fontFamily}`
      const tourneyWidth = tourneyText ? ctx.measureText(tourneyText).width : 0

      const maxTextWidth = Math.max(handWidth, tourneyWidth)

      // Calculate pill dimensions
      const hasHandNumber = handText.length > 0
      const hasTourneyName = tourneyText.length > 0
      const lineCount = (hasHandNumber ? 1 : 0) + (hasTourneyName ? 1 : 0)

      if (lineCount === 0) return

      const contentHeight =
        (hasHandNumber ? handFontSize : 0) +
        (hasTourneyName ? tourneyFontSize : 0) +
        (lineCount > 1 ? lineSpacing : 0)

      const pillWidth = maxTextWidth + padding.x * 2
      const pillHeight = contentHeight + padding.y * 2
      const pillX = x - pillWidth / 2
      const pillY = displayY - pillHeight / 2
      const borderRadius = pillHeight / 2

      // Draw pill background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 4

      // Rounded rectangle path
      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, borderRadius)

      // Semi-transparent dark gradient background
      const gradient = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight)
      gradient.addColorStop(0, 'rgba(20, 20, 30, 0.92)')
      gradient.addColorStop(1, 'rgba(10, 10, 20, 0.95)')
      ctx.fillStyle = gradient
      ctx.fill()

      // Subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Draw text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let textY = displayY

      // Adjust starting Y if we have both lines
      if (hasHandNumber && hasTourneyName) {
        textY = displayY - (tourneyFontSize + lineSpacing) / 2
      }

      // Draw hand number
      if (hasHandNumber) {
        ctx.font = `bold ${handFontSize}px ${theme.fontFamily}`
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fillText(handText, x, textY)

        if (hasTourneyName) {
          textY += handFontSize / 2 + lineSpacing + tourneyFontSize / 2
        }
      }

      // Draw tournament name
      if (hasTourneyName) {
        ctx.font = `500 ${tourneyFontSize}px ${theme.fontFamily}`
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillText(tourneyText, x, textY)
      }

      // Reset alpha
      ctx.globalAlpha = 1
    })
  }
}
