import type { ReplayPlayer } from '@/types/replay'
import type { PlayerRenderProps, ReplayerTheme, ActionBadgeVariant, BadgeStyle, BadgeAnimation, WinAnimationStyle } from '../types/canvas-types'
import { ANIMATED_ACTION_BADGE_VARIANTS, getRandomBadgeStyle, getRandomBadgeAnimation, getRandomWinAnimationStyle } from '../types/canvas-types'
import { drawRoundedRect, withContext } from '../utils/drawing'
import { CardEntity } from './Card'
import { StatusBadgeEntity } from './StatusBadge'
import { ActionBadgePrototype } from './ActionBadgePrototype'
import { ChipStackEntity } from './ChipStack'
import { logger } from '@/lib/logger'
import { formatAmount, formatStackWithCommas, truncateName } from './playerFormatters'
import { generateAvatarColor, lighten, countryFlags } from './playerColors'
import { getPlayerLayout } from './playerLayout'
import { getPortraitLayoutConfig } from '../utils/coordinates'
export type { GetPlayerLayoutOptions } from './playerLayout'
export { getPlayerLayout } from './playerLayout'

const card = new CardEntity()
const statusBadge = new StatusBadgeEntity()
const actionBadge = new ActionBadgePrototype()
const chipStack = new ChipStackEntity()

// Track when each player's action badge animation started
// Key: `${handId}-${playerId}-${action}`, Value: start timestamp
const actionBadgeAnimStartTimes = new Map<string, number>()

// Track when each player's win animation started
// Key: `${handId}-${playerId}`, Value: start timestamp
const winAnimStartTimes = new Map<string, number>()

// Animation duration for animated badge variants (ms)
// Slowed down from 1200ms for smoother floating animation
const ACTION_BADGE_ANIM_DURATION = 2000

// Win animation durations (ms) - based on CSS animation durations from prototype
const WIN_ANIM_DURATIONS: Record<WinAnimationStyle, number> = {
  'shrink-settle': 2000,
  'burst-glow': 2200,
  'cinematic-zoom': 2800,
}

// Base dimensions moved to ./playerLayout.ts

// Avatar image cache (for when no cards are shown)
const avatarCache = new Map<string, HTMLImageElement | 'loading' | 'failed'>()

// Country flags imported from ./playerColors

interface PlayerEntityOptions extends PlayerRenderProps {
  ctx: CanvasRenderingContext2D
  theme: ReplayerTheme
  dpr: number
  now?: number
  showWinAmount?: boolean
  /** Canvas height in pixels - used to determine if player is at top of table */
  canvasHeight?: number
  /** Canvas width in pixels - used for proportional bet offset scaling on mobile */
  canvasWidth?: number
  /** Hand ID for deterministic action badge variant selection */
  handId?: string
  /** Override action badge variant (from dropdown selector) - LEGACY */
  actionBadgeVariant?: ActionBadgeVariant
  /** Override badge style (visual appearance) */
  badgeStyle?: BadgeStyle
  /** Override badge animation (motion effect) */
  badgeAnimation?: BadgeAnimation
  /** When true, this is a runout step - don't show any action badges (all-in, no further actions) */
  isRunout?: boolean
  /** When true, this is an all-in + call scenario - use static chip-style badges, no animation */
  isAllInCall?: boolean
  /** Win animation style for winner reveal */
  winAnimationStyle?: WinAnimationStyle
  // =====================
  // Experimental Features (URL param: ?experiments=... or debug mode)
  // =====================
  /** EXPERIMENTAL: Use image-based cards from assets folder */
  useImageCards?: boolean
  /** EXPERIMENTAL: Center action badges ON avatar instead of above/below (BUG-179) */
  centeredBadges?: boolean
  /** Card size multiplier (default 1.0, range 0.5-2.0) - from debug mode */
  cardScale?: number
  /** Total number of players at the table — used for per-count win badge spacing */
  playerCount?: number
}

