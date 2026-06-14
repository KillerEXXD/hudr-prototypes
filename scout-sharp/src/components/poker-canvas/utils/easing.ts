import type { EasingFunction } from '../types/canvas-types'

export const linear: EasingFunction = (t) => t

export const easeInOutQuad: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3)

export const easeOutBack: EasingFunction = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export const easeOutExpo: EasingFunction = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export const easing = {
  linear,
  easeInOutQuad,
  easeOutCubic,
  easeOutBack,
  easeOutExpo,
}
