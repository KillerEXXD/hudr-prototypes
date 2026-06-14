/**
 * Card Parsing Utilities
 *
 * Centralized utilities for parsing poker card strings into Card objects.
 * Used across the app for consistent card parsing from API responses.
 */

import type { Card, Suit, Rank } from '@/types'

// =====================
// Constants
// =====================

/** Map of single-character suit abbreviations to full suit names */
const SUIT_MAP: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
  // Support uppercase as well
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
}

/** Map of suit names to single characters (for serialization) */
const SUIT_TO_CHAR: Record<Suit, string> = {
  spades: 's',
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
}

/** Valid ranks */
const VALID_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '?']

/** Default card when parsing fails */
const DEFAULT_CARD: Card = { rank: '?', suit: 'spades' }

// =====================
// Parsing Functions
// =====================

/**
 * Parse a card string like "As", "Kh", "10d", "2c" into a Card object
 *
 * Supported formats:
 * - "As" -> Ace of spades
 * - "Kh" -> King of hearts
 * - "10d" -> Ten of diamonds
 * - "2c" -> Two of clubs
 *
 * @param cardString - The card string to parse (e.g., "As", "Kh")
 * @returns Parsed Card object, or default card if parsing fails
 *
 * @example
 * parseCard("As") // { rank: "A", suit: "spades" }
 * parseCard("10h") // { rank: "10", suit: "hearts" }
 * parseCard("") // { rank: "?", suit: "spades" }
 */
export function parseCard(cardString: string): Card {
  if (!cardString || cardString.length < 2) {
    return { ...DEFAULT_CARD }
  }

  // Handle "10" which is 3 characters, and "T" as shorthand for 10
  let rank: string
  let suitChar: string

  if (cardString.startsWith('10')) {
    rank = '10'
    suitChar = cardString[2]
  } else {
    rank = cardString[0].toUpperCase()
    suitChar = cardString[1]
    // Convert 'T' shorthand to '10'
    if (rank === 'T') {
      rank = '10'
    }
  }

  // Validate rank
  const validRank = VALID_RANKS.includes(rank as Rank) ? (rank as Rank) : '?'

  // Map suit character
  const suit = SUIT_MAP[suitChar] || 'spades'

  return { rank: validRank, suit }
}

/**
 * Parse multiple card strings into Card objects
 *
 * @param cardStrings - Array of card strings
 * @returns Array of parsed Card objects
 *
 * @example
 * parseCards(["As", "Kh"]) // [{ rank: "A", suit: "spades" }, { rank: "K", suit: "hearts" }]
 */
export function parseCards(cardStrings: string[] | null | undefined): Card[] {
  if (!cardStrings || !Array.isArray(cardStrings)) {
    return []
  }
  return cardStrings.map(parseCard)
}

/**
 * Parse hole cards (exactly 2 cards) with type safety
 *
 * @param cardStrings - Array of card strings (should be 2)
 * @returns Tuple of two Card objects, or null if invalid
 *
 * @example
 * parseHoleCards(["As", "Kh"]) // [{ rank: "A", suit: "spades" }, { rank: "K", suit: "hearts" }]
 * parseHoleCards(["As"]) // null (not enough cards)
 */
export function parseHoleCards(
  cardStrings: string[] | null | undefined
): [Card, Card] | null {
  if (!cardStrings || cardStrings.length < 2) {
    return null
  }
  return [parseCard(cardStrings[0]), parseCard(cardStrings[1])]
}

/**
 * Parse community cards from API response (handles both array and object formats)
 *
 * @param communityCards - Either array of strings or object with flop/turn/river
 * @returns Array of parsed Card objects
 *
 * @example
 * // Array format
 * parseCommunityCards(["As", "Kh", "Qd"]) // [{ rank: "A", suit: "spades" }, ...]
 *
 * // Object format
 * parseCommunityCards({ flop: ["As", "Kh", "Qd"], turn: "Jc", river: "10s" })
 */
export function parseCommunityCards(
  communityCards:
    | string[]
    | { flop: string[] | null; turn: string | null; river: string | null }
    | null
    | undefined
): Card[] {
  if (!communityCards) {
    return []
  }

  // Handle array format (legacy)
  if (Array.isArray(communityCards)) {
    return parseCards(communityCards)
  }

  // Handle object format (new API)
  const cards: Card[] = []

  if (communityCards.flop) {
    cards.push(...parseCards(communityCards.flop))
  }
  if (communityCards.turn) {
    cards.push(parseCard(communityCards.turn))
  }
  if (communityCards.river) {
    cards.push(parseCard(communityCards.river))
  }

  return cards
}

// =====================
// Serialization Functions
// =====================

/**
 * Convert a Card object to a string like "As", "Kh"
 *
 * @param card - The Card object to serialize
 * @returns Card string representation
 *
 * @example
 * cardToString({ rank: "A", suit: "spades" }) // "As"
 */
export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_TO_CHAR[card.suit]}`
}

/**
 * Convert multiple Card objects to strings
 *
 * @param cards - Array of Card objects
 * @returns Array of card strings
 */
export function cardsToStrings(cards: Card[]): string[] {
  return cards.map(cardToString)
}

// =====================
// Validation Functions
// =====================

/**
 * Check if a card string is valid
 *
 * @param cardString - The card string to validate
 * @returns True if the card string is valid
 */
export function isValidCardString(cardString: string): boolean {
  if (!cardString || cardString.length < 2) {
    return false
  }

  const rank = cardString.startsWith('10')
    ? '10'
    : cardString[0].toUpperCase()
  const suitChar = cardString.startsWith('10')
    ? cardString[2]
    : cardString[1]

  return VALID_RANKS.includes(rank as Rank) && suitChar in SUIT_MAP
}

/**
 * Check if a Card object represents an unknown card
 *
 * @param card - The Card object to check
 * @returns True if the card is unknown (rank is '?')
 */
export function isUnknownCard(card: Card): boolean {
  return card.rank === '?'
}
