/**
 * Player Display Formatters
 *
 * Pure utility functions for formatting player names and chip amounts
 * on the canvas replayer.
 */

/**
 * Formats a name part to Title Case (first letter uppercase, rest lowercase)
 */
export function toTitleCase(word: string): string {
  if (!word) return ''
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Returns only the last name in Title Case. Falls back to first name if single word.
 */
export function getDisplayName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return ''

  const parts = trimmed.split(/\s+/)
  if (parts.length > 1) {
    return toTitleCase(parts[parts.length - 1] as string)
  }
  return toTitleCase(parts[0] as string)
}

export function truncateName(name: string, maxLength: number): string {
  const displayName = getDisplayName(name)
  if (displayName.length <= maxLength) return displayName
  return displayName.slice(0, maxLength - 1) + '.'
}

export function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 2)}K`
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount < 100 ? 2 : 0,
  }).format(amount)
}

export function formatStackWithCommas(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount < 100 ? 2 : 0,
  }).format(amount)
}
