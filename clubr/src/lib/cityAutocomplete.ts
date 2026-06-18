// City autocomplete backed by Google Places Autocomplete (New). Cities-only,
// returns just the display text (the app stores city as a plain string — no Place
// Details call, which keeps it in Google's free tier). A session token groups the
// keystrokes of one lookup for billing. Falls back to the bundled list when no key
// is configured or the request fails — so dev/offline/CI keep working.
//
// Setup: a browser key with Places API (New) enabled + billing, restricted by HTTP
// referrer, in VITE_GOOGLE_PLACES_KEY. See docs/CITY_AUTOCOMPLETE.md.

import { searchCities } from '@/lib/cities'

const KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined
const ENDPOINT = 'https://places.googleapis.com/v1/places:autocomplete'

export function hasPlacesKey(): boolean {
  return !!KEY
}

/** A session token ties a lookup's keystrokes together for Places billing. */
export function newSessionToken(): string {
  // crypto.randomUUID is available in all target browsers; fall back just in case.
  return globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

interface AutocompleteResponse {
  suggestions?: { placePrediction?: { text?: { text?: string } } }[]
}

/**
 * City suggestions for `input`. Uses Google Places when a key is set, else the
 * bundled list. Never throws — any API/network error degrades to the bundled list.
 */
export async function fetchCitySuggestions(input: string, sessionToken: string, signal?: AbortSignal): Promise<string[]> {
  const q = input.trim()
  if (q.length < 2) return []
  if (!KEY) return searchCities(q)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
      // (cities) = locality + administrative_area_level_3; text-only field mask.
      body: JSON.stringify({ input: q, includedPrimaryTypes: ['(cities)'], sessionToken }),
      signal,
    })
    if (!res.ok) return searchCities(q)
    const data = (await res.json()) as AutocompleteResponse
    const out = (data.suggestions ?? [])
      .map((s) => s.placePrediction?.text?.text?.trim())
      .filter((t): t is string => !!t)
    return out.length ? out : searchCities(q)
  } catch {
    return searchCities(q) // offline / aborted / blocked → bundled list
  }
}
