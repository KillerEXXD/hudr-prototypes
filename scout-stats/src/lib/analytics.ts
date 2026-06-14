import posthog from 'posthog-js'

// =====================================================================
// Prototype analytics — PostHog autocapture + session replay + heatmaps,
// plus a structured feedback event. ONE identical file across all four
// Scout prototypes: the prototype name is derived from the base path
// (/scout-<name>-demo/), and every event is tagged `prototype` + `surface`
// so prototype traffic is filterable from production analytics.
// =====================================================================

const POSTHOG_KEY = 'phc_EmCLj9Ed8rTtytQ6lAfyqtP8JBPiabj7QCLSBk4KrtH'
const POSTHOG_HOST = 'https://us.i.posthog.com'

/** scout-engine / scout-crisp / scout-stats / scout-sharp (from the build base). */
export const PROTOTYPE = import.meta.env.BASE_URL.match(/scout-([a-z]+)-demo/)?.[1] ?? 'scout'

let started = false

export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return
  started = true
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: false, // hash router → captured manually below
    capture_pageleave: true,
    persistence: 'localStorage',
    // Behavioural depth for usability research.
    session_recording: { maskAllInputs: false },
    loaded: (ph) => {
      ph.register({ prototype: PROTOTYPE, surface: 'scout-prototype' })
      capturePage()
    },
  })
  window.addEventListener('hashchange', capturePage)
}

function capturePage(): void {
  posthog.capture('$pageview', { prototype: PROTOTYPE, screen: window.location.hash || '#/' })
}

export interface FeedbackPayload {
  screen: string
  ease: number          // 1–5 (SEQ-style)
  improve?: string
  liked?: string
  email?: string
}

/** Structured feedback event — links to the user's session replay in PostHog. */
export function captureFeedback(data: FeedbackPayload): void {
  posthog.capture('feedback_submitted', { prototype: PROTOTYPE, surface: 'scout-prototype', ...data })
}
