/**
 * Action Badge Prototype - Showcase of different styling variants
 *
 * This file demonstrates 6 different approaches to rendering larger,
 * more visually appealing action badges (CHECK, CALL, RAISE, BET, FOLD, ALL-IN)
 *
 * Architecture:
 * - BadgeStyle: Visual appearance (gradient, glass, neon, chip, ribbon, minimal)
 * - BadgeAnimation: Motion effect (none, float, pop, slide, bounce)
 * - Any style can be combined with any animation
 *
 * To test: Import and use in a debug/test component
 */

import type { ReplayerTheme } from '../types/canvas-types'
import { drawRoundedRect, withContext } from '../utils/drawing'

// =====================
// Style Types (Visual Appearance)
// =====================

export type BadgeStyle =
  | 'pill-gradient'     // Rounded pill with gradient fill
  | 'glass-morphism'    // Frosted glass effect
  | 'neon-glow'         // Vibrant neon outline glow
  | 'chip-style'        // Poker chip inspired
  | 'ribbon-banner'     // Folded ribbon banner
  | 'minimal-bold'      // Clean, bold typography focused

// =====================
// Animation Types (Motion Effects)
// =====================

export type BadgeAnimation =
  | 'none'              // No animation (static)
  | 'float-fade'        // Floats up and fades out
  | 'pop-dissolve'      // Pops in large then shrinks and dissolves
  | 'slide-away'        // Slides to the side and fades
  | 'bounce-vanish'     // Bounces then vanishes upward

// Legacy type for backwards compatibility
export type ActionBadgeVariant = BadgeStyle | 'float-fade' | 'pop-dissolve' | 'slide-away' | 'bounce-vanish'

interface ActionBadgeOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  action: string        // CHECK, CALL, RAISE, BET, FOLD, ALL-IN, SB, BB, ANTE
  theme: ReplayerTheme
  scale?: number
  /** Visual style of the badge */
  style?: BadgeStyle
  /** Animation effect to apply */
  animation?: BadgeAnimation
  /** Legacy: combined variant (style or animation) - use style + animation instead */
  variant?: ActionBadgeVariant
  now?: number          // For animations
  /** Animation progress for floating/disappearing variants (0 = start, 1 = complete/gone) */
  animProgress?: number
  /** Duration of animation in ms (default 800ms) */
  animDuration?: number
  /** Amount to display (for RAISE, ALL-IN, BET, SB, BB, ANTE) */
  amount?: number
}

// Easing functions are now methods on the class

// Color schemes per action type
const ACTION_COLORS: Record<string, { primary: string; secondary: string; text: string; glow: string }> = {
  CHECK: { primary: '#22c55e', secondary: '#16a34a', text: '#ffffff', glow: 'rgba(34, 197, 94, 0.6)' },
  CALL: { primary: '#22c55e', secondary: '#15803d', text: '#ffffff', glow: 'rgba(34, 197, 94, 0.6)' },
  RAISE: { primary: '#3b82f6', secondary: '#2563eb', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.6)' },
  BET: { primary: '#eab308', secondary: '#ca8a04', text: '#1c1917', glow: 'rgba(234, 179, 8, 0.6)' },
  FOLD: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff', glow: 'rgba(239, 68, 68, 0.6)' },
  'ALL-IN': { primary: '#dc2626', secondary: '#b91c1c', text: '#ffffff', glow: 'rgba(220, 38, 38, 0.7)' },
  // Blind position labels - Blue
  'SB': { primary: '#3b82f6', secondary: '#2563eb', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.6)' },
  'BB': { primary: '#3b82f6', secondary: '#2563eb', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.6)' },
  'ANTE': { primary: '#3b82f6', secondary: '#2563eb', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.6)' },
}

