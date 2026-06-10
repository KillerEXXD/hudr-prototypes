import type { BaseLayer } from '../layers/BaseLayer'
import { captureReplayerError } from '@/lib/sentry/replayerErrors'
import type { CanvasScene, LayerRenderContext, ReplayerTheme, RendererConfig, SeatPosition, PotAnimationVariant, PotVisualVariant, ActionBadgeVariant, BadgeStyle, BadgeAnimation, WinAnimationStyle, ExperimentalFeatures } from '../types/canvas-types'
import { defaultReplayerTheme } from '../constants/theme'

interface RenderOptions {
  scene: CanvasScene
  seatPositions: SeatPosition[]
  animations: LayerRenderContext['animations']
  theme?: Partial<ReplayerTheme>
  now: number
  delta: number
  /** Override pot counter animation variant (for testing/preview) */
  potAnimationVariant?: PotAnimationVariant
  /** Override pot visual effect variant (for testing/preview) */
  potVisualVariant?: PotVisualVariant
  /** Override action badge variant (for testing/preview) - LEGACY */
  actionBadgeVariant?: ActionBadgeVariant
  /** Override badge style (visual appearance) */
  badgeStyle?: BadgeStyle
  /** Override badge animation (motion effect) */
  badgeAnimation?: BadgeAnimation
  /** Override win animation style (for winner reveal) */
  winAnimationStyle?: WinAnimationStyle
  /** Experimental features enabled via URL params */
  experimentalFeatures?: ExperimentalFeatures
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private layers: BaseLayer[] = []
  private lastSize = { width: 0, height: 0 }
  private dpr: number
  private pixelRatioOverride?: number
  private theme: ReplayerTheme

  constructor(canvas: HTMLCanvasElement, config: RendererConfig) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context unavailable')
    }
    this.ctx = context
    this.pixelRatioOverride = config.pixelRatio
    this.dpr = this.getDevicePixelRatio()
    this.theme = { ...defaultReplayerTheme }
    this.setSize(config.width, config.height)
  }

  setLayers(layers: BaseLayer[]) {
    this.layers = layers.sort((a, b) => a.zIndex - b.zIndex)
  }

  setTheme(theme: Partial<ReplayerTheme>) {
    this.theme = { ...this.theme, ...theme }
  }

  setSize(width: number, height: number) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return
    }

    const nextDpr = this.getDevicePixelRatio()
    const dprChanged = Math.abs(nextDpr - this.dpr) > 0.01
    if (!dprChanged && width === this.lastSize.width && height === this.lastSize.height) {
      return
    }

    this.dpr = nextDpr
    this.lastSize = { width, height }
    this.canvas.width = Math.round(width * this.dpr)
    this.canvas.height = Math.round(height * this.dpr)
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  render(options: RenderOptions) {
    const nextDpr = this.getDevicePixelRatio()
    if (Math.abs(nextDpr - this.dpr) > 0.01) {
      this.setSize(this.lastSize.width, this.lastSize.height)
    }

    const { scene, seatPositions, animations, theme, now, delta, potAnimationVariant, potVisualVariant, actionBadgeVariant, badgeStyle, badgeAnimation, winAnimationStyle, experimentalFeatures } = options
    if (theme) {
      this.setTheme(theme)
    }

    const { width, height } = this.lastSize
    this.ctx.clearRect(0, 0, width, height)

    const renderContext: LayerRenderContext = {
      ctx: this.ctx,
      width,
      height,
      dpr: this.dpr,
      now,
      delta,
      theme: this.theme,
      seatPositions,
      step: scene.step,
      previousStep: scene.previousStep,
      state: scene.step.state,
      animations,
      handId: scene.hand.handId,
      handNumber: scene.hand.handNumber,
      tournamentName: scene.hand.tournamentName,
      potAnimationVariant,
      potVisualVariant,
      actionBadgeVariant,
      badgeStyle,
      badgeAnimation,
      winAnimationStyle,
      experimentalFeatures,
    }

    for (const layer of this.layers) {
      try {
        layer.render(renderContext)
      } catch (err) {
        captureReplayerError(err, {
          source: 'canvas',
          handId: scene.hand.handId,
          details: {
            layerName: layer.constructor.name,
            layerZIndex: layer.zIndex,
            canvasSize: { width, height },
            dpr: this.dpr,
          },
        }, 'error')
      }
    }
  }

  private getDevicePixelRatio() {
    if (this.pixelRatioOverride !== undefined) {
      return this.pixelRatioOverride
    }
    if (typeof window === 'undefined') {
      return 1
    }
    const ratio = window.devicePixelRatio || 1
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1
  }
}
