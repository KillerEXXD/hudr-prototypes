import { BaseLayer } from './BaseLayer'
import { TableEntity } from '../entities/Table'
import type { LayerRenderContext } from '../types/canvas-types'
import type { LayoutMode } from '../utils/coordinates'

const table = new TableEntity()

export class TableLayer extends BaseLayer {
  private cacheCanvas: HTMLCanvasElement | null = null
  private cacheCtx: CanvasRenderingContext2D | null = null
  private cacheKey: string | null = null
  private feltImage: HTMLImageElement | null = null
  private feltImageUrl: string | undefined
  private feltImageStatus: 'idle' | 'loading' | 'loaded' | 'error' = 'idle'
  private tableImage: HTMLImageElement | null = null
  private tableImageUrl: string | undefined
  private tableImageStatus: 'idle' | 'loading' | 'loaded' | 'error' = 'idle'
  private invalidate?: () => void
  private layoutMode: LayoutMode = 'landscape'

  constructor(invalidate?: () => void, layoutMode: LayoutMode = 'landscape') {
    super(0)
    this.invalidate = invalidate
    this.layoutMode = layoutMode
  }

  setLayoutMode(mode: LayoutMode) {
    if (this.layoutMode !== mode) {
      this.layoutMode = mode
      this.cacheKey = null // Invalidate cache when layout changes
    }
  }

  render(context: LayerRenderContext) {
    const { ctx, width, height, theme, dpr } = context
    if (width <= 0 || height <= 0) return

    // Handle felt image loading (photo-quality felt)
    const nextFeltUrl = theme.feltImageUrl
    const wantsFeltImage = typeof nextFeltUrl === 'string' && nextFeltUrl.length > 0

    if (wantsFeltImage && nextFeltUrl !== this.feltImageUrl) {
      this.feltImageUrl = nextFeltUrl
      this.feltImageStatus = 'loading'
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        this.feltImage = image
        this.feltImageStatus = 'loaded'
        this.cacheKey = null
        this.invalidate?.()
      }
      image.onerror = () => {
        this.feltImage = null
        this.feltImageStatus = 'error'
        this.cacheKey = null
        this.invalidate?.()
      }
      image.src = nextFeltUrl
    } else if (!wantsFeltImage && this.feltImage) {
      this.feltImage = null
      this.feltImageUrl = undefined
      this.feltImageStatus = 'idle'
      this.cacheKey = null
    }

    // Handle full table image loading (single background)
    const nextTableUrl = theme.tableImageUrl
    const wantsTableImage = typeof nextTableUrl === 'string' && nextTableUrl.length > 0

    if (wantsTableImage && nextTableUrl !== this.tableImageUrl) {
      this.tableImageUrl = nextTableUrl
      this.tableImageStatus = 'loading'
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        this.tableImage = image
        this.tableImageStatus = 'loaded'
        this.cacheKey = null
        this.invalidate?.()
      }
      image.onerror = () => {
        this.tableImage = null
        this.tableImageStatus = 'error'
        this.cacheKey = null
        this.invalidate?.()
      }
      image.src = nextTableUrl
    } else if (!wantsTableImage && this.tableImage) {
      this.tableImage = null
      this.tableImageUrl = undefined
      this.tableImageStatus = 'idle'
      this.cacheKey = null
    }

    const cacheKey = this.buildCacheKey(width, height, dpr, theme)
    const canCache = typeof document !== 'undefined'

    if (canCache) {
      if (!this.cacheCanvas) {
        this.cacheCanvas = document.createElement('canvas')
        this.cacheCtx = this.cacheCanvas.getContext('2d')
      }

      if (this.cacheCanvas && this.cacheCtx && this.cacheKey !== cacheKey) {
        this.cacheCanvas.width = Math.max(1, Math.round(width * dpr))
        this.cacheCanvas.height = Math.max(1, Math.round(height * dpr))
        this.cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
        this.cacheCtx.clearRect(0, 0, width, height)
        table.draw({
          ctx: this.cacheCtx,
          width,
          height,
          theme,
          feltImage: this.feltImage ?? undefined,
          tableImage: this.tableImage ?? undefined,
          layoutMode: this.layoutMode,
        })
        this.cacheKey = cacheKey
      }

      if (this.cacheCanvas && this.cacheCtx && this.cacheKey === cacheKey) {
        ctx.drawImage(this.cacheCanvas, 0, 0, width, height)
        return
      }
    }

    table.draw({
      ctx,
      width,
      height,
      theme,
      feltImage: this.feltImage ?? undefined,
      tableImage: this.tableImage ?? undefined,
      layoutMode: this.layoutMode,
    })
  }

  private buildCacheKey(width: number, height: number, dpr: number, theme: LayerRenderContext['theme']) {
    return [
      width,
      height,
      dpr,
      this.layoutMode,
      theme.feltColor,
      theme.feltColorDark,
      theme.feltTexture,
      theme.feltImageUrl || 'none',
      this.feltImageStatus,
      theme.tableImageUrl || 'none',
      this.tableImageStatus,
      theme.tableImageOpacity ?? 'default',
      theme.feltImageOpacity ?? 'default',
      theme.borderColor,
      theme.borderColorInner,
      theme.borderWidth,
      theme.borderGlow,
      theme.backgroundColor,
    ].join('|')
  }
}
