/**
 * Card Design Prototypes for HUDR Replayer
 *
 * Multiple elegant card designs with different sizes to choose from.
 * Designs are optimized for clarity and visual appeal on mobile devices.
 *
 * SIZES:
 * - XS: 20×28 (current hole cards)
 * - S:  28×40 (slightly bigger)
 * - M:  36×52 (medium - good balance)
 * - L:  44×64 (large - very visible)
 * - XL: 52×76 (extra large - hero view)
 *
 * COMMUNITY CARD SIZES:
 * - S:  32×48 (current)
 * - M:  40×60 (medium)
 * - L:  48×72 (large)
 * - XL: 56×84 (extra large)
 *
 * DESIGNS:
 * 1. Clean (current) - White background, suit-colored border
 * 2. Classic - Traditional playing card style with gradient
 * 3. GGPoker - Bold vibrant colors, strong contrast
 * 4. Premium - Luxury feel with gold accents and shadows
 * 5. Minimal - Ultra-clean with subtle styling
 */

import type { Card } from '@/types/hand'
import { drawRoundedRect, withContext } from '../utils/drawing'

// =====================
// Size Configurations
// =====================

export const HOLE_CARD_SIZES = {
  XS: { width: 20, height: 28, gap: 8 },   // Current
  S:  { width: 28, height: 40, gap: 6 },   // Slightly bigger
  M:  { width: 36, height: 52, gap: 5 },   // Medium - recommended
  L:  { width: 44, height: 64, gap: 4 },   // Large
  XL: { width: 52, height: 76, gap: 3 },   // Extra large
} as const

export const COMMUNITY_CARD_SIZES = {
  S:  { width: 32, height: 48, gap: 6 },   // Current
  M:  { width: 40, height: 60, gap: 5 },   // Medium
  L:  { width: 48, height: 72, gap: 4 },   // Large - recommended
  XL: { width: 56, height: 84, gap: 3 },   // Extra large
} as const

export type HoleCardSize = keyof typeof HOLE_CARD_SIZES
export type CommunityCardSize = keyof typeof COMMUNITY_CARD_SIZES
export type CardDesign = 'clean' | 'classic' | 'ggpoker' | 'premium' | 'minimal'

// =====================
// Color Palettes
// =====================

const SUIT_SYMBOLS: Record<Card['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

// Design-specific color palettes
const COLOR_PALETTES = {
  clean: {
    hearts: '#E31B23',
    diamonds: '#E31B23',
    clubs: '#1A1A1A',
    spades: '#1A1A1A',
    background: '#FFFFFF',
  },
  classic: {
    hearts: '#CC0000',
    diamonds: '#CC0000',
    clubs: '#000000',
    spades: '#000000',
    background: '#FFFEF5', // Warm cream
  },
  ggpoker: {
    hearts: '#FF1744',    // Vivid red
    diamonds: '#FF1744',
    clubs: '#212121',     // Near black
    spades: '#212121',
    background: '#FFFFFF',
  },
  premium: {
    hearts: '#B91C1C',    // Deep red
    diamonds: '#B91C1C',
    clubs: '#1F2937',     // Charcoal
    spades: '#1F2937',
    background: '#FEFEFE',
  },
  minimal: {
    hearts: '#DC2626',
    diamonds: '#DC2626',
    clubs: '#374151',
    spades: '#374151',
    background: '#FFFFFF',
  },
} as const

// =====================
// Prototype Card Renderer
// =====================

interface CardPrototypeOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  card?: Card
  faceDown?: boolean
  highlight?: boolean
  design: CardDesign
  dpr?: number
}

export function drawCardPrototype(options: CardPrototypeOptions) {
  const { ctx, x, y, width, height, card, faceDown = false, highlight = false, design, dpr: _dpr = 1 } = options

  const cornerRadius = Math.min(width, height) * 0.12

  withContext(ctx, () => {
    // Card shadow - varies by design
    if (design === 'premium') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
    } else if (design === 'ggpoker') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 3
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
    }

    if (faceDown) {
      drawCardBackPrototype(ctx, x, y, width, height, cornerRadius, design)
    } else {
      drawCardFacePrototype(ctx, x, y, width, height, card, cornerRadius, highlight, design)
    }
  })
}

