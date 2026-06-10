import type { ChipDenomination } from '@/types/replay'
import { withContext } from '../utils/drawing'
import type { ReplayerTheme } from '../types/canvas-types'

interface ChipRenderOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  radius: number
  denomination: ChipDenomination
  theme: ReplayerTheme
  dpr?: number
}

type CanvasBuffer = HTMLCanvasElement | OffscreenCanvas

export class ChipEntity {
  private cache = new Map<string, CanvasBuffer>()
  private maxCacheEntries = 80

  draw({ ctx, x, y, radius, denomination, theme, dpr = 1 }: ChipRenderOptions) {
    if (!Number.isFinite(radius) || radius <= 0) return
    const devicePixelRatio = Math.max(1, Math.min(4, Number.isFinite(dpr) && dpr > 0 ? dpr : 1))
    const cached = this.getCachedChip(radius, denomination, theme, devicePixelRatio)

    withContext(ctx, () => {
      ctx.shadowColor = theme.chipShadow
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 3

      if (cached) {
        ctx.drawImage(cached as CanvasImageSource, x - radius, y - radius, radius * 2, radius * 2)
        return
      }

      this.paintChip(ctx, x, y, radius, denomination, theme)
    })
  }

  private paintChip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    denomination: ChipDenomination,
    theme: ReplayerTheme
  ) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    const chipGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius)
    const baseColor = denomination.color
    chipGradient.addColorStop(0, lighten(baseColor, 0.3))
    chipGradient.addColorStop(0.5, baseColor)
    chipGradient.addColorStop(1, darken(baseColor, 0.2))
    ctx.fillStyle = chipGradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = radius * 0.12
    ctx.setLineDash([radius * 0.25, radius * 0.15])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2)
    const innerGradient = ctx.createRadialGradient(
      x - radius * 0.15,
      y - radius * 0.15,
      0,
      x,
      y,
      radius * 0.55
    )
    innerGradient.addColorStop(0, 'rgba(255,255,255,0.15)')
    innerGradient.addColorStop(1, 'rgba(0,0,0,0.1)')
    ctx.fillStyle = innerGradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const fontSize = Math.round(radius * 0.65)
    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`
    ctx.fillStyle = denomination.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    ctx.fillText(formatValue(denomination.value), x, y + 1)
  }

  private getCachedChip(
    radius: number,
    denomination: ChipDenomination,
    theme: ReplayerTheme,
    dpr: number
  ): CanvasBuffer | null {
    const key = this.buildCacheKey(radius, denomination, theme, dpr)
    const existing = this.getFromCache(key)
    if (existing) return existing

    const canvas = this.createCanvas(radius * 2, radius * 2, dpr)
    if (!canvas) return null
    const cacheCtx = canvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!cacheCtx) return null
    cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    this.paintChip(cacheCtx, radius, radius, radius, denomination, theme)
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
        // Ignore OffscreenCanvas failures and fall back
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

  private buildCacheKey(radius: number, denomination: ChipDenomination, theme: ReplayerTheme, dpr: number) {
    const valueKey = Math.round(denomination.value * 100) / 100
    return [
      Math.round(radius * 100) / 100,
      denomination.color,
      denomination.textColor,
      valueKey,
      theme.fontFamily,
      Math.round((Number.isFinite(dpr) && dpr > 0 ? dpr : 1) * 100) / 100,
    ].join('|')
  }

  private getFromCache(key: string): CanvasBuffer | null {
    const existing = this.cache.get(key)
    if (!existing) return null
    // Refresh recency so frequently used sizes stay hot
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
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`
  if (Number.isInteger(value)) return value.toString()
  const fixed = value >= 10 ? value.toFixed(1) : value.toFixed(2)
  return fixed.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')
}

function lighten(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  const num = parseInt(normalized, 16)
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) * (1 + amount)))
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) * (1 + amount)))
  const b = Math.min(255, Math.round((num & 0xff) * (1 + amount)))
  return `rgb(${r}, ${g}, ${b})`
}

function darken(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  const num = parseInt(normalized, 16)
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}
