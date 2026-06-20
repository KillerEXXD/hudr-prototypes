import { describe, it, expect } from 'vitest'
import { orderActiveGames } from './gameOrdering'
import type { UnifiedGame } from './useUnifiedGames'

// orderActiveGames only reads `phase` + `sort`, so build minimal items.
const g = (id: string, phase: 'reg' | 'live' | 'closed', sort: number) =>
  ({ id, phase, sort, type: 'last_longer', clubId: 'c', canManage: false, finished: phase === 'closed', mine: false } as unknown as UnifiedGame)

describe('orderActiveGames', () => {
  it('drops closed games, registration-open before live, urgency (sort) within each group', () => {
    const out = orderActiveGames([
      g('live-soon', 'live', 0),
      g('closed', 'closed', 9),
      g('reg-late', 'reg', 200),
      g('reg-soon', 'reg', 100),
      g('live-late', 'live', 5),
    ])
    expect(out.map((x) => x.id)).toEqual(['reg-soon', 'reg-late', 'live-soon', 'live-late'])
  })

  it('returns empty when everything is closed', () => {
    expect(orderActiveGames([g('a', 'closed', 1), g('b', 'closed', 2)])).toEqual([])
  })
})