export class ActionBadgePrototype {
  /**
   * Draw action badge with specified style and animation
   *
   * New API: Use style + animation for full control
   * Legacy API: Use variant for backwards compatibility
   *
   * For RAISE/ALL-IN with amount: Two-phase animation
   * - Phase 1 (0-0.4): Large floating green amount rises and fades
   * - Phase 2 (0.4-1): Action label with amount appears and settles
   */
  draw(options: ActionBadgeOptions) {
    const { ctx, x, y, action, theme, scale = 1, variant, style, animation, now = 0, animProgress = 0, amount } = options
    const colors = ACTION_COLORS[action.toUpperCase()] ?? ACTION_COLORS.CHECK!

    // Determine style and animation from new or legacy API
    let resolvedStyle: BadgeStyle = style ?? 'pill-gradient'
    let resolvedAnimation: BadgeAnimation = animation ?? 'none'

    // Legacy variant support - map old variants to new style+animation
    if (variant && !style && !animation) {
      if (['float-fade', 'pop-dissolve', 'slide-away', 'bounce-vanish'].includes(variant)) {
        // Old animated variants used pill-gradient style
        resolvedStyle = 'pill-gradient'
        resolvedAnimation = variant as BadgeAnimation
      } else {
        // Old static variants
        resolvedStyle = variant as BadgeStyle
        resolvedAnimation = 'none'
      }
    }

    // Special two-phase animation for actions with amounts (float amount up, then show badge)
    const actionUpper = action.toUpperCase()
    const isActionWithAmount = ['RAISE', 'ALL-IN', 'CALL', 'BET', 'SB', 'BB', 'ANTE'].includes(actionUpper)
    const hasAmount = amount !== undefined && amount > 0
    const shouldShowTwoPhase = isActionWithAmount && hasAmount && resolvedAnimation !== 'none'

    if (shouldShowTwoPhase) {
      this.drawTwoPhaseAmountAnimation(ctx, x, y, action, amount, colors, theme, scale, resolvedStyle, animProgress, now)
      return
    }

    // Check if this is a blind posting action that should show amount in static badge
    const isBlindAction = ['SB', 'BB', 'ANTE'].includes(actionUpper)
    const showAmountInLabel = hasAmount && (isBlindAction || actionUpper === 'BET')

    // Calculate animation transforms
    const animTransform = this.getAnimationTransform(resolvedAnimation, animProgress, scale)

    // If animation is complete (fully invisible), don't draw
    if (animTransform.opacity <= 0) return

    // Apply animation transforms and draw the styled badge
    withContext(ctx, () => {
      ctx.globalAlpha = animTransform.opacity

      // Transform position
      const animX = x + animTransform.offsetX
      const animY = y + animTransform.offsetY

      // Apply rotation if any
      if (animTransform.rotation !== 0) {
        ctx.translate(animX, animY)
        ctx.rotate(animTransform.rotation)
        ctx.translate(-animX, -animY)
      }

      // Draw the styled badge with animation scale
      const animScale = scale * animTransform.scale

      // For blind/ante actions with amount, show "SB 50K" format
      const displayAction = showAmountInLabel ? `${action} ${this.formatAmount(amount)}` : action
      this.drawStyledBadge(ctx, animX, animY, displayAction, colors, theme, animScale, resolvedStyle, now)

      // Draw animation-specific effects (particles, trails, etc.)
      this.drawAnimationEffects(ctx, animX, animY, action, colors, theme, scale, resolvedAnimation, animProgress)
    })
  }