// =====================
// Design 1: Clean (Current)
// =====================

function drawCleanCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean
) {
  const palette = COLOR_PALETTES.clean
  const borderColor = card ? palette[card.suit] : '#1A1A1A'

  // White background
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.fillStyle = palette.background
  ctx.fill()

  // Suit-colored border
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.strokeStyle = highlight ? '#FFD700' : borderColor
  ctx.lineWidth = highlight ? 3 : 2
  ctx.stroke()

  if (highlight) {
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  if (!card) return

  drawCardContent(ctx, x, y, width, height, card, palette[card.suit], 'clean')
}

// =====================
// Design 2: Classic
// =====================

function drawClassicCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean
) {
  const palette = COLOR_PALETTES.classic

  // Cream background with subtle gradient
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  const bgGradient = ctx.createLinearGradient(x, y, x, y + height)
  bgGradient.addColorStop(0, '#FFFEF8')
  bgGradient.addColorStop(0.5, palette.background)
  bgGradient.addColorStop(1, '#F5F4E8')
  ctx.fillStyle = bgGradient
  ctx.fill()

  // Dark border
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.strokeStyle = highlight ? '#FFD700' : '#2C2C2C'
  ctx.lineWidth = highlight ? 3 : 1.5
  ctx.stroke()

  // Inner border line (classic card look)
  const inset = 3
  drawRoundedRect(ctx, x + inset, y + inset, width - inset * 2, height - inset * 2, cornerRadius * 0.7)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  if (!card) return

  drawCardContent(ctx, x, y, width, height, card, palette[card.suit], 'classic')
}

// =====================
// Design 3: GGPoker (Bold)
// =====================

function drawGGPokerCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean
) {
  const palette = COLOR_PALETTES.ggpoker

  // Pure white background
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.fillStyle = palette.background
  ctx.fill()

  // Bold colored border - thicker for punch
  const borderColor = card ? palette[card.suit] : '#212121'
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.strokeStyle = highlight ? '#FFD700' : borderColor
  ctx.lineWidth = highlight ? 4 : 3
  ctx.stroke()

  if (highlight) {
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)'
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  if (!card) return

  drawCardContent(ctx, x, y, width, height, card, palette[card.suit], 'ggpoker')
}

// =====================
// Design 4: Premium (Luxury)
// =====================

function drawPremiumCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean
) {
  const palette = COLOR_PALETTES.premium

  // Subtle gradient background
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  const bgGradient = ctx.createLinearGradient(x, y, x + width, y + height)
  bgGradient.addColorStop(0, '#FFFFFF')
  bgGradient.addColorStop(0.3, '#FEFEFE')
  bgGradient.addColorStop(0.7, '#FAFAFA')
  bgGradient.addColorStop(1, '#F8F8F8')
  ctx.fillStyle = bgGradient
  ctx.fill()

  // Gold accent border
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  const borderGradient = ctx.createLinearGradient(x, y, x + width, y + height)
  if (highlight) {
    borderGradient.addColorStop(0, '#FFD700')
    borderGradient.addColorStop(0.5, '#FFA500')
    borderGradient.addColorStop(1, '#FFD700')
  } else {
    borderGradient.addColorStop(0, '#D4AF37')  // Gold
    borderGradient.addColorStop(0.5, '#AA8C2C')
    borderGradient.addColorStop(1, '#D4AF37')
  }
  ctx.strokeStyle = borderGradient
  ctx.lineWidth = highlight ? 3.5 : 2.5
  ctx.stroke()

  // Inner glow
  const innerInset = 4
  drawRoundedRect(ctx, x + innerInset, y + innerInset, width - innerInset * 2, height - innerInset * 2, cornerRadius * 0.6)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (!card) return

  drawCardContent(ctx, x, y, width, height, card, palette[card.suit], 'premium')
}

