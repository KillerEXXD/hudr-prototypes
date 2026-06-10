import type { HandReplay } from '@/types/replay'
import { parsePokerStarsHandHistory } from './PokerStarsParser'

export function parseGGPokerHandHistory(text: string): HandReplay {
  const replay = parsePokerStarsHandHistory(text)
  return {
    ...replay,
    handId: replay.handId.startsWith('pokerstars-') ? `ggpoker-${replay.handId.replace('pokerstars-', '')}` : replay.handId,
  }
}
