// Stub for the ported replayer — no experimental flags in the prototype
// (so it uses the canvas-drawn cards, not the optional SVG image cards).
export type ExperimentalFeatures = Record<string, boolean>

export function parseExperimentalFeatures(_raw?: string): ExperimentalFeatures {
  return {}
}

export function useExperimentalFeatures(): ExperimentalFeatures {
  return {}
}