export class PlayerEntity {
  draw(options: PlayerEntityOptions) {
    const { ctx, player, position, showCards, isActive, isWinner, isHighlighted, theme, dpr, now = 0, winAmount, showWinAmount, canvasHeight, canvasWidth, handId, actionBadgeVariant, badgeStyle, badgeAnimation, isRunout, isAllInCall, winAnimationStyle, useImageCards, cardScale, playerCount } = options

    const layout = getPlayerLayout({ position, canvasHeight, canvasWidth, useImageCards, cardScale })
    const scale = layout.scale
    // Show cards inside wreath when face-up (revealed) OR when folded with hole cards (greyed out)
    // Mystery cards with 'hidden' status always show card backs (never reveal)
    const isMysteryHidden = player.mysteryStatus === 'hidden';
    const shouldShowCardsInFrame = player.holeCards && !isMysteryHidden && (showCards || player.isFolded)

    // Debug: Log folded player card rendering
    if (player.isFolded) {
      logger.debug('[Player.draw] Folded player:', {
        name: player.name,
        isFolded: player.isFolded,
        hasHoleCards: !!player.holeCards,
        holeCards: player.holeCards,
        showCards,
        shouldShowCardsInFrame,
      })
    }

    withContext(ctx, () => {
      // Dim the entire player entity when folded — wreath, avatar, cards, name box all fade uniformly
      if (player.isFolded) {
        ctx.globalAlpha = 0.4
      }

      // Draw laurel wreath frame with glow
      this.drawLaurelWreath(ctx, layout.frame.x, layout.frame.y, layout.frame.radius, scale, isActive || isHighlighted, isWinner)

      // Draw content inside frame: face-up cards or avatar
      if (shouldShowCardsInFrame) {
        // Resolve win animation style for this hand
        const resolvedWinStyle = winAnimationStyle ?? getRandomWinAnimationStyle(handId)
        this.drawHoleCards(ctx, player, true, isWinner, theme, layout, dpr, now, resolvedWinStyle, useImageCards)
      } else {
        // Draw avatar when cards are hidden or face-down
        this.drawAvatarFallback(ctx, player, layout.frame, theme, scale)
      }

      // Name box (below frame)
      this.drawNameBox(ctx, player, layout, theme, scale)

      // Level badge (top-left of frame)
      if (player.level !== undefined && player.level > 0) {
        this.drawLevelBadge(ctx, layout.levelBadge.x, layout.levelBadge.y, player.level, theme, scale)
      }

      if (player.currentBet > 0) {
        this.drawCurrentBet(ctx, layout.betSpot.x, layout.betSpot.y, player.currentBet, theme, dpr, scale)
      }

      // Position indicator (dealer chip only for cleaner look)
      if (player.position) {
        if (theme.showDealerChipOnly) {
          if (player.position === 'BTN') {
            // Position dealer chip based on player position on table
            // For bottom players: place chip to the LEFT of the frame (to avoid close button overlap at top-right)
            // For other players: place chip to the upper-right of frame
            let chipX: number
            let chipY: number

            if (layout.isBottomPosition) {
              // Bottom player: place chip to the LEFT of the frame
              chipX = layout.frame.x - layout.frame.radius - 16 * scale
              chipY = layout.frame.y - layout.frame.radius - 8 * scale
            } else if (layout.isTopPosition) {
              // Top player: place chip to the LEFT of the frame (to avoid close button at top-right)
              chipX = layout.frame.x - layout.frame.radius - 16 * scale
              chipY = layout.frame.y + 8 * scale  // Slightly below frame center for visibility
            } else {
              // Middle positions (left/right sides): place to upper-right of frame
              chipX = layout.frame.x + layout.frame.radius + 8 * scale
              chipY = layout.frame.y - layout.frame.radius - 8 * scale
            }
            this.drawDealerChip(ctx, chipX, chipY, theme, scale, now)
          }
        } else {
          this.drawPositionBadgeCentered(
            ctx,
            layout.nameBox.x + layout.nameBox.width / 2,
            layout.nameBox.y + layout.nameBox.height + 4 * scale,
            player.position,
            theme,
            scale
          )
        }
      }

      // Status/Action badge - positioned based on player position
      // On runout steps, skip action badges UNLESS isAllInCall is true
      // When isAllInCall is true, we want to preserve CALL/ALL-IN labels during runout until winner
      // Skip WIN badge when showWinAmount is true (we use animated WIN text instead)
      const skipWinBadge = isWinner && showWinAmount
      const badgeInfo = (isRunout && !isAllInCall) || skipWinBadge ? null : this.getStatusBadge(player, isWinner, showWinAmount ? winAmount : undefined)
      if (badgeInfo) {
        // Shift the badge to the left if dealer chip is shown (to avoid overlap)
        const isDealer = theme.showDealerChipOnly && player.position === 'BTN'
        const badgeXOffset = isDealer ? -20 * scale : 0

        // Badge positioning: Center ON the avatar frame (BUG-179, BUG-438)
        // All badges (SB, BB, DEAD SB, etc.) render at the center of the avatar
        const badgeY = layout.frame.y

        // Use ActionBadgePrototype for action badges (CHECK, CALL, RAISE, BET, FOLD, ALL-IN, SB/BB, ANTE)
        // Use StatusBadgeEntity for special badges (WIN, DEAD, STRADDLE)
        const isActionBadge = ['CHECK', 'CALL', 'RAISE', 'BET', 'FOLD', 'ALL-IN', 'SB', 'BB', 'ANTE'].includes(badgeInfo.text)

        if (isActionBadge) {
          // Use the new larger action badge prototype with separate style + animation
          // New API: Use badgeStyle + badgeAnimation for full control
          // Legacy fallback: Use actionBadgeVariant for backwards compatibility

          // Use chip-style with no animation when:
          // 1. Player is all-in (always static badge), OR
          // 2. isAllInCall is true (no more betting in future streets - all players show Stack labels)
          // 3. SB/BB position labels (static until cards are dealt)
          // Labels stay until street ends, then get cleared at winner step
          const isBlindLabel = badgeInfo.text === 'SB' || badgeInfo.text === 'BB'
          const useStaticBadge = player.isAllIn || isAllInCall || isBlindLabel
          const resolvedStyle = useStaticBadge ? 'chip-style' : (badgeStyle ?? getRandomBadgeStyle(handId))
          const resolvedAnimation = useStaticBadge ? 'none' : (badgeAnimation ?? getRandomBadgeAnimation(handId))

          // Debug: Log resolved style/animation for all-in scenarios
          if (player.isAllIn || badgeInfo.text === 'ALL-IN') {
            logger.debug('[Player.draw] ALL-IN badge style for', player.name, {
              playerIsAllIn: player.isAllIn,
              isAllInCall,
              useStaticBadge,
              resolvedStyle,
              resolvedAnimation,
            })
          }

          // Calculate animation progress for animated variants
          let animProgress = 0
          const hasAnimation = resolvedAnimation !== 'none'

          // Also check legacy variant for animated types
          const legacyIsAnimated = actionBadgeVariant && ANIMATED_ACTION_BADGE_VARIANTS.includes(actionBadgeVariant)
          const shouldAnimate = !useStaticBadge && (hasAnimation || legacyIsAnimated)

          if (shouldAnimate && now > 0) {
            // Track animation start time per player/action
            const animKey = `${handId ?? 'unknown'}-${player.id}-${badgeInfo.text}`

            if (!actionBadgeAnimStartTimes.has(animKey)) {
              // First time seeing this action for this player in this hand
              actionBadgeAnimStartTimes.set(animKey, now)
            }

            const startTime = actionBadgeAnimStartTimes.get(animKey)!
            const elapsed = now - startTime
            animProgress = Math.min(1, elapsed / ACTION_BADGE_ANIM_DURATION)

            // Clean up old entries (when action changes or animation completes)
            if (animProgress >= 1) {
              // Animation complete - keep badge visible at final state
              animProgress = 1
            }
          }

          actionBadge.draw({
            ctx,
            x: layout.statusAnchor.x + badgeXOffset,
            y: badgeY,
            action: badgeInfo.text,
            theme,
            scale,
            // New API: pass style and animation separately
            style: resolvedStyle,
            animation: resolvedAnimation,
            // Legacy: still pass variant for backwards compat (will be ignored if style/animation set)
            variant: actionBadgeVariant,
            now,
            animProgress,
            // Pass amount for RAISE, ALL-IN, BET, SB, BB, ANTE
            amount: badgeInfo.amount,
          })
        } else {
          // Use original status badge for WIN, DEAD, STRADDLE
          statusBadge.draw({
            ctx,
            x: layout.statusAnchor.x + badgeXOffset,
            y: badgeY,
            text: badgeInfo.text,
            theme,
            color: badgeInfo.color,
            scale,
            isGold: badgeInfo.isGold,
            isLarge: badgeInfo.isLarge,
            now,
            // White color for win amount (only when showWinAmount is true) - high contrast on gold
            amountColor: showWinAmount ? '#ffffff' : undefined,
            // Pass win amount for cycling animation (WIN -> +amount)
            cycleWinAmount: showWinAmount && winAmount ? winAmount : undefined,
          })
        }
      }

      // Draw animated WIN text and net win amount for winners
      if (isWinner && showWinAmount) {
        const resolvedWinStyle = winAnimationStyle ?? getRandomWinAnimationStyle(handId)
        const animDuration = WIN_ANIM_DURATIONS[resolvedWinStyle]

        // Track animation start time
        const animKey = `${handId ?? 'unknown'}-${player.id}`
        if (!winAnimStartTimes.has(animKey)) {
          winAnimStartTimes.set(animKey, now)
        }
        const startTime = winAnimStartTimes.get(animKey)!
        const elapsed = now - startTime
        const animProgress = Math.min(1, elapsed / animDuration)

        // Draw glow ring for burst-glow style
        if (resolvedWinStyle === 'burst-glow') {
          this.drawGlowRingBurst(ctx, layout.frame.x, layout.frame.y, layout.frame.radius * 2, animProgress, scale)
        }

        // Draw animated WIN text below the enlarged cards
        this.drawAnimatedWinText(ctx, layout.frame.x, layout.frame.y, layout.frame.radius, theme, scale, animProgress, resolvedWinStyle)

        // Draw floating net win amount - position depends on player location
        // Top/top-right players: below avatar to avoid hiding
        // Other positions: above avatar
        if (winAmount && winAmount > 0) {
          this.drawFloatingWinAmount(ctx, layout.frame.x, layout.frame.y, winAmount, theme, scale, now, animProgress, layout.isTopPosition, playerCount)
        }
      }
    })
  }

