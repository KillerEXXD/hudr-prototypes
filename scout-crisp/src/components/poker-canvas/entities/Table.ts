import type { ReplayerTheme } from '../types/canvas-types'
import type { LayoutMode } from '../utils/coordinates'
import { withContext } from '../utils/drawing'

interface TableOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  theme: ReplayerTheme
  feltImage?: HTMLImageElement
  tableImage?: HTMLImageElement
  layoutMode?: LayoutMode
}

// =====================
// Landscape Mode Configuration (Default)
// =====================

// Perspective configuration - tuned to a fuller, smoother pill similar to the reference table
const LANDSCAPE_PERSPECTIVE = {
  topWidthRatio: 0.9,    // Top (far end) width as a ratio of bottom
  tableWidthRatio: 0.94, // Overall table width as ratio of canvas width
  tableHeightRatio: 0.94, // Table height as ratio of canvas height (fill more space)
  verticalOffset: 0,     // Keep centered vertically
}

// =====================
// Portrait Mode Configuration (Mobile-First)
// =====================

// Portrait perspective - vertical oval optimized for mobile
// Table is shifted down to give more room at top for player cards
const PORTRAIT_PERSPECTIVE = {
  topWidthRatio: 0.82,   // More taper at top for depth effect
  tableWidthRatio: 0.92, // Slightly narrower to fit portrait width
  tableHeightRatio: 0.88, // Increased from 0.80 for taller table
  verticalOffset: -0.02, // Shifted down slightly to give room at top for cards
}

// Border perspective thickness: far end thinner, near end thicker
const BORDER_PERSPECTIVE = {
  top: 0.55,
  bottom: 1.1,
}

export class TableEntity {
  draw({ ctx, width, height, theme, feltImage, tableImage, layoutMode = 'landscape' }: TableOptions) {
    // Guard against invalid dimensions
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return
    }

    // Select perspective based on layout mode
    const PERSPECTIVE = layoutMode === 'portrait' ? PORTRAIT_PERSPECTIVE : LANDSCAPE_PERSPECTIVE

    const centerX = width / 2
    const centerY = height / 2 - height * PERSPECTIVE.verticalOffset

    // For portrait mode, we swap the concept of width/height for the table shape
    // The table is taller than wide in portrait mode
    let tableWidthBottom: number
    let tableWidthTop: number
    let tableHeight: number

    if (layoutMode === 'portrait') {
      // Portrait: table fills height, constrained by width
      // Base the table height on the actual canvas height
      tableHeight = height * PERSPECTIVE.tableHeightRatio
      // Width is constrained - use width ratio relative to height for vertical oval
      tableWidthBottom = width * PERSPECTIVE.tableWidthRatio
      tableWidthTop = tableWidthBottom * PERSPECTIVE.topWidthRatio
    } else {
      // Landscape: standard horizontal oval
      tableWidthBottom = width * PERSPECTIVE.tableWidthRatio
      tableWidthTop = tableWidthBottom * PERSPECTIVE.topWidthRatio
      tableHeight = height * PERSPECTIVE.tableHeightRatio
    }

