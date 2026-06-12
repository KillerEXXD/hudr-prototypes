/**
 * Card Entity - HUDR Custom Design
 *
 * High-performance card rendering with LRU caching.
 * Features:
 * - Clean white background with suit-colored border
 * - Bold rank text with suit symbol in corner
 * - Large center suit symbol
 * - Rounded corners with subtle shadow
 * - Professional card back with HUDR branding
 * - Device pixel ratio support for crisp rendering
 *
 * EXPERIMENTAL: Image-based card rendering
 * Enable via URL param: ?experiments=imageCards
 * Uses SVG/PNG assets from src/assets/cards/
 * Falls back to canvas rendering when images unavailable
 */

import type { Card } from '@/types/hand'
import type { ReplayerTheme } from '../types/canvas-types'
import { drawRoundedRect, withContext } from '../utils/drawing'

// =====================
// Experimental: Image Card System
// =====================

// Cache for card images: URL -> (Image | 'loading' | 'failed')
const cardImageCache = new Map<string, HTMLImageElement | 'loading' | 'failed'>()

// Map rank to filename format
const RANK_TO_FILENAME: Record<string, string> = {
  'A': 'Ace', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'Jack', 'Q': 'Queen', 'K': 'King',
}

// Map suit to filename format
const SUIT_TO_FILENAME: Record<string, string> = {
  'hearts': 'Hearts', 'diamonds': 'Diamonds',
  'clubs': 'Clubs', 'spades': 'Spades',
}

// Available image sizes (sorted smallest to largest)
const IMAGE_SIZES = [
  { w: 35, h: 49, suffix: '35x49px' },
  { w: 50, h: 70, suffix: '50x70px' },
  { w: 70, h: 98, suffix: '70x98px' },
  { w: 100, h: 140, suffix: '100x140px' },
]

/**
 * Get best matching image size suffix for requested dimensions
 */
function getBestSizeSuffix(width: number, height: number): string {
  for (const size of IMAGE_SIZES) {
    if (size.w >= width && size.h >= height) return size.suffix
  }
  return IMAGE_SIZES[IMAGE_SIZES.length - 1].suffix
}

/**
 * Build card image URL from card data
 * Format: /cards/{Rank}_{Suit}_{size}.svg
 *
 * NOTE: Files must be in public/cards/ folder for production builds.
 * Vite serves public/ folder contents at the root path.
 */
function buildCardImageUrl(card: Card, width: number, height: number): string {
  const rankName = RANK_TO_FILENAME[card.rank.toUpperCase()] || card.rank
  const suitName = SUIT_TO_FILENAME[card.suit] || card.suit
  const suffix = getBestSizeSuffix(width, height)
  return `/cards/${rankName}_${suitName}_${suffix}.svg`
}

/**
 * Try to get a loaded card image, initiating load if needed
 * Returns the image if loaded, null if loading or failed
 */
function tryGetCardImage(url: string): HTMLImageElement | null {
  const cached = cardImageCache.get(url)
  if (cached instanceof HTMLImageElement) return cached
  if (cached === 'loading' || cached === 'failed') return null

  // Start loading
  cardImageCache.set(url, 'loading')
  const img = new Image()
  img.onload = () => cardImageCache.set(url, img)
  img.onerror = () => cardImageCache.set(url, 'failed')
  img.src = url
  return null
}

// =====================
// Constants
// =====================

const SUIT_SYMBOLS: Record<Card['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

// GGPoker-inspired vibrant colors
const SUIT_COLORS: Record<Card['suit'], string> = {
  hearts: '#E31B23',    // Vibrant red
  diamonds: '#E31B23',  // Vibrant red
  clubs: '#1A1A1A',     // Deep black
  spades: '#1A1A1A',    // Deep black
}

// Card back design colors
const CARD_BACK = {
  primaryColor: '#1B365D',
  secondaryColor: '#0D1B2A',
  patternColor: 'rgba(255, 255, 255, 0.08)',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  logoColor: 'rgba(255, 255, 255, 0.2)',
}

// =====================
// Types
// =====================

interface CardRenderOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  card?: Card
  faceDown?: boolean
  highlight?: boolean
  theme: ReplayerTheme
  rotation?: number
  dpr?: number
  /** EXPERIMENTAL: Use image-based cards from src/assets/cards/ */
  useImageCards?: boolean
}

type CanvasBuffer = HTMLCanvasElement | OffscreenCanvas

// =====================
// Card Entity Class
// =====================

export class CardEntity {
  private cache = new Map<string, CanvasBuffer>()
  private maxCacheEntries = 120

  draw(options: CardRenderOptions) {
    const {
      ctx,
      x,
      y,
      width,
      height,
      card,
      faceDown = false,
      highlight = false,
      theme,
      rotation = 0,
      dpr = 1,
      useImageCards = false,
    } = options

    const cornerRadius = Math.min(width, height) * 0.12
    const devicePixelRatio = Math.max(1, Math.min(4, Number.isFinite(dpr) && dpr > 0 ? dpr : 1))

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return
    }