  /**
   * Draw animated WIN text that shrinks and settles below the enlarged cards
   * Based on prototype animations 1, 2, and 4
   * Cards are 1.4x larger when winning, so WIN text starts below that
   */
  private drawAnimatedWinText(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    frameY: number,
    _frameRadius: number,
    theme: ReplayerTheme,
    scale: number,
    animProgress: number,
    style: WinAnimationStyle
  ) {
    withContext(ctx, () => {
      // Calculate animation parameters based on style
      let textScale: number
      let yOffset: number
      let opacity: number
      let glowIntensity: number

      // Final settle position - text stays on cards, minimal movement
      const settleOffset = 0 // Keep WIN text on the cards, don't animate it down

      switch (style) {
        case 'shrink-settle':
          // Prototype 1: Scale from 2.0 to 0.9 (larger final size)
          if (animProgress < 0.15) {
            const t = animProgress / 0.15
            textScale = 2.0 - 0.5 * t // 2.0 to 1.5
            yOffset = -40 * scale * (1 - t)
            opacity = t
            glowIntensity = 0.8 - 0.2 * t
          } else if (animProgress < 0.4) {
            const t = (animProgress - 0.15) / 0.25
            textScale = 1.5 - 0.3 * t // 1.5 to 1.2
            yOffset = -10 * scale * (1 - t)
            opacity = 1
            glowIntensity = 0.6 - 0.3 * t
          } else {
            const t = (animProgress - 0.4) / 0.6
            textScale = 1.2 - 0.3 * t // 1.2 to 0.9
            yOffset = settleOffset * scale * t
            opacity = 1
            glowIntensity = 0.3 - 0.1 * t
          }
          break

        case 'burst-glow':
          // Prototype 2: Burst from 0 to 2.2 to 0.85 (larger final size)
          if (animProgress < 0.2) {
            const t = animProgress / 0.2
            textScale = 2.2 * t // 0 to 2.2
            yOffset = 0
            opacity = t
            glowIntensity = 0.8
          } else if (animProgress < 0.45) {
            const t = (animProgress - 0.2) / 0.25
            textScale = 2.2 - 0.7 * t // 2.2 to 1.5
            yOffset = 0
            opacity = 1
            glowIntensity = 0.6
          } else {
            const t = (animProgress - 0.45) / 0.55
            textScale = 1.5 - 0.65 * t // 1.5 to 0.85
            yOffset = settleOffset * scale * t
            opacity = 1
            glowIntensity = 0.4 - 0.2 * t
          }
          break

        case 'cinematic-zoom':
          // Prototype 4: Zoom from 4.5 to 0.85 (larger final size)
          if (animProgress < 0.15) {
            const t = animProgress / 0.15
            textScale = 4.5 - 2.7 * t // 4.5 to 1.8
            yOffset = -30 * scale * (1 - t)
            opacity = t
            glowIntensity = 1
          } else if (animProgress < 0.35) {
            const t = (animProgress - 0.15) / 0.2
            textScale = 1.8 - 0.5 * t // 1.8 to 1.3
            yOffset = -15 * scale * (1 - t)
            opacity = 1
            glowIntensity = 0.8 - 0.3 * t
          } else {
            const t = (animProgress - 0.35) / 0.65
            textScale = 1.3 - 0.45 * t // 1.3 to 0.85
            yOffset = settleOffset * scale * t
            opacity = 1
            glowIntensity = 0.5 - 0.3 * t
          }
          break

        default:
          textScale = 0.85
          yOffset = settleOffset * scale
          opacity = 1
          glowIntensity = 0.2
      }

      // Position: ON the cards, below the rank letters (AA)
      // Cards are centered in frame at frameY
      // We want WIN text in the lower portion of the card area, not below the cards
      const baseY = frameY + 12 * scale // Centered on cards, slightly below card center
      const textY = baseY + yOffset

      // Font size based on scale and animation
      const baseFontSize = 36 * scale
      const fontSize = Math.round(baseFontSize * textScale)

      // Set up text style
      ctx.font = `900 italic ${fontSize}px ${theme.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Apply glow
      ctx.shadowColor = `rgba(251, 191, 36, ${glowIntensity})`
      ctx.shadowBlur = 20 * scale * glowIntensity

      // Draw WIN text with gold gradient
      const gradient = ctx.createLinearGradient(
        centerX,
        textY - fontSize / 2,
        centerX,
        textY + fontSize / 2
      )
      gradient.addColorStop(0, '#fef3c7') // Light gold
      gradient.addColorStop(0.25, '#fbbf24') // Gold
      gradient.addColorStop(0.5, '#f59e0b') // Orange gold
      gradient.addColorStop(0.75, '#d97706') // Dark orange
      gradient.addColorStop(1, '#92400e') // Brown

      ctx.globalAlpha = opacity
      ctx.fillStyle = gradient
      ctx.fillText('WIN', centerX, textY)

      // Reset
      ctx.globalAlpha = 1
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    })
  }

  /**
   * Draw glow ring burst effect for burst-glow style
   */
  private drawGlowRingBurst(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    baseRadius: number,
    animProgress: number,
    _scale: number
  ) {
    withContext(ctx, () => {
      // Ring animation: 0-25% expand to 2.5x, 25-100% shrink to 0.8x with fade
      let ringScale: number
      let opacity: number

      if (animProgress < 0.25) {
        const t = animProgress / 0.25
        ringScale = 2.5 * t // 0 to 2.5
        opacity = t
      } else {
        const t = (animProgress - 0.25) / 0.75
        ringScale = 2.5 - 1.7 * t // 2.5 to 0.8
        opacity = 1 - 0.8 * t // 1 to 0.2
      }

      const radius = baseRadius * ringScale

      // Draw radial gradient glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `rgba(251, 191, 36, ${0.5 * opacity})`)
      gradient.addColorStop(0.4, `rgba(251, 191, 36, ${0.2 * opacity})`)
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  /**
   * Draw floating net win amount near the avatar with animation
   * Green badge that floats to position near avatar
   * For top positions: floats BELOW avatar to avoid hiding
   * For other positions: floats ABOVE avatar
   */
  private drawFloatingWinAmount(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    amount: number,
    theme: ReplayerTheme,
    scale: number,
    now: number,
    animProgress: number = 1,
    isTopPosition: boolean = false,
    playerCount?: number
  ) {
    withContext(ctx, () => {
      // Animation starts at 20% progress and completes at 100%
      const animStart = 0.2
      const localProgress = animProgress < animStart ? 0 : (animProgress - animStart) / (1 - animStart)

      // BUG-190 FIX: Apply per-count distance multiplier to avoid overlapping player elements
      // More players = tighter layout = smaller multiplier (badge stays closer)
      // Fewer players = more room = larger multiplier (badge further away)
      const distanceMultiplier = playerCount
        ? getPortraitLayoutConfig(playerCount).winBadgeDistance
        : 1.0

      // For top positions: animate downward (below avatar)
      // For other positions: animate upward (above avatar)
      let startY: number
      let endY: number

      if (isTopPosition) {
        // Top position: start at avatar, float DOWN below it
        startY = centerY + 10 * scale
        endY = centerY + 55 * scale * distanceMultiplier
      } else {
        // Other positions: start below avatar, float UP above it
        startY = centerY + 10 * scale
        endY = centerY - 50 * scale * distanceMultiplier
      }

      const floatY = startY + (endY - startY) * Math.min(1, localProgress * 1.2)
      const opacity = Math.min(1, localProgress * 2)

      if (opacity <= 0) return

      // Format amount with + sign
      const text = `+${formatAmount(amount)}`
      const fontSize = Math.round(18 * scale)
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
      const textWidth = ctx.measureText(text).width

      // Badge dimensions
      const paddingX = 16 * scale
      const paddingY = 8 * scale
      const badgeWidth = textWidth + paddingX * 2
      const badgeHeight = fontSize + paddingY * 2
      const badgeX = centerX - badgeWidth / 2
      const badgeY = floatY - badgeHeight / 2

      // Pulsing glow effect (only after animation completes)
      const pulsePhase = (now % 1500) / 1500
      const glowIntensity = localProgress >= 1 ? (0.4 + 0.3 * Math.sin(pulsePhase * Math.PI * 2)) : 0.6

      ctx.globalAlpha = opacity

      // Shadow/glow
      ctx.shadowColor = `rgba(74, 222, 128, ${glowIntensity})`
      ctx.shadowBlur = 15 * scale

      // Green gradient background
      drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2)
      const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeHeight)
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.95)')
      gradient.addColorStop(1, 'rgba(22, 163, 74, 0.95)')
      ctx.fillStyle = gradient
      ctx.fill()

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1 * scale
      ctx.stroke()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // White text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, centerX, floatY)

      ctx.globalAlpha = 1
    })
  }

  private drawLaurelWreath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    scale: number,
    isActive: boolean,
    isWinner: boolean
  ) {
    const wreathColor = isWinner
      ? 'rgba(34, 197, 94, 0.9)'
      : isActive
        ? 'rgba(251, 191, 36, 0.9)'
        : 'rgba(148, 163, 184, 0.5)'

    const leafCount = 20
    const leafLength = 10 * scale
    const leafWidth = 3.5 * scale

    withContext(ctx, () => {
      // Glow effect for active/winner
      if (isActive || isWinner) {
        ctx.shadowColor = isWinner ? 'rgba(34, 197, 94, 0.6)' : 'rgba(251, 191, 36, 0.6)'
        ctx.shadowBlur = 12 * scale
      }

      // Outer decorative ring
      ctx.beginPath()
      ctx.arc(x, y, radius + 4 * scale, 0, Math.PI * 2)
      ctx.strokeStyle = wreathColor
      ctx.lineWidth = 2 * scale
      ctx.stroke()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // Draw laurel leaves around the circle
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2 - Math.PI / 2
        const leafX = x + Math.cos(angle) * (radius + 5 * scale)
        const leafY = y + Math.sin(angle) * (radius + 5 * scale)

        withContext(ctx, () => {
          ctx.translate(leafX, leafY)
          ctx.rotate(angle + Math.PI / 2)

          // Draw leaf shape
          ctx.beginPath()
          ctx.ellipse(0, -leafLength / 2, leafWidth / 2, leafLength / 2, 0, 0, Math.PI * 2)

          const leafGradient = ctx.createLinearGradient(0, -leafLength, 0, 0)
          leafGradient.addColorStop(0, wreathColor)
          leafGradient.addColorStop(1, isWinner ? 'rgba(34, 197, 94, 0.3)' : isActive ? 'rgba(251, 191, 36, 0.3)' : 'rgba(148, 163, 184, 0.15)')
          ctx.fillStyle = leafGradient
          ctx.fill()
        })
      }

      // Inner ring (closer to content)
      ctx.beginPath()
      ctx.arc(x, y, radius - 2 * scale, 0, Math.PI * 2)
      ctx.strokeStyle = wreathColor
      ctx.lineWidth = 1.5 * scale
      ctx.stroke()
    })
  }

  private drawAvatarFallback(
    ctx: CanvasRenderingContext2D,
    player: ReplayPlayer,
    frame: { x: number; y: number; radius: number },
    _theme: ReplayerTheme,
    scale: number
  ) {
    const avatarRadius = frame.radius - 6 * scale

    // Try to draw avatar image first
    if (player.avatar) {
      const cached = avatarCache.get(player.avatar)

      if (cached instanceof HTMLImageElement) {
        withContext(ctx, () => {
          ctx.beginPath()
          ctx.arc(frame.x, frame.y, avatarRadius, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(
            cached,
            frame.x - avatarRadius,
            frame.y - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          )
        })
        return
      }

      if (cached !== 'loading' && cached !== 'failed') {
        avatarCache.set(player.avatar, 'loading')
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => avatarCache.set(player.avatar!, img)
        img.onerror = () => avatarCache.set(player.avatar!, 'failed')
        img.src = player.avatar
      }
    }

    // Fallback: gradient circle
    ctx.beginPath()
    ctx.arc(frame.x, frame.y, avatarRadius, 0, Math.PI * 2)
    const avatarGradient = ctx.createRadialGradient(
      frame.x - avatarRadius * 0.3,
      frame.y - avatarRadius * 0.3,
      0,
      frame.x,
      frame.y,
      avatarRadius
    )
    const avatarColor = generateAvatarColor(player)
    avatarGradient.addColorStop(0, lighten(avatarColor, 0.25))
    avatarGradient.addColorStop(1, avatarColor)
    ctx.fillStyle = avatarGradient
    ctx.fill()
  }

  private drawNameBox(
    ctx: CanvasRenderingContext2D,
    player: ReplayPlayer,
    layout: ReturnType<typeof getPlayerLayout>,
    theme: ReplayerTheme,
    scale: number
  ) {
    const { nameBox } = layout
    const hasFlag = player.countryCode && countryFlags[player.countryCode.toUpperCase()]

    // Name box background
    drawRoundedRect(ctx, nameBox.x, nameBox.y, nameBox.width, nameBox.height, 6 * scale)
    const boxGradient = ctx.createLinearGradient(
      nameBox.x,
      nameBox.y,
      nameBox.x,
      nameBox.y + nameBox.height
    )
    boxGradient.addColorStop(0, 'rgba(20, 30, 50, 0.94)')
    boxGradient.addColorStop(1, 'rgba(10, 18, 30, 0.94)')
    ctx.fillStyle = boxGradient
    ctx.fill()

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1 * scale
    ctx.stroke()

    // Scaled font sizes - larger for better visibility especially on bottom players
    const nameFontSize = Math.round(12 * scale)
    const stackFontSize = Math.round(13 * scale)

    // Player name (centered)
    ctx.fillStyle = theme.playerNameColor
    ctx.font = `600 ${nameFontSize}px ${theme.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const displayName = truncateName(player.name, 10)
    ctx.fillText(displayName, nameBox.x + nameBox.width / 2, nameBox.y + 10 * scale)

    // Stack amount and flag on same line
    const stackText = formatStackWithCommas(player.currentStack)
    ctx.font = `bold ${stackFontSize}px ${theme.fontFamily}`
    const stackWidth = ctx.measureText(stackText).width

    if (hasFlag) {
      const flag = countryFlags[player.countryCode!.toUpperCase()]
      const flagFontSize = Math.round(10 * scale)
      const gap = 4 * scale

      // Stack amount (left of center)
      ctx.fillStyle = theme.stackColor
      ctx.textAlign = 'right'
      ctx.fillText(stackText, nameBox.x + nameBox.width / 2 + stackWidth / 2 - gap / 2, nameBox.y + 22 * scale)

      // Flag (right of stack)
      ctx.font = `${flagFontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(flag!, nameBox.x + nameBox.width / 2 + stackWidth / 2 + gap / 2, nameBox.y + 22 * scale)
    } else {
      // Stack amount centered
      ctx.fillStyle = theme.stackColor
      ctx.textAlign = 'center'
      ctx.fillText(stackText, nameBox.x + nameBox.width / 2, nameBox.y + 22 * scale)
    }
  }

  private drawLevelBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    level: number,
    theme: ReplayerTheme,
    scale: number
  ) {
    const badgeRadius = 10 * scale
    const fontSize = Math.round(9 * scale)

    withContext(ctx, () => {
      // Badge shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4 * scale
      ctx.shadowOffsetY = 1 * scale

      ctx.beginPath()
      ctx.arc(x, y, badgeRadius, 0, Math.PI * 2)

      // Darker background
      const badgeGradient = ctx.createRadialGradient(x, y - badgeRadius * 0.3, 0, x, y, badgeRadius)
      badgeGradient.addColorStop(0, 'rgba(50, 60, 80, 0.95)')
      badgeGradient.addColorStop(1, 'rgba(25, 35, 50, 0.95)')
      ctx.fillStyle = badgeGradient
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Gold border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'
      ctx.lineWidth = 1.5 * scale
      ctx.stroke()

      // Level number
      ctx.fillStyle = '#fbbf24'
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(level.toString(), x, y)
    })
  }

  private drawHoleCards(
    ctx: CanvasRenderingContext2D,
    player: ReplayPlayer,
    showCards: boolean,
    isWinner: boolean,
    theme: ReplayerTheme,
    layout: ReturnType<typeof getPlayerLayout>,
    dpr: number,
    _now: number = 0,
    _winAnimationStyle: WinAnimationStyle = 'shrink-settle',
    useImageCards: boolean = false
  ) {
    if (!player.holeCards) return

    const cards = layout.cards
    const isFolded = player.isFolded

    withContext(ctx, () => {
      // Card scaling: Winners 1.4x larger, Folded 0.9x slightly smaller (10% reduction)
      const cardScale = isWinner ? 1.4 : isFolded ? 0.9 : 1.0
      const card0 = cards[0]!
      const card1 = cards[1] ?? card0

      // Calculate scaled dimensions
      const scaledWidth0 = card0.width * cardScale
      const scaledHeight0 = card0.height * cardScale
      const scaledWidth1 = card1.width * cardScale
      const scaledHeight1 = card1.height * cardScale

      // For winners AND folded, center the scaled cards around the original center point
      const originalCenterX = (card0.x + card1.x + card1.width) / 2
      const originalCenterY = card0.y + card0.height / 2

      // Calculate new positions to center scaled cards
      const shouldCenterCards = isWinner || isFolded
      const totalScaledWidth = scaledWidth0 + scaledWidth1 - (card1.x - (card0.x + card0.width)) * cardScale
      const card0X = shouldCenterCards ? originalCenterX - totalScaledWidth / 2 : card0.x
      const card0Y = shouldCenterCards ? originalCenterY - scaledHeight0 / 2 : card0.y
      const card1X = shouldCenterCards ? card0X + scaledWidth0 - 8 * layout.scale * cardScale : card1.x
      const card1Y = shouldCenterCards ? originalCenterY - scaledHeight1 / 2 : card1.y

      // Note: Folded player opacity is handled at the top-level draw() via globalAlpha = 0.4
      // No per-card alpha override needed — the entire player entity is dimmed uniformly

      // First card
      card.draw({
        ctx,
        x: card0X,
        y: card0Y,
        width: scaledWidth0,
        height: scaledHeight0,
        card: player.holeCards![0],
        faceDown: !showCards && !isFolded,
        highlight: isWinner,
        theme,
        rotation: card0.rotation,
        dpr,
        useImageCards,
      })

      // Second card
      card.draw({
        ctx,
        x: card1X,
        y: card1Y,
        width: scaledWidth1,
        height: scaledHeight1,
        card: player.holeCards![1],
        faceDown: !showCards && !isFolded,
        highlight: isWinner,
        theme,
        rotation: card1.rotation,
        dpr,
        useImageCards,
      })

      // Alpha is restored by the outer withContext save/restore
    })
  }

  private drawCurrentBet(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    amount: number,
    theme: ReplayerTheme,
    dpr: number,
    scale: number = 1
  ) {
    const displayAmount = Math.max(0, amount)
    if (displayAmount <= 0) return

    // Draw larger chip stack for visibility
    chipStack.draw({
      ctx,
      x,
      y,
      amount: displayAmount,
      stackHeight: 4,
      stackGap: 12 * scale,
      chipRadius: 14 * scale,
      theme,
      dpr,
    })

    // Larger, more prominent bet amount pill - increased for visibility
    const text = formatAmount(displayAmount)
    const fontSize = Math.round(15 * scale)
    ctx.font = `700 ${fontSize}px ${theme.fontFamily}`
    const textWidth = ctx.measureText(text).width
    const pillWidth = textWidth + 20 * scale
    const pillHeight = fontSize + 12 * scale
    const pillX = x - pillWidth / 2
    const pillY = y + 16 * scale

    // Strong shadow for visibility
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 8 * scale
    ctx.shadowOffsetY = 3 * scale
    drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2)
    ctx.fillStyle = 'rgba(10, 12, 26, 0.92)'
    ctx.fill()

    // Gold border for visibility
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Gold text for bet amounts (matches pot styling)
    ctx.fillStyle = '#fbbf24'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, pillX + pillWidth / 2, pillY + pillHeight / 2)
  }

  private drawDealerChip(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    theme: ReplayerTheme,
    scale: number = 1,
    now: number = 0
  ) {
    const radius = 10 * scale

    // Subtle pulsing effect - oscillate between 0.6 and 1.0 opacity over 2 seconds
    const pulsePhase = (now % 2000) / 2000 // 0 to 1 over 2 seconds
    const pulseValue = 0.6 + 0.4 * Math.sin(pulsePhase * Math.PI * 2) // oscillates 0.6 to 1.0

    // Prominent gold glow with subtle pulsing
    ctx.shadowColor = `rgba(251, 191, 36, ${0.5 + 0.3 * pulseValue})`
    ctx.shadowBlur = (8 + 4 * pulseValue) * scale
    ctx.shadowOffsetY = 0

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    const chipGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    )
    chipGradient.addColorStop(0, '#ffffff')
    chipGradient.addColorStop(1, '#e8e8e8')
    ctx.fillStyle = chipGradient
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Gold border for visibility
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2 * scale
    ctx.stroke()

    const fontSize = Math.round(11 * scale)
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('D', centerX, centerY)
  }

  private drawPositionBadgeCentered(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    position: string,
    theme: ReplayerTheme,
    scale: number = 1
  ) {
    const positionColors: Record<string, string> = {
      BTN: '#f59e0b',
      SB: '#6366f1',
      BB: '#22c55e',
      UTG: '#ef4444',
      MP: '#8b5cf6',
      CO: '#ec4899',
      HJ: '#14b8a6',
    }

    const color = positionColors[position] ?? '#64748b'
    const padding = 4 * scale
    const fontSize = Math.round(9 * scale)

    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
    const textWidth = ctx.measureText(position).width

    const badgeWidth = textWidth + padding * 2
    const badgeHeight = fontSize + padding * 1.5
    const badgeX = centerX - badgeWidth / 2
    const badgeY = centerY - badgeHeight / 2

    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4 * scale)
    ctx.fillStyle = color
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(position, centerX, centerY)
  }

  private getStatusBadge(player: ReplayPlayer, isWinner: boolean, _winAmount?: number): { text: string; color: string; isGold?: boolean; isLarge?: boolean; amount?: number } | null {
    // Winner gets gold "WIN" badge - amount shown via cycling animation
    if (isWinner) {
      return { text: 'WIN', color: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', isGold: true, isLarge: true }
    }
    // Dead position badge - show "DEAD SB" or "DEAD BTN" in muted red
    if (player.isDeadPosition) {
      // Extract position from name if available (e.g., "Dead SB" -> "DEAD SB")
      const posMatch = player.name.match(/^Dead\s+(SB|BTN)$/i)
      const badgeText = posMatch ? `DEAD ${posMatch[1].toUpperCase()}` : 'DEAD'
      return { text: badgeText, color: 'rgba(185, 28, 28, 0.85)' }  // Dark red (muted)
    }
    // ALL-IN badge - persistent state (shows until showdown) - RED
    // Include the all-in amount for the two-phase animation
    if (player.isAllIn) {
      return { text: 'ALL-IN', color: 'rgba(220, 38, 38, 0.95)', amount: player.currentBet }  // Red
    }
    // FOLD badge - only show when lastAction is 'fold' (momentary, clears on next step) - RED
    // Cards are already greyed out which indicates fold state, so no persistent badge needed
    if (player.lastAction === 'fold') {
      return { text: 'FOLD', color: 'rgba(220, 38, 38, 0.95)' }  // Red
    }
    if (player.hasStraddled) {
      return { text: 'STRADDLE', color: 'rgba(56, 189, 248, 0.9)' }  // Cyan
    }
    // Action-based badges - only show on the step when action occurs
    // RAISE - Blue - include amount for two-phase animation
    if (player.lastAction === 'raise') {
      return { text: 'RAISE', color: 'rgba(59, 130, 246, 0.95)', amount: player.currentBet }  // Blue
    }
    // BET - Yellow - include amount
    if (player.lastAction === 'bet') {
      return { text: 'BET', color: 'rgba(234, 179, 8, 0.95)', amount: player.currentBet }  // Yellow
    }
    // CALL - Green
    if (player.lastAction === 'call') {
      return { text: 'CALL', color: 'rgba(34, 197, 94, 0.95)' }  // Green
    }
    // CHECK - Light green
    if (player.lastAction === 'check') {
      return { text: 'CHECK', color: 'rgba(34, 197, 94, 0.8)' }  // Green (lighter)
    }
    // SMALL BLIND label - Blue (shown on initial state, no amount)
    if (player.lastAction === 'small-blind') {
      return { text: 'SB', color: 'rgba(59, 130, 246, 0.95)' }  // Blue
    }
    // BIG BLIND label - Blue (shown on initial state, no amount)
    if (player.lastAction === 'big-blind') {
      return { text: 'BB', color: 'rgba(59, 130, 246, 0.95)' }  // Blue
    }
    // ANTE post - Blue (for ante posting step) - include amount
    if (player.lastAction === 'ante') {
      return { text: 'ANTE', color: 'rgba(59, 130, 246, 0.95)', amount: player.currentBet }  // Blue
    }
    return null
  }
}

// Formatters (formatAmount, formatStackWithCommas, truncateName) imported from ./playerFormatters
// Colors (generateAvatarColor, lighten) imported from ./playerColors

/**
 * Clear all action badge animation timers (call when hand changes)
 */
export function clearActionBadgeAnimations(): void {
  actionBadgeAnimStartTimes.clear()
}

/**
 * Clear all win animation timers (call when hand changes)
 */
export function clearWinAnimations(): void {
  winAnimStartTimes.clear()
}

/**
 * Check if any win animations are still running
 */
export function hasActiveWinAnimations(now: number, style: WinAnimationStyle = 'shrink-settle'): boolean {
  const duration = WIN_ANIM_DURATIONS[style]
  for (const startTime of winAnimStartTimes.values()) {
    const elapsed = now - startTime
    if (elapsed < duration) {
      return true
    }
  }
  return false
}

/**
 * Check if a variant is an animated badge variant
 * Also checks new BadgeAnimation type
 */
export function isAnimatedActionBadgeVariant(variant?: ActionBadgeVariant, animation?: BadgeAnimation): boolean {
  // Check new animation type first
  if (animation && animation !== 'none') return true
  // Legacy check for old variant type
  if (!variant) return false
  return ANIMATED_ACTION_BADGE_VARIANTS.includes(variant)
}

/**
 * Check if any action badge animations are still running
 */
export function hasActiveActionBadgeAnimations(now: number): boolean {
  for (const startTime of actionBadgeAnimStartTimes.values()) {
    const elapsed = now - startTime
    if (elapsed < ACTION_BADGE_ANIM_DURATION) {
      return true
    }
  }
  return false
}