// =====================
// Design 5: Minimal
// =====================

function drawMinimalCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean
) {
  const palette = COLOR_PALETTES.minimal

  // Pure white background
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.fillStyle = palette.background
  ctx.fill()

  // Subtle gray border
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  ctx.strokeStyle = highlight ? '#FFD700' : '#E5E7EB'
  ctx.lineWidth = highlight ? 2 : 1
  ctx.stroke()

  if (!card) return

  drawCardContent(ctx, x, y, width, height, card, palette[card.suit], 'minimal')
}

// =====================
// Shared Card Content Rendering
// =====================

function drawCardContent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card,
  color: string,
  design: CardDesign
) {
  const symbol = SUIT_SYMBOLS[card.suit]
  const rank = card.rank.toUpperCase()

  // Font sizes - adjust based on design
  let rankScale = 0.22
  let suitScale = 0.18
  let centerScale = 0.50

  if (design === 'ggpoker') {
    rankScale = 0.26   // Bolder
    suitScale = 0.20
    centerScale = 0.55
  } else if (design === 'premium') {
    rankScale = 0.24
    suitScale = 0.19
    centerScale = 0.52
  } else if (design === 'minimal') {
    rankScale = 0.28   // Larger for clarity
    suitScale = 0.22
    centerScale = 0.45  // Smaller center suit
  }

  const rankFontSize = Math.round(height * rankScale)
  const suitFontSize = Math.round(height * suitScale)
  const centerSuitFontSize = Math.round(height * centerScale)

  // Padding
  const padX = width * 0.10
  const padY = height * 0.08

  ctx.fillStyle = color

  // Font family based on design
  const fontFamily = design === 'premium'
    ? '"Playfair Display", Georgia, serif'
    : design === 'classic'
    ? '"Times New Roman", Georgia, serif'
    : '"SF Pro Display", "Helvetica Neue", Arial, sans-serif'

  // Top-left corner - rank
  ctx.font = `700 ${rankFontSize}px ${fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(rank, x + padX, y + padY)

  // Suit below rank
  ctx.font = `${suitFontSize}px ${fontFamily}`
  const suitOffsetX = rank === '10' ? width * 0.02 : 0
  ctx.fillText(symbol, x + padX + suitOffsetX, y + padY + rankFontSize * 0.85)

  // Center suit (large)
  ctx.font = `${centerSuitFontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // For minimal design, show rank in center instead of suit
  if (design === 'minimal') {
    ctx.font = `700 ${centerSuitFontSize}px ${fontFamily}`
    ctx.fillText(rank, x + width / 2, y + height / 2)
  } else {
    ctx.fillText(symbol, x + width / 2, y + height / 2 + height * 0.02)
  }

  // Bottom-right corner (rotated 180°)
  ctx.save()
  ctx.translate(x + width - padX, y + height - padY)
  ctx.rotate(Math.PI)

  ctx.font = `700 ${rankFontSize}px ${fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(rank, 0, 0)

  ctx.font = `${suitFontSize}px ${fontFamily}`
  ctx.fillText(symbol, suitOffsetX, rankFontSize * 0.85)

  ctx.restore()
}

// =====================
// Card Back Designs
// =====================

const CARD_BACK_DESIGNS = {
  clean: {
    primaryColor: '#1B365D',
    secondaryColor: '#0D1B2A',
    patternColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  classic: {
    primaryColor: '#8B0000',  // Dark red
    secondaryColor: '#4A0000',
    patternColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  ggpoker: {
    primaryColor: '#000000',
    secondaryColor: '#1A1A1A',
    patternColor: 'rgba(255, 23, 68, 0.15)',
    borderColor: 'rgba(255, 23, 68, 0.3)',
  },
  premium: {
    primaryColor: '#1F2937',
    secondaryColor: '#111827',
    patternColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  minimal: {
    primaryColor: '#374151',
    secondaryColor: '#1F2937',
    patternColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
}

function drawCardBackPrototype(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  design: CardDesign
) {
  const colors = CARD_BACK_DESIGNS[design]

  // Gradient background
  drawRoundedRect(ctx, x, y, width, height, cornerRadius)
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, colors.primaryColor)
  gradient.addColorStop(1, colors.secondaryColor)
  ctx.fillStyle = gradient
  ctx.fill()

  // Inner border
  const innerPad = width * 0.08
  const innerCorner = cornerRadius * 0.7
  drawRoundedRect(ctx, x + innerPad, y + innerPad, width - innerPad * 2, height - innerPad * 2, innerCorner)
  ctx.strokeStyle = colors.borderColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Diamond pattern
  ctx.save()
  drawRoundedRect(ctx, x + innerPad, y + innerPad, width - innerPad * 2, height - innerPad * 2, innerCorner)
  ctx.clip()

  const diamondSize = width * 0.18
  const rows = Math.ceil(height / diamondSize) + 2
  const cols = Math.ceil(width / diamondSize) + 2

  ctx.fillStyle = colors.patternColor

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

  // Center logo
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

  // "H" logo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.font = `bold ${logoRadius}px "SF Pro Display", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('H', centerX, centerY)
}

// =====================
// Card Face Dispatcher
// =====================

function drawCardFacePrototype(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  card: Card | undefined,
  cornerRadius: number,
  highlight: boolean,
  design: CardDesign
) {
  switch (design) {
    case 'clean':
      drawCleanCard(ctx, x, y, width, height, card, cornerRadius, highlight)
      break
    case 'classic':
      drawClassicCard(ctx, x, y, width, height, card, cornerRadius, highlight)
      break
    case 'ggpoker':
      drawGGPokerCard(ctx, x, y, width, height, card, cornerRadius, highlight)
      break
    case 'premium':
      drawPremiumCard(ctx, x, y, width, height, card, cornerRadius, highlight)
      break
    case 'minimal':
      drawMinimalCard(ctx, x, y, width, height, card, cornerRadius, highlight)
      break
  }
}

// =====================
// Demo/Preview Function
// =====================

/**
 * Draw a comparison grid of all card designs and sizes
 * Useful for visual testing
 */
export function drawCardComparisonGrid(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number
) {
  const designs: CardDesign[] = ['clean', 'classic', 'ggpoker', 'premium', 'minimal']
  const testCards: Card[] = [
    { rank: 'A', suit: 'spades' },
    { rank: 'K', suit: 'hearts' },
    { rank: 'Q', suit: 'diamonds' },
    { rank: 'J', suit: 'clubs' },
  ]

  const sizes = COMMUNITY_CARD_SIZES
  let yOffset = startY

  // Draw labels
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  designs.forEach((design, _designIndex) => {
    let xOffset = startX

    // Design label
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(design.toUpperCase(), xOffset, yOffset)
    yOffset += 25

    // Draw cards in different sizes
    Object.entries(sizes).forEach(([sizeName, size]) => {
      xOffset = startX

      // Size label
      ctx.fillStyle = '#888888'
      ctx.font = '10px Arial'
      ctx.fillText(`${sizeName}: ${size.width}×${size.height}`, xOffset, yOffset)
      yOffset += 15

      // Draw 4 test cards
      testCards.forEach((card, cardIndex) => {
        drawCardPrototype({
          ctx,
          x: xOffset,
          y: yOffset,
          width: size.width,
          height: size.height,
          card,
          design,
          faceDown: false,
          highlight: cardIndex === 0, // Highlight first card
        })
        xOffset += size.width + size.gap
      })

      // Draw face-down card
      drawCardPrototype({
        ctx,
        x: xOffset,
        y: yOffset,
        width: size.width,
        height: size.height,
        faceDown: true,
        design,
      })

      yOffset += size.height + 20
    })

    yOffset += 30 // Gap between designs
  })
}
