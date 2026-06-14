import { useEffect, useRef } from 'react'

interface LoopOptions {
  enabled?: boolean
}

export function useAnimationLoop(callback: (timestamp: number, delta: number) => void, options: LoopOptions = {}) {
  const { enabled = true } = options
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated without triggering effect
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      return
    }

    const loop = (time: number) => {
      const last = lastTimeRef.current ?? time
      const delta = time - last
      lastTimeRef.current = time
      callbackRef.current(time, delta)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      lastTimeRef.current = null
    }
  }, [enabled])
}
