import posthog from 'posthog-js'

// =====================================================================
// Prototype analytics — PostHog autocapture + session replay, plus the
// structured feedback + guided-review events for the ClubR prototype.
// Mirrors the Scout prototypes' analytics so ClubR feedback lands in the
// same PostHog project, tagged `prototype: 'clubr'` for filtering.
// (The phc_ key is a PUBLIC project key — safe to embed in the client.)
// =====================================================================

const POSTHOG_KEY = 'phc_EmCLj9Ed8rTtytQ6lAfyqtP8JBPiabj7QCLSBk4KrtH'
const POSTHOG_HOST = 'https://us.i.posthog.com'

export const PROTOTYPE = 'clubr'
const SURFACE = 'clubr-prototype'

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
    session_recording: { maskAllInputs: false },
    loaded: (ph) => {
      ph.register({ prototype: PROTOTYPE, surface: SURFACE })
      capturePage()
    },
  })
  window.addEventListener('hashchange', capturePage)
}

function capturePage(): void {
  posthog.capture('$pageview', { prototype: PROTOTYPE, screen: window.location.hash || '#/' })
}

// ---- Shared reviewer identity (captured once, reused by short + long feedback) ----

const IDENTITY_KEY = 'clubr-reviewer'
export const isEmail = (s: string) => /.+@.+\..+/.test((s || '').trim())

/** Reviewer identity, persisted in localStorage and reused across both forms. */
export function getIdentity(): { name: string; email: string } | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o.name === 'string' && typeof o.email === 'string' && o.name && o.email) return o
    }
  } catch { /* ignore */ }
  return null
}

/** Persist identity + attach it to the PostHog person so events/replays are named. */
export function setIdentity(name: string, email: string): void {
  const n = name.trim(); const e = email.trim()
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name: n, email: e })) } catch { /* ignore */ }
  posthog.setPersonProperties?.({ name: n, email: e })
}

export interface FeedbackPayload {
  screen: string
  ease: number          // 1–5 (SEQ-style)
  improve?: string
  liked?: string
  name: string
  email: string
}

/** Structured quick-note event — links to the user's session replay in PostHog. */
export function captureFeedback(data: FeedbackPayload): void {
  setIdentity(data.name, data.email)
  posthog.capture('feedback_submitted', { prototype: PROTOTYPE, surface: SURFACE, ...data })
}

// ---- Guided per-feature review (the ReviewWizard) ----

export interface ReviewSectionAnswer {
  score: number
  liked?: string
  disliked?: string
  likedTags?: string[]
  dislikedTags?: string[]
}

export interface ReviewPayload {
  sections: Record<string, ReviewSectionAnswer>
  would_use: number              // 1–5
  would_pay: 'no' | 'maybe' | 'yes'
  would_pay_amount?: string
  nps: number                    // 0–10
  overall_note?: string
  name: string
  email: string
}

/**
 * Flattens the guided review into a single `prototype_review_submitted` event:
 * `score_<key>` / `liked_<key>` / `disliked_<key>` / `likedtags_<key>` /
 * `dislikedtags_<key>` per ClubR feature, plus the overall fields + name/email —
 * so PostHog can average per-feature scores and count tags for ClubR.
 */
export function captureReview(p: ReviewPayload): void {
  const flat: Record<string, unknown> = {
    prototype: PROTOTYPE,
    surface: SURFACE,
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
  setIdentity(p.name, p.email)
  for (const [k, v] of Object.entries(p.sections)) {
    if (v.score) flat[`score_${k}`] = v.score
    if (v.liked && v.liked.trim()) flat[`liked_${k}`] = v.liked.trim()
    if (v.disliked && v.disliked.trim()) flat[`disliked_${k}`] = v.disliked.trim()
    if (v.likedTags && v.likedTags.length) flat[`likedtags_${k}`] = v.likedTags
    if (v.dislikedTags && v.dislikedTags.length) flat[`dislikedtags_${k}`] = v.dislikedTags
  }
  posthog.capture('prototype_review_submitted', flat)
}