    // EXPERIMENTAL: Try image-based rendering first
    if (useImageCards && card && !faceDown) {
      const imageUrl = buildCardImageUrl(card, width, height)
      const img = tryGetCardImage(imageUrl)

      if (img) {
        withContext(ctx, () => {
          if (rotation !== 0) {
            ctx.translate(x + width / 2, y + height / 2)
            ctx.rotate(rotation)
            ctx.translate(-(x + width / 2), -(y + height / 2))
          }

          // Card shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2

          // Draw the image card
          ctx.drawImage(img, x, y, width, height)

          // Add highlight glow if needed
          if (highlight) {
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
            ctx.shadowBlur = 10
            drawRoundedRect(ctx, x, y, width, height, cornerRadius)
            ctx.strokeStyle = '#FFD700'
            ctx.lineWidth = 3
            ctx.stroke()
          }
        })
        return // Successfully drew from image
      }
      // Image not loaded yet, fall through to canvas rendering
    }

    // Canvas-based rendering (default or fallback)
    const cached = this.getCachedCard(width, height, card, faceDown, highlight, theme, cornerRadius, devicePixelRatio)

    withContext(ctx, () => {
      if (rotation !== 0) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(rotation)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }

      // Card shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2

      if (cached) {
        ctx.drawImage(cached as CanvasImageSource, x, y, width, height)
      } else {
        this.paintCard(ctx, x, y, width, height, card, faceDown, highlight, theme, cornerRadius, true)
      }
    })
  }

  private paintCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    card: Card | undefined,
    faceDown: boolean,
    highlight: boolean,
    _theme: ReplayerTheme,
    cornerRadius: number,
    _drawBase = true
  ) {
    withContext(ctx, () => {
      if (faceDown) {
        this.drawCardBack(ctx, x, y, width, height, cornerRadius)
      } else {
        this.drawCardFace(ctx, x, y, width, height, card, cornerRadius, highlight, _theme)
      }
    })
  }

  // =====================
  // Card Face Rendering (HUDR Custom Design)
  // =====================

  private drawCardFace(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    card: Card | undefined,
    cornerRadius: number,
    highlight: boolean,
    _theme: ReplayerTheme
  ) {
    // Get suit color for border (default to black if no card)
    const borderColor = card ? SUIT_COLORS[card.suit] : '#1A1A1A'

    // Card background - pure white
    drawRoundedRect(ctx, x, y, width, height, cornerRadius)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // Card border - matches suit color (red for hearts/diamonds, black for spades/clubs)
    drawRoundedRect(ctx, x, y, width, height, cornerRadius)
    ctx.strokeStyle = highlight ? '#FFD700' : borderColor
    ctx.lineWidth = highlight ? 3 : 2
    ctx.stroke()

    // Highlight glow
    if (highlight) {
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }

    if (!card) return

    const color = SUIT_COLORS[card.suit]
    const symbol = SUIT_SYMBOLS[card.suit]
    // Rank is already '10' in the type definition, just uppercase for display
    const rank = card.rank.toUpperCase()

    // Font sizes - tuned to match sample design
    const rankFontSize = Math.round(height * 0.22)
    const suitFontSize = Math.round(height * 0.18)
    const centerSuitFontSize = Math.round(height * 0.50)

    // Padding - tighter to match sample
    const padX = width * 0.10
    const padY = height * 0.08

    ctx.fillStyle = color

    // ==================
    // Top-left corner
    // ==================
    ctx.font = `700 ${rankFontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(rank, x + padX, y + padY)

    // Suit below rank - closer spacing
    ctx.font = `${suitFontSize}px "SF Pro Display", Arial, sans-serif`
    const suitOffsetX = rank === '10' ? width * 0.02 : 0
    ctx.fillText(symbol, x + padX + suitOffsetX, y + padY + rankFontSize * 0.85)

    // ==================
    // Center suit (large)
    // ==================
    ctx.font = `${centerSuitFontSize}px "SF Pro Display", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(symbol, x + width / 2, y + height / 2 + height * 0.02)

    // ==================
    // Bottom-right corner (rotated 180°)
    // ==================
    ctx.save()
    ctx.translate(x + width - padX, y + height - padY)
    ctx.rotate(Math.PI)

    ctx.font = `700 ${rankFontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(rank, 0, 0)

    ctx.font = `${suitFontSize}px "SF Pro Display", Arial, sans-serif`
    ctx.fillText(symbol, suitOffsetX, rankFontSize * 0.85)

    ctx.restore()
  }

  // =====================
  // Card Back Rendering (HUDR branded)
  // =====================

  private drawCardBack(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius: number
  ) {
    // Outer card shape with gradient
    drawRoundedRect(ctx, x, y, width, height, cornerRadius)
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
    gradient.addColorStop(0, CARD_BACK.primaryColor)
    gradient.addColorStop(1, CARD_BACK.secondaryColor)
    ctx.fillStyle = gradient
    ctx.fill()

    // Inner border
    const innerPad = width * 0.08
    const innerCorner = cornerRadius * 0.7
    drawRoundedRect(
      ctx,
      x + innerPad,
      y + innerPad,
      width - innerPad * 2,
      height - innerPad * 2,
      innerCorner
    )
    ctx.strokeStyle = CARD_BACK.borderColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Diamond pattern
    this.drawDiamondPattern(ctx, x, y, width, height, innerPad, innerCorner)

    // Center logo area
    const centerX = x + width / 2
    const centerY = y + height / 2
    const logoRadius = Math.min(width, height) * 0.2

    ctx.beginPath()
    ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    // "H" logo for HUDR
    ctx.fillStyle = CARD_BACK.logoColor
    ctx.font = `bold ${logoRadius}px "SF Pro Display", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('H', centerX, centerY)
  }

  private drawDiamondPattern(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    cornerRadius: number
  ) {
    ctx.save()

    // Clip to inner area
    drawRoundedRect(
      ctx,
      x + padding,
      y + padding,
      width - padding * 2,
      height - padding * 2,
      cornerRadius
    )
    ctx.clip()

    // Draw diamond grid
    const diamondSize = width * 0.18
    const rows = Math.ceil(height / diamondSize) + 2
    const cols = Math.ceil(width / diamondSize) + 2

    ctx.fillStyle = CARD_BACK.patternColor

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const offsetX = (row % 2) * (diamondSize / 2)
        const cx = x + col * diamondSize + offsetX
        const cy = y + row * diamondSize * 0.8

        ctx.beginPath()
        ctx.moveTo(cx, cy - diamondSize * 0.25)
        ctx.lineTo(cx + diamondSize * 0.18, cy)
        ctx.lineTo(cx, cy + diamondSize * 0.25)
        ctx.lineTo(cx - diamondSize * 0.18, cy)
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.restore()
  }

  // =====================
  // Caching System
  // =====================

  private getCachedCard(
    width: number,
    height: number,
    card: Card | undefined,
    faceDown: boolean,
    highlight: boolean,
    theme: ReplayerTheme,
    cornerRadius: number,
    dpr: number
  ): CanvasBuffer | null {
    const key = this.buildCacheKey(width, height, card, faceDown, highlight, theme, dpr)
    const existing = this.getFromCache(key)
    if (existing) return existing

    const canvas = this.createCanvas(width, height, dpr)
    if (!canvas) return null

    const cacheCtx = canvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!cacheCtx) return null

    cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.paintCard(cacheCtx, 0, 0, width, height, card, faceDown, highlight, theme, cornerRadius)
    this.setCache(key, canvas)

    return canvas
  }

  private createCanvas(width: number, height: number, dpr: number): CanvasBuffer | null {
    const scale = Number.isFinite(dpr) && dpr > 0 ? dpr : 1
    const safeWidth = Math.max(1, Math.round(width * scale))
    const safeHeight = Math.max(1, Math.round(height * scale))

    if (!Number.isFinite(safeWidth) || !Number.isFinite(safeHeight)) return null

    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        return new OffscreenCanvas(safeWidth, safeHeight)
      } catch {
        // Fall through
      }
    }

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas')
      canvas.width = safeWidth
      canvas.height = safeHeight
      return canvas
    }

    return null
  }

  private buildCacheKey(
    width: number,
    height: number,
    card: Card | undefined,
    faceDown: boolean,
    highlight: boolean,
    _theme: ReplayerTheme,
    dpr: number
  ) {
    const rank = faceDown ? 'back' : card?.rank ?? 'unknown'
    const suit = faceDown ? 'none' : card?.suit ?? 'none'
    return [
      Math.round(width),
      Math.round(height),
      rank,
      suit,
      faceDown,
      highlight,
      'v3', // Version tag for HUDR custom design with suit-colored border
      Math.round((Number.isFinite(dpr) && dpr > 0 ? dpr : 1) * 100) / 100,
    ].join('|')
  }

  private getFromCache(key: string): CanvasBuffer | null {
    const existing = this.cache.get(key)
    if (!existing) return null

    // LRU refresh
    this.cache.delete(key)
    this.cache.set(key, existing)
    return existing
  }

  private setCache(key: string, buffer: CanvasBuffer) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    this.cache.set(key, buffer)

    if (this.cache.size > this.maxCacheEntries) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }
  }

  // Clear cache (useful when theme changes)
  clearCache() {
    this.cache.clear()
  }
}
