import type { LayerRenderContext } from '../types/canvas-types'

export abstract class BaseLayer {
  constructor(public zIndex: number = 0) {}

  abstract render(context: LayerRenderContext): void
}
