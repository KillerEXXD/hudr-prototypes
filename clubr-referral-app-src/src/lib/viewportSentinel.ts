import { captureViewportIssue } from './analytics'

// Robustly catch the whole "viewport misbehaves on an activity" bug class — the app
// zooming, expanding/collapsing, or a control getting pushed off-screen/sideways — on
// ANY interaction (chip update, bust, square pick, draft edit, chat, …), on ANY device.
//
// We don't test it scenario-by-scenario. The viewport is LOCKED (maximum-scale=1,
// user-scalable=no), so `visualViewport.scale !== 1` or new horizontal overflow is
// ALWAYS anomalous — we watch for it continuously and attribute it to the last activity.
// Two sinks:
//   • production  → PostHog `viewport_issue` (every real device + a session replay of
//     exactly what the user did, with device/browser tags)
//   • E2E build (VITE_E2E) → console.error on a HARD violation → the existing
//     console-health gate fails the test, so every activity in every journey is covered
//     for free (no per-scenario assertions).

// ---- pure, unit-testable decision helpers ----

/** With the viewport locked, the visual scale must stay 1. Anything else is a zoom bug. */
export function isZoomed(scale: number): boolean {
  return Math.abs(scale - 1) > 0.01
}

/** Horizontal overflow (px): content pushed sideways / the layout got wider than the screen. */
export function overflowPx(scrollWidth: number, clientWidth: number): number {
  return Math.max(0, Math.round(scrollWidth - clientWidth))
}

/** A short, human-readable selector for the element an issue is attributed to. */
export function selectorOf(el: Element | null | undefined): string {
  if (!el || !el.tagName) return ''
  const id = el.id ? `#${el.id}` : ''
  const cls = typeof el.className === 'string' && el.className.trim()
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : ''
  const label = el.getAttribute?.('aria-label') || (el as HTMLElement).innerText?.trim().slice(0, 24) || ''
  return `${el.tagName.toLowerCase()}${id}${cls}${label ? ` [${label}]` : ''}`.slice(0, 80)
}

// ---- runtime wiring ----

interface LayoutShiftEntry extends PerformanceEntry { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] }

const isE2E = !!(import.meta as { env?: { VITE_E2E?: unknown } }).env?.VITE_E2E
const screen = () => location.hash || '#/'

export function initViewportSentinel(): void {
  if (typeof window === 'undefined') return
  let lastActivity = '' // the element of the most recent user interaction (for attribution)
  const seen = new Set<string>() // dedupe: one report per kind+screen per page load (no spam)

  const note = (e: Event) => { lastActivity = selectorOf(e.target as Element) }
  addEventListener('pointerdown', note, { capture: true, passive: true })
  addEventListener('focusin', note, { capture: true, passive: true })

  const report = (kind: 'zoom' | 'overflow' | 'shift', extra: Record<string, unknown>, hard: boolean) => {
    const key = `${kind}:${screen()}`
    if (seen.has(key)) return
    seen.add(key)
    if (isE2E) {
      // CI sink: a hard violation fails the console-health gate; soft (shift) is ignored.
      if (hard) console.error(`[viewport] ${kind} after "${lastActivity}" on ${screen()}: ${JSON.stringify(extra)}`)
      return
    }
    captureViewportIssue({ kind, screen: screen(), activity: lastActivity, ...extra })
  }

  // 1) ZOOM — the highest-signal check; with the lock this should never fire.
  const vv = window.visualViewport
  if (vv) vv.addEventListener('resize', () => { if (isZoomed(vv.scale)) report('zoom', { scale: Math.round(vv.scale * 100) / 100 }, true) })

  // 2) HORIZONTAL OVERFLOW — re-check shortly after each interaction settles.
  const checkOverflow = () => {
    const d = document.documentElement
    const px = overflowPx(d.scrollWidth, d.clientWidth)
    // Telemetry-only for now (hard=false): a pre-existing wide element shouldn't red the
    // nightly. Promote to a CI gate (hard=true) once prod `viewport_issue` data is clean.
    if (px > 2) report('overflow', { overflowPx: px }, false)
  }
  const scheduleOverflow = () => setTimeout(checkOverflow, 350)
  addEventListener('pointerup', scheduleOverflow, { passive: true })
  addEventListener('focusin', scheduleOverflow, { passive: true })

  // 3) LAYOUT SHIFT — "expands/collapses on activity". Telemetry only (noisier, not a CI gate).
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as LayoutShiftEntry[]) {
        if (e.value > 0.25) {
          const node = e.sources?.find((s) => s.node)?.node
          report('shift', { shiftValue: Math.round(e.value * 1000) / 1000, element: selectorOf((node as Element) ?? null) }, false)
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch { /* layout-shift unsupported (older Safari) — zoom + overflow still cover the class */ }
}