  /**
   * Two-phase animation for all actions with amounts:
   * Phase 1 (0-0.6): Large floating amount rises and fades out
   * Phase 2 (0.5-1): Action label with amount pops in and settles
   */
  private drawTwoPhaseAmountAnimation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    amount: number,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number,
    style: BadgeStyle,
    progress: number,
    now: number
  ) {
    const phase1End = 0.6  // Phase 1 ends at 60% (slowed down from 40%)
    const phase2Start = 0.5  // Phase 2 starts at 50% (slight overlap for smooth transition)

    // Phase 1: Floating green amount
    if (progress < phase1End) {
      const phase1Progress = progress / phase1End
      this.drawFloatingAmount(ctx, x, y, amount, theme, scale, phase1Progress)
    }

    // Phase 2: Action label with amount
    if (progress >= phase2Start) {
      const phase2Progress = (progress - phase2Start) / (1 - phase2Start)
      this.drawActionWithAmount(ctx, x, y, action, amount, colors, theme, scale, style, phase2Progress, now)
    }
  }

  /**
   * Draw floating amount that rises and fades
   * Clean look without + sign, moderate size for elegance
   */
  private drawFloatingAmount(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    amount: number,
    theme: ReplayerTheme,
    scale: number,
    progress: number
  ) {
    withContext(ctx, () => {
      // Easing for smooth float up (cubic ease-out for smoother motion)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Float up and fade out - elegant rise with longer visibility
      const yOffset = -easeOut * 50 * scale  // Rise 50px (reduced from 65)
      const opacity = 1 - Math.pow(easeOut, 1.2)  // Slower fade for better visibility
      const floatScale = 1.1 + (1 - progress) * 0.2  // Start at 1.3x, shrink to 1.1x (smaller)

      ctx.globalAlpha = opacity

      const fontSize = Math.round(18 * scale * floatScale)  // Smaller base font (18px, was 26px)
      const amountText = this.formatAmount(amount)  // No + sign

      ctx.font = `800 ${fontSize}px ${theme.fontFamily}`

      // Moderate green glow effect
      ctx.shadowColor = 'rgba(34, 197, 94, 0.8)'
      ctx.shadowBlur = 12 * scale

      // Draw text with vibrant green color
      ctx.fillStyle = '#22c55e'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(amountText, x, y + yOffset)
    })
  }

  /**
   * Draw action badge with amount (e.g., "RAISE 150K")
   * Pops in with slight overshoot then settles
   */
  private drawActionWithAmount(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    amount: number,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number,
    style: BadgeStyle,
    progress: number,
    now: number
  ) {
    withContext(ctx, () => {
      // Pop-in effect with overshoot
      let drawScale: number
      let opacity: number

      if (progress < 0.3) {
        // Pop in with overshoot
        const popProgress = progress / 0.3
        const overshoot = 1 + 0.25 * (1 - this.easeOutBack(popProgress))
        drawScale = overshoot
        opacity = Math.min(1, popProgress * 2)
      } else {
        // Settle at normal size
        drawScale = 1
        opacity = 1
      }

      ctx.globalAlpha = opacity

      // Draw badge with action + amount (slightly bigger scale, 1.15x)
      const displayText = `${action} ${this.formatAmount(amount)}`
      const finalScale = scale * drawScale * 1.15
      this.drawStyledBadge(ctx, x, y, displayText, colors, theme, finalScale, style, now)
    })
  }

  /**
   * Format amount for display (e.g., 150000 -> "150K")
   */
  private formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    }
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K`
    }
    return amount.toLocaleString()
  }

  /**
   * Calculate animation transform values based on animation type and progress
   */
  private getAnimationTransform(
    animation: BadgeAnimation,
    progress: number,
    scale: number
  ): { offsetX: number; offsetY: number; scale: number; opacity: number; rotation: number } {
    // Default: no transform
    if (animation === 'none' || progress <= 0) {
      return { offsetX: 0, offsetY: 0, scale: 1, opacity: 1, rotation: 0 }
    }

    switch (animation) {
      case 'float-fade': {
        // Float up and fade out
        const easeOut = 1 - Math.pow(1 - progress, 2)
        return {
          offsetX: 0,
          offsetY: -easeOut * 50 * scale,
          scale: 1 - progress * 0.2,
          opacity: 1 - easeOut,
          rotation: 0,
        }
      }

      case 'pop-dissolve': {
        // Phase 1 (0-0.15): Pop in with overshoot
        // Phase 2 (0.15-0.5): Hold at normal size
        // Phase 3 (0.5-1): Shrink and dissolve
        let drawScale: number
        let opacity: number

        if (progress < 0.15) {
          const popProgress = progress / 0.15
          const overshoot = 1 + 0.5 * (1 - this.easeOutBack(popProgress))
          drawScale = overshoot
          opacity = Math.min(1, popProgress * 2)
        } else if (progress < 0.5) {
          drawScale = 1
          opacity = 1
        } else {
          const dissolveProgress = (progress - 0.5) / 0.5
          drawScale = 1 - dissolveProgress * 0.8
          opacity = 1 - dissolveProgress
        }

        return { offsetX: 0, offsetY: 0, scale: drawScale, opacity, rotation: 0 }
      }

      case 'slide-away': {
        // Slide right and fade
        const easeIn = progress * progress
        return {
          offsetX: easeIn * 80 * scale,
          offsetY: 0,
          scale: 1,
          opacity: 1 - easeIn,
          rotation: easeIn * 0.15,
        }
      }

      case 'bounce-vanish': {
        let yOffset: number
        let drawScale: number
        let opacity: number

        if (progress < 0.3) {
          // First bounce down
          const t = progress / 0.3
          yOffset = Math.sin(t * Math.PI) * 15 * scale
          drawScale = 1 + Math.sin(t * Math.PI) * 0.1
          opacity = 1
        } else if (progress < 0.5) {
          // Bounce up
          const t = (progress - 0.3) / 0.2
          yOffset = -Math.sin(t * Math.PI) * 10 * scale
          drawScale = 1 - Math.sin(t * Math.PI) * 0.05
          opacity = 1
        } else if (progress < 0.7) {
          // Small bounce
          const t = (progress - 0.5) / 0.2
          yOffset = Math.sin(t * Math.PI) * 5 * scale
          drawScale = 1
          opacity = 1
        } else {
          // Rocket upward and vanish
          const t = (progress - 0.7) / 0.3
          const easeIn = t * t * t
          yOffset = -easeIn * 100 * scale
          drawScale = 1 - t * 0.3
          opacity = 1 - t
        }

        return { offsetX: 0, offsetY: yOffset, scale: drawScale, opacity, rotation: 0 }
      }

      default:
        return { offsetX: 0, offsetY: 0, scale: 1, opacity: 1, rotation: 0 }
    }
  }

  /**
   * Draw animation-specific visual effects (particles, trails)
   */
  private drawAnimationEffects(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _action: string,
    colors: typeof ACTION_COLORS.CHECK,
    _theme: ReplayerTheme,
    scale: number,
    animation: BadgeAnimation,
    progress: number
  ) {
    // Dissolve particles for pop-dissolve
    if (animation === 'pop-dissolve' && progress > 0.5) {
      const particleProgress = (progress - 0.5) / 0.5
      this.drawDissolveParticles(ctx, x, y, colors.primary, particleProgress, scale)
    }
  }

  /**
   * Draw the styled badge (delegates to specific style renderer)
   */
  private drawStyledBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number,
    style: BadgeStyle,
    now: number
  ) {
    switch (style) {
      case 'pill-gradient':
        this.drawPillGradient(ctx, x, y, action, colors, theme, scale)
        break
      case 'glass-morphism':
        this.drawGlassMorphism(ctx, x, y, action, colors, theme, scale)
        break
      case 'neon-glow':
        this.drawNeonGlow(ctx, x, y, action, colors, theme, scale, now)
        break
      case 'chip-style':
        this.drawChipStyle(ctx, x, y, action, colors, theme, scale)
        break
      case 'ribbon-banner':
        this.drawRibbonBanner(ctx, x, y, action, colors, theme, scale)
        break
      case 'minimal-bold':
        this.drawMinimalBold(ctx, x, y, action, colors, theme, scale)
        break
    }
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  /**
   * Variant 1: Pill Gradient
   * Classic rounded pill with rich gradient, soft shadow, and bold text
   * Clean, professional look that's easy to read
   */
  private drawPillGradient(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(14 * scale)
      const paddingX = 16 * scale
      const paddingY = 8 * scale

      ctx.font = `800 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = height / 2
      const badgeX = x - width / 2
      const badgeY = y

      // Soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 12 * scale
      ctx.shadowOffsetY = 4 * scale

      // Gradient fill
      drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
      const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + height)
      gradient.addColorStop(0, colors.primary)
      gradient.addColorStop(1, colors.secondary)
      ctx.fillStyle = gradient
      ctx.fill()

      // Inner highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1.5 * scale
      ctx.stroke()

      ctx.shadowColor = 'transparent'

      // Text
      ctx.fillStyle = colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(action, x, y + height / 2)
    })
  }

  /**
   * Variant 2: Glass Morphism
   * Frosted glass effect with blur backdrop and subtle border
   * Modern, elegant appearance
   */
  private drawGlassMorphism(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(15 * scale)
      const paddingX = 18 * scale
      const paddingY = 10 * scale

      ctx.font = `700 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = 12 * scale
      const badgeX = x - width / 2
      const badgeY = y

      // Outer glow
      ctx.shadowColor = colors.glow
      ctx.shadowBlur = 16 * scale

      // Glass background (semi-transparent with color tint)
      drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
      const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + width, badgeY + height)
      gradient.addColorStop(0, `${colors.primary}40`) // 25% opacity
      gradient.addColorStop(1, `${colors.secondary}60`) // 37% opacity
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.shadowColor = 'transparent'

      // Glass border (bright edge)
      ctx.strokeStyle = `${colors.primary}99`
      ctx.lineWidth = 2 * scale
      ctx.stroke()

      // Inner border highlight
      drawRoundedRect(ctx, badgeX + 1, badgeY + 1, width - 2, height - 2, radius - 1)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1 * scale
      ctx.stroke()

      // Text with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4 * scale
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(action, x, y + height / 2)
    })
  }

  /**
   * Variant 3: Neon Glow
   * Vibrant neon outline with pulsing glow animation
   * Eye-catching, arcade-style appearance
   */
  private drawNeonGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number,
    now: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(16 * scale)
      const paddingX = 20 * scale
      const paddingY = 10 * scale

      ctx.font = `900 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = 8 * scale
      const badgeX = x - width / 2
      const badgeY = y

      // Pulsing glow intensity
      const pulse = 0.6 + 0.4 * Math.sin((now % 1000) / 1000 * Math.PI * 2)

      // Multiple glow layers for neon effect
      for (let i = 3; i >= 0; i--) {
        ctx.shadowColor = colors.glow
        ctx.shadowBlur = (20 + i * 8) * scale * pulse

        drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
        ctx.strokeStyle = i === 0 ? colors.primary : `${colors.primary}${Math.round(30 + i * 20).toString(16)}`
        ctx.lineWidth = (4 - i) * scale
        ctx.stroke()
      }

      // Dark inner fill
      ctx.shadowColor = 'transparent'
      drawRoundedRect(ctx, badgeX + 2, badgeY + 2, width - 4, height - 4, radius - 2)
      ctx.fillStyle = 'rgba(10, 10, 20, 0.9)'
      ctx.fill()

      // Neon text
      ctx.shadowColor = colors.primary
      ctx.shadowBlur = 8 * scale * pulse
      ctx.fillStyle = colors.primary
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(action, x, y + height / 2)
    })
  }

  /**
   * Variant 4: Chip Style
   * Poker chip inspired design with notched edge
   * Thematic, fits the poker aesthetic
   */
  private drawChipStyle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(13 * scale)
      const paddingX = 20 * scale
      const paddingY = 12 * scale

      ctx.font = `800 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = height / 2
      const badgeX = x - width / 2
      const badgeY = y

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 8 * scale
      ctx.shadowOffsetY = 3 * scale

      // Main chip body
      drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
      const gradient = ctx.createRadialGradient(
        x, y + height / 2, 0,
        x, y + height / 2, width / 2
      )
      gradient.addColorStop(0, colors.primary)
      gradient.addColorStop(0.8, colors.secondary)
      gradient.addColorStop(1, colors.secondary)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.shadowColor = 'transparent'

      // Chip edge notches
      const notchCount = 12
      const notchWidth = 4 * scale
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'

      for (let i = 0; i < notchCount; i++) {
        const angle = (i / notchCount) * Math.PI * 2 - Math.PI / 2
        // Only draw notches on left and right edges (not top/bottom for pill shape)
        const notchX = x + Math.cos(angle) * (width / 2 - notchWidth / 2)
        const notchY = y + height / 2 + Math.sin(angle) * (height / 2 - 2)

        if (Math.abs(Math.cos(angle)) > 0.5) {
          ctx.beginPath()
          ctx.arc(notchX, notchY, notchWidth / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Inner ring
      drawRoundedRect(ctx, badgeX + 4 * scale, badgeY + 4 * scale, width - 8 * scale, height - 8 * scale, radius - 4 * scale)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2 * scale
      ctx.stroke()

      // Text
      ctx.fillStyle = colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(action, x, y + height / 2)
    })
  }

  /**
   * Variant 5: Ribbon Banner
   * Folded ribbon/banner style with depth
   * Bold, attention-grabbing design
   */
  private drawRibbonBanner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(14 * scale)
      const paddingX = 24 * scale
      const paddingY = 10 * scale
      const foldSize = 8 * scale

      ctx.font = `800 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const badgeX = x - width / 2
      const badgeY = y

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 10 * scale
      ctx.shadowOffsetY = 4 * scale

      // Left fold (darker)
      ctx.beginPath()
      ctx.moveTo(badgeX - foldSize, badgeY + foldSize)
      ctx.lineTo(badgeX, badgeY)
      ctx.lineTo(badgeX, badgeY + height)
      ctx.lineTo(badgeX - foldSize, badgeY + height + foldSize)
      ctx.closePath()
      ctx.fillStyle = colors.secondary
      ctx.fill()

      // Right fold (darker)
      ctx.beginPath()
      ctx.moveTo(badgeX + width + foldSize, badgeY + foldSize)
      ctx.lineTo(badgeX + width, badgeY)
      ctx.lineTo(badgeX + width, badgeY + height)
      ctx.lineTo(badgeX + width + foldSize, badgeY + height + foldSize)
      ctx.closePath()
      ctx.fill()

      ctx.shadowColor = 'transparent'

      // Main banner
      ctx.beginPath()
      ctx.rect(badgeX, badgeY, width, height)
      const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + height)
      gradient.addColorStop(0, colors.primary)
      gradient.addColorStop(0.5, colors.primary)
      gradient.addColorStop(1, colors.secondary)
      ctx.fillStyle = gradient
      ctx.fill()

      // Top highlight
      ctx.beginPath()
      ctx.rect(badgeX, badgeY, width, 3 * scale)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fill()

      // Text
      ctx.fillStyle = colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(action, x, y + height / 2)
    })
  }

  /**
   * Variant 6: Minimal Bold
   * Clean, typography-focused design with strong contrast
   * Simple yet impactful
   */
  private drawMinimalBold(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: string,
    colors: typeof ACTION_COLORS.CHECK,
    theme: ReplayerTheme,
    scale: number
  ) {
    withContext(ctx, () => {
      const fontSize = Math.round(18 * scale)
      const paddingX = 16 * scale
      const paddingY = 8 * scale

      ctx.font = `900 ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(action).width
      const width = textWidth + paddingX * 2
      const height = fontSize + paddingY * 2
      const radius = 6 * scale
      const badgeX = x - width / 2
      const badgeY = y

      // Subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 6 * scale
      ctx.shadowOffsetY = 2 * scale

      // Solid background
      drawRoundedRect(ctx, badgeX, badgeY, width, height, radius)
      ctx.fillStyle = colors.primary
      ctx.fill()

      ctx.shadowColor = 'transparent'

      // Bold bottom border accent
      ctx.beginPath()
      ctx.moveTo(badgeX + radius, badgeY + height)
      ctx.lineTo(badgeX + width - radius, badgeY + height)
      ctx.strokeStyle = colors.secondary
      ctx.lineWidth = 4 * scale
      ctx.lineCap = 'round'
      ctx.stroke()

      // Large, bold text
      ctx.fillStyle = colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Text shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 2 * scale
      ctx.shadowOffsetY = 1 * scale
      ctx.fillText(action, x, y + height / 2)
    })
  }

  // =====================
  // Floating/Disappearing Animation Variants
  // =====================

  /**
   * Draw dissolve particles for pop-dissolve animation
   */
  private drawDissolveParticles(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    progress: number,
    scale: number
  ) {
    const particleCount = 8
    const maxDistance = 40 * scale

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const distance = progress * maxDistance
      const particleX = x + Math.cos(angle) * distance
      const particleY = y + Math.sin(angle) * distance
      const particleSize = (1 - progress) * 4 * scale
      const particleOpacity = (1 - progress) * 0.6

      ctx.beginPath()
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = particleOpacity
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /**
   * Draw all STATIC variants in a grid for comparison
   */
  drawAllVariants(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    theme: ReplayerTheme,
    now: number = 0
  ) {
    const variants: ActionBadgeVariant[] = [
      'pill-gradient',
      'glass-morphism',
      'neon-glow',
      'chip-style',
      'ribbon-banner',
      'minimal-bold',
    ]

    const actions = ['CHECK', 'CALL', 'RAISE', 'BET', 'FOLD', 'ALL-IN']
    const colWidth = 120
    const rowHeight = 60

    // Draw variant labels
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 12px ${theme.fontFamily}`
    ctx.textAlign = 'left'
    variants.forEach((variant, i) => {
      ctx.fillText(variant, startX - 100, startY + i * rowHeight + 20)
    })

    // Draw action labels
    ctx.textAlign = 'center'
    actions.forEach((action, i) => {
      ctx.fillText(action, startX + i * colWidth + colWidth / 2, startY - 20)
    })

    // Draw all combinations
    variants.forEach((variant, row) => {
      actions.forEach((action, col) => {
        this.draw({
          ctx,
          x: startX + col * colWidth + colWidth / 2,
          y: startY + row * rowHeight,
          action,
          theme,
          scale: 0.9,
          variant,
          now,
        })
      })
    })
  }

  /**
   * Draw ANIMATED variants demo showing different animation progress states
   */
  drawAnimatedVariantsDemo(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    theme: ReplayerTheme,
    now: number = 0
  ) {
    const animatedVariants: ActionBadgeVariant[] = [
      'float-fade',
      'pop-dissolve',
      'slide-away',
      'bounce-vanish',
    ]

    const actions = ['CALL', 'RAISE', 'FOLD']
    // Show at different progress points: 0%, 25%, 50%, 75%
    const progressSteps = [0, 0.25, 0.5, 0.75]
    const colWidth = 100
    const rowHeight = 80

    // Section title
    ctx.fillStyle = '#fbbf24'
    ctx.font = `bold 14px ${theme.fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('ANIMATED VARIANTS (showing animation progress)', startX - 100, startY - 40)

    // Draw variant labels
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 11px ${theme.fontFamily}`
    ctx.textAlign = 'left'
    animatedVariants.forEach((variant, i) => {
      ctx.fillText(ACTION_BADGE_LABELS[variant], startX - 100, startY + i * rowHeight + 25)
    })

    // Draw progress labels
    ctx.textAlign = 'center'
    ctx.font = `10px ${theme.fontFamily}`
    ctx.fillStyle = '#94a3b8'
    progressSteps.forEach((p, i) => {
      ctx.fillText(`${Math.round(p * 100)}%`, startX + i * colWidth + colWidth / 2, startY - 15)
    })

    // Draw animated badges at different progress points
    animatedVariants.forEach((variant, row) => {
      progressSteps.forEach((progress, col) => {
        // Use different actions for visual variety
        const action = actions[col % actions.length]!
        this.draw({
          ctx,
          x: startX + col * colWidth + colWidth / 2,
          y: startY + row * rowHeight,
          action,
          theme,
          scale: 0.85,
          variant,
          now,
          animProgress: progress,
        })
      })
    })
  }
}

// =====================
// Export Lists for UI Selectors
// =====================

// Badge styles (visual appearance)
export const BADGE_STYLES: BadgeStyle[] = [
  'pill-gradient',
  'glass-morphism',
  'neon-glow',
  'chip-style',
  'ribbon-banner',
  'minimal-bold',
]

// Badge animations (motion effects)
export const BADGE_ANIMATIONS: BadgeAnimation[] = [
  'none',
  'float-fade',
  'pop-dissolve',
  'slide-away',
  'bounce-vanish',
]

// Labels for styles
export const BADGE_STYLE_LABELS: Record<BadgeStyle, string> = {
  'pill-gradient': 'Gradient',
  'glass-morphism': 'Glass',
  'neon-glow': 'Neon',
  'chip-style': 'Chip',
  'ribbon-banner': 'Ribbon',
  'minimal-bold': 'Minimal',
}

// Labels for animations
export const BADGE_ANIMATION_LABELS: Record<BadgeAnimation, string> = {
  'none': 'None',
  'float-fade': 'Float',
  'pop-dissolve': 'Pop',
  'slide-away': 'Slide',
  'bounce-vanish': 'Bounce',
}

// Legacy exports for backwards compatibility
export const ACTION_BADGE_VARIANTS: ActionBadgeVariant[] = [
  'pill-gradient',
  'glass-morphism',
  'neon-glow',
  'chip-style',
  'ribbon-banner',
  'minimal-bold',
  'float-fade',
  'pop-dissolve',
  'slide-away',
  'bounce-vanish',
]

export const STATIC_BADGE_VARIANTS: ActionBadgeVariant[] = [
  'pill-gradient',
  'glass-morphism',
  'neon-glow',
  'chip-style',
  'ribbon-banner',
  'minimal-bold',
]

export const ANIMATED_BADGE_VARIANTS: ActionBadgeVariant[] = [
  'float-fade',
  'pop-dissolve',
  'slide-away',
  'bounce-vanish',
]

export const ACTION_BADGE_LABELS: Record<ActionBadgeVariant, string> = {
  'pill-gradient': 'Gradient',
  'glass-morphism': 'Glass',
  'neon-glow': 'Neon',
  'chip-style': 'Chip',
  'ribbon-banner': 'Ribbon',
  'minimal-bold': 'Minimal',
  'float-fade': 'Float',
  'pop-dissolve': 'Pop',
  'slide-away': 'Slide',
  'bounce-vanish': 'Bounce',
}

// =====================
// Deterministic Random Selection (based on handId)
// =====================

/**
 * Lightweight hash function for deterministic variant selection
 * Same handId always produces same result
 */
function hashString(str: string, seed: number = 0): number {
  let hash = seed
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Get deterministic static badge variant from handId
 * Each hand gets a consistent visual style
 */
export function getRandomStaticBadgeVariant(handId?: string): ActionBadgeVariant {
  if (!handId) {
    return STATIC_BADGE_VARIANTS[Math.floor(Math.random() * STATIC_BADGE_VARIANTS.length)]!
  }
  return STATIC_BADGE_VARIANTS[hashString(handId, 10) % STATIC_BADGE_VARIANTS.length]!
}

/**
 * Get deterministic animated badge variant from handId
 * Each hand gets a consistent animation style
 */
export function getRandomAnimatedBadgeVariant(handId?: string): ActionBadgeVariant {
  if (!handId) {
    return ANIMATED_BADGE_VARIANTS[Math.floor(Math.random() * ANIMATED_BADGE_VARIANTS.length)]!
  }
  return ANIMATED_BADGE_VARIANTS[hashString(handId, 11) % ANIMATED_BADGE_VARIANTS.length]!
}
