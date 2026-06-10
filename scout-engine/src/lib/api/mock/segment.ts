import type { ApiPlayerStats } from '../types'

// =====================================================================
// MODELED segmentation (mock only). The real api.hudr.ai returns true
// per-segment numbers; here we derive plausible variations so the demo
// behaves realistically: career accumulates hands (→ RELIABLE), each
// table-size / depth slice has fewer hands (→ TENTATIVE/NOISE) and shifted
// values. Clearly a stand-in — swapped out wholesale when live.
// =====================================================================

type SegParams = { tournament_id?: string; table_size?: string; depth?: string }
const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const af = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10))

export function applyFilters(base: ApiPlayerStats, p: SegParams): ApiPlayerStats {
  const scope = p.tournament_id ? 'event' : 'career'
  const table = (p.table_size as 'all' | 'short' | 'full') || 'all'
  const depth = (p.depth as 'all' | 'short' | 'mid' | 'deep') || 'all'

  const scopeF = scope === 'career' ? 9 : 1
  const tableF = table === 'short' ? 0.4 : table === 'full' ? 0.7 : 1
  const depthF = depth === 'short' ? 0.3 : depth === 'mid' ? 0.5 : depth === 'deep' ? 0.6 : 1

  const s: ApiPlayerStats = { ...base, total_hands: Math.max(0, Math.round(base.total_hands * scopeF * tableF * depthF)) }

  if (table === 'short') {
    s.vpip = pct(s.vpip + 10); s.pfr = pct(s.pfr + 8); s.steal = pct(s.steal + 12)
    s.three_bet = pct(s.three_bet + 3); s.cbet_flop = pct(s.cbet_flop + 5)
    s.af = af(s.af + 0.4); s.afq = pct(s.afq + 6)
  } else if (table === 'full') {
    s.vpip = pct(s.vpip - 2); s.pfr = pct(s.pfr - 1)
  }
  if (depth === 'short') {
    s.three_bet = pct(s.three_bet + 2); s.four_bet = pct(s.four_bet + 1)
    s.cbet_turn = pct(s.cbet_turn - 8); s.wtsd = pct(s.wtsd - 6)
    s.river_bet = pct(s.river_bet - 8); s.af = af(s.af - 0.3)
  } else if (depth === 'deep') {
    s.three_bet = pct(s.three_bet + 2); s.cbet_turn = pct(s.cbet_turn + 4); s.wtsd = pct(s.wtsd + 3)
  }
  return s
}
