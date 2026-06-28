import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * A condensed, tap-to-edit summary of the active pill filters. It stays hidden while
 * the real filter row is on screen, then slides in pinned UNDER the app header once
 * the filters scroll out of view — so on a long list you always know what you're
 * looking at (e.g. "Live · 7 · All"). Tapping it smooth-scrolls back to the filters.
 *
 * Shared by every pills-filter page (Live, Games, Club detail) so the behaviour and
 * look are identical everywhere. Render the summary content (the active pills, as
 * non-interactive {@link SummaryPill}s) as children.
 *
 * Implementation notes:
 *  - `sticky` (not `fixed`): the page root has an `animate-fade-up` transform, which
 *    is a containing block that would break `position: fixed`. Sticky needs no portal.
 *  - Zero-height sticky wrapper + an absolutely-positioned bar → it never occupies
 *    flow space, so there's no layout shift and no duplicate bar at the top.
 *  - It pins at the live header height (measured), so it sits just below the header.
 */
export function StickyFilterSummary({ show, onEdit, children }: { show: boolean; onEdit: () => void; children: ReactNode }) {
  const [headerH, setHeaderH] = useState(56)
  useEffect(() => {
    const measure = () => setHeaderH(document.querySelector('header')?.offsetHeight ?? 56)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div className="sticky z-20 h-0" style={{ top: headerH }} aria-hidden={!show}>
      <button
        type="button"
        onClick={onEdit}
        tabIndex={show ? 0 : -1}
        aria-label="Active filters — tap to change"
        className={cn(
          'absolute inset-x-0 top-0 flex w-full items-center gap-2 border-b border-border bg-bg-secondary/95 px-4 py-2 text-left backdrop-blur transition-all duration-200 cursor-pointer',
          show ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">{children}</span>
        <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
      </button>
    </div>
  )
}

/**
 * A non-interactive mirror of an active filter pill for use inside
 * {@link StickyFilterSummary}. `tone` is the same active class string the live pill
 * uses, so the summary reads as the exact same control.
 */
export function SummaryPill({ icon, label, tone }: { icon?: ReactNode; label: string; tone: string }) {
  return (
    <span className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold', tone)}>
      {icon}
      {label}
    </span>
  )
}

/**
 * Drives {@link StickyFilterSummary}: returns a `sentinelRef` to place right AFTER the
 * real filter row, and `stuck` — true once that row has scrolled above the header.
 * The header height is folded into the observer's rootMargin so "stuck" flips exactly
 * when the filters disappear under the header.
 */
export function useFilterSticky() {
  const [stuck, setStuck] = useState(false)
  const ioRef = useRef<IntersectionObserver | null>(null)
  // Callback ref so the observer (re)attaches whenever the sentinel mounts — including
  // when it appears later (e.g. switching to the Games tab on the club page), which a
  // plain `useEffect(..., [])` would miss.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    ioRef.current?.disconnect()
    if (!node) {
      setStuck(false) // sentinel gone (e.g. tab switched away) → reset
      return
    }
    // No-op where IntersectionObserver is unavailable (jsdom tests, SSR, ancient
    // browsers) — the summary simply never shows, which is a safe default.
    if (typeof IntersectionObserver === 'undefined') return
    const headerH = document.querySelector('header')?.offsetHeight ?? 56
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      // shrink the viewport top by the header height so the sentinel counts as "gone"
      // the moment it slides under the sticky header (not when it hits y=0).
      rootMargin: `-${headerH}px 0px 0px 0px`,
      threshold: 0,
    })
    io.observe(node)
    ioRef.current = io
  }, [])
  useEffect(() => () => ioRef.current?.disconnect(), [])
  return { sentinelRef, stuck }
}

/** Smooth-scroll helper for the summary's onEdit (scrolls the window back to the top). */
export function scrollToFilters() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