    withContext(ctx, () => {
      // Background
      ctx.fillStyle = theme.backgroundColor
      ctx.fillRect(0, 0, width, height)

      // If a full-table image is provided, draw it and exit
      if (tableImage && tableImage.complete) {
        const imgRatio = tableImage.width / tableImage.height
        const canvasRatio = width / height
        const scale = Math.min(1, Math.max(0.6, theme.tableImageScale ?? 1))
        let drawWidth = width * scale
        let drawHeight = height * scale
        if (imgRatio > canvasRatio) {
          drawHeight = height * scale
          drawWidth = drawHeight * imgRatio
        } else {
          drawWidth = width * scale
          drawHeight = drawWidth / imgRatio
        }
        const drawX = centerX - drawWidth / 2
        const drawY = centerY - drawHeight / 2
        const opacity = Math.min(1, Math.max(0, theme.tableImageOpacity ?? 1))
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.drawImage(tableImage, drawX, drawY, drawWidth, drawHeight)
        ctx.restore()
        return
      }

      // Outer shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 42
    ctx.shadowOffsetY = 12

      // Border (wood rail)
      this.drawTableBorder(ctx, centerX, centerY, tableWidthBottom, tableWidthTop, tableHeight, theme)

      // Reset shadow for felt
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Felt surface
      this.drawFelt(ctx, centerX, centerY, tableWidthBottom, tableWidthTop, tableHeight, theme, feltImage)

      // Inner rail highlight
      this.drawInnerRail(ctx, centerX, centerY, tableWidthBottom, tableWidthTop, tableHeight, theme)

      // Inner play area (darker inner oval where community cards go)
      this.drawPlayArea(ctx, centerX, centerY, tableWidthBottom, tableWidthTop, tableHeight, theme)
    })
  }

  /**
   * Draw a perspective pill shape - semicircular ends connected by tapered sides
   * Top end (far) is narrower, bottom end (near) is wider
   */
  private drawPerspectiveOval(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    widthBottom: number,
    widthTop: number,
    height: number
  ) {
    const halfWidthBottom = widthBottom / 2
    const halfWidthTop = widthTop / 2
    const topRadius = halfWidthTop
    const bottomRadius = halfWidthBottom

    const straightHeight = height - topRadius - bottomRadius
    const topY = centerY - straightHeight / 2 - topRadius
    const bottomY = centerY + straightHeight / 2 + bottomRadius
    const topCenterY = topY + topRadius
    const bottomCenterY = bottomY - bottomRadius
    const taper = halfWidthBottom - halfWidthTop

    ctx.beginPath()

    // Top cap (rounded, no notch)
    ctx.moveTo(centerX, topY)
    ctx.bezierCurveTo(
      centerX + halfWidthTop * 0.95, topY,
      centerX + halfWidthTop * 1.05, topY + topRadius * 0.6,
      centerX + halfWidthTop, topCenterY
    )

    // Right side (smooth flare)
    ctx.bezierCurveTo(
      centerX + halfWidthTop + taper * 0.46,
      topCenterY + straightHeight * 0.28,
      centerX + halfWidthBottom,
      bottomCenterY - straightHeight * 0.16,
      centerX + halfWidthBottom,
      bottomCenterY
    )

    // Bottom cap
    ctx.bezierCurveTo(
      centerX + halfWidthBottom, bottomCenterY + bottomRadius * 0.44,
      centerX + halfWidthBottom * 0.7, bottomY,
      centerX, bottomY
    )
    ctx.bezierCurveTo(
      centerX - halfWidthBottom * 0.7, bottomY,
      centerX - halfWidthBottom, bottomCenterY + bottomRadius * 0.44,
      centerX - halfWidthBottom, bottomCenterY
    )

    // Left side (mirror)
    ctx.bezierCurveTo(
      centerX - halfWidthTop - taper * 0.46,
      topCenterY + straightHeight * 0.28,
      centerX - halfWidthTop,
      topCenterY + topRadius * 0.6,
      centerX - halfWidthTop,
      topCenterY
    )

    ctx.bezierCurveTo(
      centerX - halfWidthTop, topY + topRadius * 0.6,
      centerX - halfWidthTop * 0.95, topY,
      centerX, topY
    )

    ctx.closePath()
  }

  private drawTableBorder(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    widthBottom: number,
    widthTop: number,
    tableHeight: number,
    theme: ReplayerTheme
  ) {
    const borderWidth = theme.borderWidth
    const topBorder = borderWidth * BORDER_PERSPECTIVE.top
    const bottomBorder = borderWidth * BORDER_PERSPECTIVE.bottom

    const outerWidthBottom = widthBottom + bottomBorder * 2
    const outerWidthTop = widthTop + topBorder * 2
    const outerHeight = tableHeight + topBorder + bottomBorder

    // Under-table shadow for depth
    const shadowRadius = Math.max(outerWidthBottom, outerHeight) * 0.56
    const shadowGradient = ctx.createRadialGradient(centerX, centerY + outerHeight * 0.08, 0, centerX, centerY + outerHeight * 0.08, shadowRadius)
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0.6)')
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = shadowGradient
    ctx.fillRect(centerX - shadowRadius, centerY - shadowRadius, shadowRadius * 2, shadowRadius * 2)
    ctx.restore()

    // Outer border with gradient (wood grain effect)
    this.drawPerspectiveOval(ctx, centerX, centerY, outerWidthBottom, outerWidthTop, outerHeight)

    const borderGradient = ctx.createLinearGradient(
      centerX,
      centerY - outerHeight / 2,
      centerX,
      centerY + outerHeight / 2
    )
    borderGradient.addColorStop(0, theme.borderColorInner)
    borderGradient.addColorStop(0.3, theme.borderColor)
    borderGradient.addColorStop(0.7, darken(theme.borderColor, 0.1))
    borderGradient.addColorStop(1, darken(theme.borderColor, 0.25))

    ctx.fillStyle = borderGradient
    ctx.fill()

    // Golden accent line on outer edge
    this.drawPerspectiveOval(ctx, centerX, centerY, outerWidthBottom + 3, outerWidthTop + 3, outerHeight + 3)
    ctx.strokeStyle = theme.borderGlow
    ctx.lineWidth = 2
    ctx.stroke()
  }

  private drawFelt(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    widthBottom: number,
    widthTop: number,
    tableHeight: number,
    theme: ReplayerTheme,
    feltImage?: HTMLImageElement
  ) {
    const maxWidth = Math.max(widthBottom, widthTop)

    // Clip to felt area
    ctx.save()
    this.drawPerspectiveOval(ctx, centerX, centerY, widthBottom, widthTop, tableHeight)
    ctx.clip()

    // Base layer: photo felt if provided, otherwise gradient
    const bounds = {
      x: centerX - maxWidth / 2,
      y: centerY - tableHeight,
      width: maxWidth,
      height: tableHeight * 2,
    }

    if (feltImage && feltImage.complete) {
      const imgRatio = feltImage.width / feltImage.height
      const areaRatio = bounds.width / bounds.height
      let drawWidth = bounds.width
      let drawHeight = bounds.height
      if (imgRatio > areaRatio) {
        drawHeight = bounds.height
        drawWidth = drawHeight * imgRatio
      } else {
        drawWidth = bounds.width
        drawHeight = drawWidth / imgRatio
      }
      const drawX = bounds.x + (bounds.width - drawWidth) / 2
      const drawY = bounds.y + (bounds.height - drawHeight) / 2
      const opacity = Math.min(1, Math.max(0, theme.feltImageOpacity ?? 0.9))
      ctx.globalAlpha = opacity
      ctx.drawImage(feltImage, drawX, drawY, drawWidth, drawHeight)
      ctx.globalAlpha = 1
    } else {
      // Gradient fallback
      const feltGradient = ctx.createRadialGradient(
        centerX,
        centerY - tableHeight * 0.1,
        0,
        centerX,
        centerY,
        Math.max(maxWidth, tableHeight) * 0.55
      )
      feltGradient.addColorStop(0, theme.feltColor)
      feltGradient.addColorStop(0.7, theme.feltColor)
      feltGradient.addColorStop(1, theme.feltColorDark)

      ctx.fillStyle = feltGradient
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    }

    // Felt texture (subtle cloth weave) - layer above photo for realism
    if (theme.feltTexture) {
      this.drawFeltTexture(ctx, centerX, centerY, maxWidth, tableHeight)
    }

    // Subtle inner vignette
    const vignetteGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      maxWidth * 0.15,
      centerX,
      centerY,
      Math.max(maxWidth, tableHeight) * 0.5
    )
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)')
    vignetteGradient.addColorStop(0.6, 'rgba(0,0,0,0)')
    vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.12)')
    ctx.fillStyle = vignetteGradient
    ctx.fillRect(
      centerX - maxWidth / 2,
      centerY - tableHeight,
      maxWidth,
      tableHeight * 2
    )

    ctx.restore()
  }

  private drawFeltTexture(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    tableWidth: number,
    tableHeight: number
  ) {
    // Guard against invalid dimensions
    if (tableWidth <= 0 || tableHeight <= 0) return

    ctx.save()
    ctx.globalAlpha = 0.025

    // Horizontal weave lines - use larger spacing for bigger tables
    // Ensure spacing is always positive and reasonable
    const spacing = Math.max(4, Math.ceil(Math.max(tableWidth, tableHeight) / 150))
    if (!Number.isFinite(spacing) || spacing <= 0) {
      ctx.restore()
      return
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    const startY = centerY - tableHeight / 2
    const endY = centerY + tableHeight / 2
    const startX = centerX - tableWidth / 2
    const endX = centerX + tableWidth / 2

    for (let y = startY; y < endY; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }

    // Vertical weave lines
    ctx.globalAlpha = 0.015
    for (let x = startX; x < endX; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawInnerRail(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    widthBottom: number,
    widthTop: number,
    tableHeight: number,
    theme: ReplayerTheme
  ) {
    // Inner golden highlight ring
    this.drawPerspectiveOval(ctx, centerX, centerY, widthBottom - 4, widthTop - 4, tableHeight - 4)
    ctx.strokeStyle = theme.borderGlow
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Subtle inner shadow
    this.drawPerspectiveOval(ctx, centerX, centerY, widthBottom - 2, widthTop - 2, tableHeight - 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  private drawPlayArea(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    widthBottom: number,
    widthTop: number,
    tableHeight: number,
    _theme: ReplayerTheme
  ) {
    // Inner play ring - thin outline instead of a dark patch
    const playAreaWidthBottom = widthBottom * 0.64
    const playAreaWidthTop = widthTop * 0.64
    const playAreaHeight = tableHeight * 0.6

    this.drawPerspectiveOval(ctx, centerX, centerY, playAreaWidthBottom, playAreaWidthTop, playAreaHeight)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1.1
    ctx.stroke()
  }
}

function darken(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  const num = parseInt(normalized, 16)
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}
