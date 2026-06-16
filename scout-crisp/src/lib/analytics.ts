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

// Central feedback store in TournamentPro — every submission is mirrored here
// (in addition to PostHog) so no feedback is ever lost. Fire-and-forget.
const FEEDBACK_ENDPOINT = 'https://tgblnqsckkrdhjmncmhu.supabase.co/functions/v1/submit-feedback'

function sendToTournamentPro(kind: 'quick_note' | 'guided_review', fields: Record<string, unknown>): void {
  try {
    const ph = posthog as unknown as { get_distinct_id?: () => string; get_session_id?: () => string; get_session_replay_url?: () => string }
    fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        app: 'scout-' + PROTOTYPE, product: 'hudr', kind, ...fields,
        context: {
          user_agent: navigator.userAgent, referrer: document.referrer, page_url: location.href,
          viewport: `${window.innerWidth}x${window.innerHeight}`, language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        posthog: { distinct_id: ph.get_distinct_id?.(), session_id: ph.get_session_id?.(), replay_url: ph.get_session_replay_url?.() },
        raw: { kind, ...fields },
      }),
    }).catch(() => { /* ignore — never block feedback on the network */ })
  } catch { /* ignore */ }
}

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

// ---- Shared reviewer identity (captured once, reused by short + long feedback) ----

const IDENTITY_KEY = 'scout-reviewer'
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
  name: string          // required (reused from the shared identity)
  email: string         // required
}

/** Structured quick-note event — links to the user's session replay in PostHog. */
export function captureFeedback(data: FeedbackPayload): void {
  setIdentity(data.name, data.email)
  posthog.capture('feedback_submitted', { prototype: PROTOTYPE, surface: 'scout-prototype', ...data })
  sendToTournamentPro('quick_note', { screen: data.screen, ease: data.ease, improve: data.improve, liked: data.liked, name: data.name, email: data.email })
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
  setIdentity(p.name, p.email)
  for (const [k, v] of Object.entries(p.sections)) {
    if (v.score) flat[`score_${k}`] = v.score
    if (v.liked && v.liked.trim()) flat[`liked_${k}`] = v.liked.trim()
    if (v.disliked && v.disliked.trim()) flat[`disliked_${k}`] = v.disliked.trim()
    if (v.likedTags && v.likedTags.length) flat[`likedtags_${k}`] = v.likedTags
    if (v.dislikedTags && v.dislikedTags.length) flat[`dislikedtags_${k}`] = v.dislikedTags
  }
  posthog.capture('prototype_review_submitted', flat)
  const scores = Object.values(p.sections).map((s) => s.score).filter((n) => n > 0)
  const avg_score = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : undefined
  sendToTournamentPro('guided_review', {
    screen: (typeof location !== 'undefined' ? location.hash : '') || '#/',
    name: p.name, email: p.email, sections: p.sections, avg_score,
    would_use: p.would_use, would_pay: p.would_pay, would_pay_amount: p.would_pay_amount,
    nps: p.nps, overall_note: p.overall_note,
  })
}
