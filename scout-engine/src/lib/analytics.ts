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

// ---- Guided per-prototype review (the ReviewWizard) ----

export interface ReviewSectionAnswer {
  score: number
  liked?: string
  disliked?: string
  likedTags?: string[]      // tapped quick-pick suggestions
  dislikedTags?: string[]
}

export interface ReviewPayload {
  sections: Record<string, ReviewSectionAnswer>
  would_use: number              // 1–5
  would_pay: 'no' | 'maybe' | 'yes'
  would_pay_amount?: string
  nps: number                    // 0–10
  overall_note?: string
  name: string                   // required
  email: string                  // required
}

/**
 * Flattens the guided review into a single `prototype_review_submitted` event:
 * `score_<key>` / `liked_<key>` / `disliked_<key>` / `likedtags_<key>` /
 * `dislikedtags_<key>` per feature section, plus the overall fields + name/email —
 * so PostHog can average per-feature scores and count tags, broken down by prototype.
 */
export function captureReview(p: ReviewPayload): void {
  const flat: Record<string, unknown> = {
    prototype: PROTOTYPE,
    surface: 'scout-prototype',
    completed: true,
    sections_count: Object.keys(p.sections).length,
    would_use: p.would_use,
    would_pay: p.would_pay,
    would_pay_amount: p.would_pay_amount,
    nps: p.nps,
    overall_note: p.overall_note,
    name: p.name,
    email: p.email,
  }
  // PostHog can tie the review to a person via $set on identity.
  posthog.setPersonProperties?.({ name: p.name, email: p.email })
  for (const [k, v] of Object.entries(p.sections)) {
    if (v.score) flat[`score_${k}`] = v.score
    if (v.liked && v.liked.trim()) flat[`liked_${k}`] = v.liked.trim()
    if (v.disliked && v.disliked.trim()) flat[`disliked_${k}`] = v.disliked.trim()
    if (v.likedTags && v.likedTags.length) flat[`likedtags_${k}`] = v.likedTags
    if (v.dislikedTags && v.dislikedTags.length) flat[`dislikedtags_${k}`] = v.dislikedTags
  }
  posthog.capture('prototype_review_submitted', flat)
}
