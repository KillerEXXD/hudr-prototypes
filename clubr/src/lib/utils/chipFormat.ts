// Abbreviated chip count for Last Longer leaderboards / chip-lead chat.
// Keeps up to 2 decimals and trims trailing zeros, so an exact entry survives:
//   8500 → "8.5K"   8550 → "8.55K"   9000 → "9K"   1_234_567 → "1.23M"   999 → "999"
// (Previously this rounded to whole-K, so 8500 displayed as "9K".)
const trim2 = (x: number) => parseFloat(x.toFixed(2)).toString()

export const fmtChips = (n: number): string =>
  n >= 1e6 ? `${trim2(n / 1e6)}M`
  : n >= 1e3 ? `${trim2(n / 1e3)}K`
  : String(n)

// Strip everything that isn't a digit — for a chip-count input that must accept
// whole numbers only (no letters, spaces, decimals, signs, or other symbols).
export const digitsOnly = (s: string): string => s.replace(/\D/g, '')
