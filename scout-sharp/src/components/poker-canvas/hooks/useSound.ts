import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SoundManager, type SoundEvent } from '../core/SoundManager'

export function useSound(enabled: boolean, volume: number) {
  const manager = useMemo(() => new SoundManager(), [])
  const [ready, setReady] = useState(false)
  const enabledRef = useRef(enabled)

  // Keep ref updated without triggering re-renders
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    manager.setEnabled(enabled)
    manager.setVolume(volume)
  }, [enabled, volume, manager])

  useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }
    let cancelled = false
    manager
      .init()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, manager])

  useEffect(() => () => manager.dispose(), [manager])

  const play = useCallback((event: SoundEvent) => {
    if (!enabledRef.current) return
    manager.play(event).catch(() => {})
  }, [manager])

  return { play, ready }
}
