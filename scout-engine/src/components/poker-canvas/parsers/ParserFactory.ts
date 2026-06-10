import type { HandReplay } from '@/types/replay'
import type { HandReplaySource } from '../types/canvas-types'
import { parseHandReplay } from './HandReplayParser'
import { parsePokerStarsHandHistory } from './PokerStarsParser'
import { parseGGPokerHandHistory } from './GGPokerParser'

export function parseHandHistory(input: HandReplaySource): HandReplay {
  if (typeof input !== 'string') {
    return parseHandReplay(input)
  }

  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Empty hand history')
  }

  // Accept JSON string payloads that contain a serialized HandReplay
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (parsed && typeof parsed === 'object' && 'steps' in (parsed as Record<string, unknown>)) {
        return parseHandReplay(parsed as HandReplay)
      }
    } catch {
      // Fall through to text parsing when JSON decode fails
    }
  }

  if (/PokerStars/i.test(trimmed)) {
    return parsePokerStarsHandHistory(trimmed)
  }
  if (/GGPoker|GGNetwork|GGPOKER/i.test(trimmed)) {
    return parseGGPokerHandHistory(trimmed)
  }

  // Fallback to PokerStars-style parsing which is close to many formats
  return parsePokerStarsHandHistory(trimmed)
}
