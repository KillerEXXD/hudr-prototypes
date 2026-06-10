import { easing } from '../utils/easing'
import { captureReplayerError } from '@/lib/sentry/replayerErrors'
import type { AnimationConfig, AnimationDriver } from '../types/canvas-types'

interface InternalAnimation extends AnimationConfig {
  key: string
  startTime: number | null
}

export class AnimationEngine implements AnimationDriver {
  private animations = new Map<string, InternalAnimation>()
  private values = new Map<string, number>()
  private maxValues = 256

  animate(key: string, config: AnimationConfig): string {
    const id = config.id ?? `${key}-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`
    this.animations.set(id, {
      key,
      startTime: null,
      ...config,
    })
    this.setValue(key, config.from)
    return id
  }

  update(now: number) {
    if (!this.animations.size) return
    const finished: string[] = []

    this.animations.forEach((animation, id) => {
      if (animation.startTime === null) {
        animation.startTime = now
      }

      const progress = Math.min(1, (now - animation.startTime) / animation.duration)
      const easingFn = animation.easing ?? easing.linear
      const value = animation.from + (animation.to - animation.from) * easingFn(progress)
      this.setValue(animation.key, value)

      if (progress >= 1) {
        finished.push(id)
        try {
          animation.onComplete?.()
        } catch (err) {
          captureReplayerError(err, {
            source: 'animation',
            details: {
              animationKey: animation.key,
              animationId: id,
              duration: animation.duration,
            },
          }, 'error')
        }
      }
    })

    finished.forEach((id) => this.animations.delete(id))
  }

  clear() {
    this.animations.clear()
    this.values.clear()
  }

  hasActiveAnimations() {
    return this.animations.size > 0
  }

  getValue(key: string, fallback = 0) {
    if (!this.values.has(key)) {
      return fallback
    }
    const value = this.values.get(key)
    if (value === undefined) return fallback
    // Refresh recency to keep hot keys in the cache
    this.values.delete(key)
    this.values.set(key, value)
    return value
  }

  private setValue(key: string, value: number) {
    if (!Number.isFinite(value)) return
    if (this.values.has(key)) {
      this.values.delete(key)
    }
    this.values.set(key, value)
    if (this.values.size > this.maxValues) {
      const oldestKey = this.values.keys().next().value
      if (oldestKey !== undefined) {
        this.values.delete(oldestKey)
      }
    }
  }
}
