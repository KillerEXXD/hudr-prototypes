/**
 * GGPoker-Inspired Card Design System
 *
 * High-quality procedural card rendering with:
 * - Large, bold rank text
 * - Prominent suit symbols
 * - Rounded corners with subtle shadow
 * - Clean white background with gradient
 * - Professional card back design
 */

// =====================
// Types
// =====================

export interface CardDesignConfig {
  // Card dimensions
  width: number
  height: number
  cornerRadius: number

  // Colors
  faceBackground: string
  faceBorder: string
  redSuitColor: string
  blackSuitColor: string

  // Card back
  backPrimaryColor: string
  backSecondaryColor: string
  backPatternColor: string

  // Typography
  rankFontFamily: string
  rankFontWeight: string

  // Effects
  shadowBlur: number
  shadowColor: string
  shadowOffsetY: number
}

// =====================
// Default Design Config (GGPoker-inspired)
// =====================

export const DEFAULT_CARD_DESIGN: CardDesignConfig = {
  // Card dimensions (standard poker card ratio ~2.5:3.5)
  width: 70,
  height: 98,
  cornerRadius: 8,

  // Colors - clean and vibrant
  faceBackground: '#FFFFFF',
  faceBorder: 'rgba(0, 0, 0, 0.1)',
  redSuitColor: '#E31B23',    // Vibrant red (slightly different from GG)
  blackSuitColor: '#1A1A1A',  // Deep black

  // Card back - elegant dark blue
  backPrimaryColor: '#1B365D',
  backSecondaryColor: '#0D1B2A',
  backPatternColor: 'rgba(255, 255, 255, 0.08)',

  // Typography - bold and readable
  rankFontFamily: '"SF Pro Display", "Helvetica Neue", Arial, sans-serif',
  rankFontWeight: '700',

  // Effects - subtle depth
  shadowBlur: 8,
  shadowColor: 'rgba(0, 0, 0, 0.25)',
  shadowOffsetY: 2,
}

// =====================
// Suit Symbols (Unicode)
// =====================

export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

// =====================
// Rank Display
// =====================

export const RANK_DISPLAY: Record<string, string> = {
  'A': 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'T': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
  '?': '?',
}

// =====================
// Helper: Get suit color
// =====================

export function getSuitColor(suit: string, config: CardDesignConfig = DEFAULT_CARD_DESIGN): string {
  return suit === 'hearts' || suit === 'diamonds'
    ? config.redSuitColor
    : config.blackSuitColor
}

// =====================
// Card Face Renderer
// =====================

export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rank: string,
  suit: string,
  config: CardDesignConfig = DEFAULT_CARD_DESIGN,
  highlight: boolean = false
): void {
  const cornerRadius = (config.cornerRadius / config.width) * width
  const suitColor = getSuitColor(suit, config)
  const suitSymbol = SUIT_SYMBOLS[suit] || '?'
  const rankDisplay = RANK_DISPLAY[rank] || rank

  ctx.save()

  // Draw card shadow
  ctx.shadowColor = config.shadowColor
  ctx.shadowBlur = config.shadowBlur
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = config.shadowOffsetY

  // Card background with gradient
  ctx.beginPath()
  roundedRect(ctx, x, y, width, height, cornerRadius)

  const gradient = ctx.createLinearGradient(x, y, x, y + height)
  gradient.addColorStop(0, '#FFFFFF')
  gradient.addColorStop(1, '#F8F8F8')
  ctx.fillStyle = gradient
  ctx.fill()

  // Reset shadow for border
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Card border
  ctx.strokeStyle = highlight ? '#FFD700' : config.faceBorder
  ctx.lineWidth = highlight ? 2 : 1
  ctx.stroke()

  // Highlight glow effect
  if (highlight) {
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // Calculate font sizes relative to card size
  const rankFontSize = Math.round(height * 0.28)
  const suitFontSize = Math.round(height * 0.22)
  const centerSuitFontSize = Math.round(height * 0.38)

  // Padding from edges
  const padX = width * 0.1
  const padY = height * 0.08

  ctx.fillStyle = suitColor
  ctx.textBaseline = 'top'

  // ==================
  // Top-left corner
  // ==================

  // Rank
  ctx.font = `${config.rankFontWeight} ${rankFontSize}px ${config.rankFontFamily}`
  ctx.textAlign = 'left'
  ctx.fillText(rankDisplay, x + padX, y + padY)

  // Suit below rank
  ctx.font = `${suitFontSize}px ${config.rankFontFamily}`
  ctx.fillText(suitSymbol, x + padX, y + padY + rankFontSize * 0.85)

  // ==================
  // Center suit (large)
  // ==================

  ctx.font = `${centerSuitFontSize}px ${config.rankFontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(suitSymbol, x + width / 2, y + height / 2)

  // ==================
  // Bottom-right corner (rotated 180°)
  // ==================

  ctx.save()
  ctx.translate(x + width - padX, y + height - padY)
  ctx.rotate(Math.PI)

  // Rank
  ctx.font = `${config.rankFontWeight} ${rankFontSize}px ${config.rankFontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(rankDisplay, 0, 0)

  // Suit below rank
  ctx.font = `${suitFontSize}px ${config.rankFontFamily}`
  ctx.fillText(suitSymbol, 0, rankFontSize * 0.85)

  ctx.restore()

  ctx.restore()
}

// =====================
// Card Back Renderer
// =====================

export function drawCardBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  config: CardDesignConfig = DEFAULT_CARD_DESIGN
): void {
  const cornerRadius = (config.cornerRadius / config.width) * width

  ctx.save()

  // Draw card shadow
  ctx.shadowColor = config.shadowColor
  ctx.shadowBlur = config.shadowBlur
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = config.shadowOffsetY

  // Outer card shape
  ctx.beginPath()
  roundedRect(ctx, x, y, width, height, cornerRadius)

  // Gradient background
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, config.backPrimaryColor)
  gradient.addColorStop(1, config.backSecondaryColor)
  ctx.fillStyle = gradient
  ctx.fill()

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  // Inner border accent
  const innerPad = width * 0.08
  const innerCorner = cornerRadius * 0.7
  ctx.beginPath()
  roundedRect(
    ctx,
    x + innerPad,
    y + innerPad,
    width - innerPad * 2,
    height - innerPad * 2,
    innerCorner
  )
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Diamond pattern
  drawDiamondPattern(ctx, x, y, width, height, config)

  // Center logo area (subtle circle)
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

  // "H" logo in center (for HUDR branding)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.font = `bold ${logoRadius}px ${config.rankFontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('H', centerX, centerY)

  ctx.restore()
}

