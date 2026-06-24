import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Progressive ("lazy") rendering for an already-loaded list: renders `batch`
 * items, then reveals `batch` more each time a bottom sentinel scrolls into view.
 * Data isn't paginated server-side (the feed loads everything) — this just keeps
 * the initial DOM small and grows it as the user scrolls.
 *
 * `resetKey` — when it changes (e.g. a filter toggles), the count resets to one
 * batch so a switch doesn't keep a stale large window.
 */
export function InfiniteList<T>({
  items, renderItem, batch = 8, resetKey, className,
}: {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  batch?: number
  resetKey?: unknown
  className?: string
}) {
  const [count, setCount] = useState(batch)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setCount(batch) }, [resetKey, batch])

  useEffect(() => {
    if (count >= items.length) return
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) setCount((c) => Math.min(c + batch, items.length)) },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [count, items.length, batch])

  return (
    <div className={className}>
      {items.slice(0, count).map(renderItem)}
      {count < items.length && <div ref={sentinelRef} className="h-1 w-full" aria-hidden />}
    </div>
  )
}
