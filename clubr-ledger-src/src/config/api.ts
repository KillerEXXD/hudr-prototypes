// =====================================================================
// THE SWAP BOUNDARY (mirrors hudr-pwa/src/config/api.ts).
// Flip VITE_USE_MOCK=false (and set VITE_API_BASE_URL) to point the exact
// same service/hook/component stack at the real api.hudr.ai — nothing else
// in the app changes.
// =====================================================================

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.hudr.ai').replace(/\/+$/, '')

export const HUDR_API_KEY = import.meta.env.VITE_HUDR_API_KEY || ''

/** Simulated network latency for the mock client (ms) so loading states are real. */
export const MOCK_LATENCY_MS = 280