// =====================
// Diamond Pattern for Card Back
// =====================

function drawDiamondPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  config: CardDesignConfig
): void {
  const cornerRadius = (config.cornerRadius / config.width) * width
  const padding = width * 0.12

  // Clip to card shape (with padding)
  ctx.save()
  ctx.beginPath()
  roundedRect(
    ctx,
    x + padding,
    y + padding,
    width - padding * 2,
    height - padding * 2,
    cornerRadius * 0.6
  )
  ctx.clip()

  // Draw diamond grid
  const diamondSize = width * 0.15
  const rows = Math.ceil(height / diamondSize) + 2
  const cols = Math.ceil(width / diamondSize) + 2

  ctx.fillStyle = config.backPatternColor

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const offsetX = (row % 2) * (diamondSize / 2)
      const cx = x + col * diamondSize + offsetX
      const cy = y + row * diamondSize * 0.8

      // Draw small diamond
      ctx.beginPath()
      ctx.moveTo(cx, cy - diamondSize * 0.3)
      ctx.lineTo(cx + diamondSize * 0.2, cy)
      ctx.lineTo(cx, cy + diamondSize * 0.3)
      ctx.lineTo(cx - diamondSize * 0.2, cy)
      ctx.closePath()
      ctx.fill()
    }
  }

  ctx.restore()
}

// =====================
// Utility: Rounded Rectangle
// =====================

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// =====================
// Pre-render Card to OffscreenCanvas (for caching)
// =====================

export function prerenderCard(
  rank: string,
  suit: string,
  width: number,
  height: number,
  config: CardDesignConfig = DEFAULT_CARD_DESIGN,
  highlight: boolean = false,
  dpr: number = 1
): HTMLCanvasElement | OffscreenCanvas {
  const scaledWidth = width * dpr
  const scaledHeight = height * dpr

  // Use OffscreenCanvas if available
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(scaledWidth, scaledHeight)
    : document.createElement('canvas')

  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = scaledWidth
    canvas.height = scaledHeight
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (!ctx) return canvas

  ctx.scale(dpr, dpr)
  drawCardFace(ctx, 0, 0, width, height, rank, suit, config, highlight)

  return canvas
}

export function prerenderCardBack(
  width: number,
  height: number,
  config: CardDesignConfig = DEFAULT_CARD_DESIGN,
  dpr: number = 1
): HTMLCanvasElement | OffscreenCanvas {
  const scaledWidth = width * dpr
  const scaledHeight = height * dpr

  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(scaledWidth, scaledHeight)
    : document.createElement('canvas')

  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = scaledWidth
    canvas.height = scaledHeight
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (!ctx) return canvas

  ctx.scale(dpr, dpr)
  drawCardBack(ctx, 0, 0, width, height, config)

  return canvas
}
