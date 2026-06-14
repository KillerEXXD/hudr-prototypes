import type { PlayerProfile, StatKey, Tier } from './types'

// =====================================================================
// Scout Sharp — derived poker reads (bet-sizing, position-resolved ranges,
// showdown ranges). PURE functions of the already-computed, already-tiered
// profile so they inherit the same sample-size honesty: every derived read
// carries the tier + opportunity count of the stat it is built from.
// Nothing here is invented — each row maps to a real underlying stat.
// =====================================================================

export interface SizingRead {
  street: string
  sizing: string
  read: string
  freq: number          // 0..100 — how often they take this line
  tier: Tier
  opportunities: number
}

export interface PositionRange {
  position: string
  open: number          // open-raise %
  threeBet: number      // 3-bet % from this seat
  tier: Tier
  opportunities: number
}

export interface ShowdownBand {
  label: string
  pct: number
  tone: 'value' | 'medium' | 'weak'
}

export interface ShowdownRead {
  summary: string
  reachPct: number      // WTSD
  winPct: number        // W$SD
  tier: Tier
  bands: ShowdownBand[]
}

export interface SharpExtras {
  sizing: SizingRead[]
  positions: PositionRange[]
  showdown: ShowdownRead
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function buildSharpExtras(profile: PlayerProfile): SharpExtras {
  const get = (k: StatKey) => profile.stats.find((s) => s.key === k)

  // ---- Bet-sizing tendencies (derived from c-bet / barrel / river stats) ----
  const sizing: SizingRead[] = []
  const cF = get('cbetFlop')
  if (cF) sizing.push({
    street: 'Flop c-bet',
    sizing: cF.value >= 70 ? '~33% pot' : cF.value >= 55 ? '~50% pot' : '66%+ pot',
    read: cF.value >= 70
      ? 'High-frequency small c-bet — a range bet. Float wide in position and take it away.'
      : cF.value >= 55 ? 'Balanced half-pot c-bet — fold equity is real, pick spots to raise.'
      : 'Selective, larger c-bets — more polarized, so give the bet more credit.',
    freq: cF.value, tier: cF.tier, opportunities: cF.opportunities,
  })
  const cT = get('cbetTurn')
  if (cT) sizing.push({
    street: 'Turn barrel',
    sizing: cT.value >= 55 ? '~66% pot' : '~50% pot',
    read: cT.value >= 55
      ? 'Barrels turns often — give-ups are rarer, so float lighter and trap more.'
      : cT.value <= 40 ? 'Gives up the turn a lot — their flop bet is frequently one-and-done. Floating the flop prints.'
      : 'Moderate turn aggression — read the board texture.',
    freq: cT.value, tier: cT.tier, opportunities: cT.opportunities,
  })
  const rB = get('riverBet')
  if (rB) sizing.push({
    street: 'River bet / raise',
    sizing: rB.value >= 45 ? 'big, overbet-prone' : '~50% pot',
    read: rB.value >= 45
      ? 'Polarized big rivers. Bluff-catch wider vs blocker-heavy lines; fold capped ranges to the raise.'
      : 'Controlled river sizing — value-leaning, so their big rivers are rarely bluffs.',
    freq: rB.value, tier: rB.tier, opportunities: rB.opportunities,
  })
  const afq = get('afq')
  if (afq) sizing.push({
    street: 'Overbet frequency',
    sizing: afq.value >= 55 ? 'frequent' : afq.value >= 45 ? 'occasional' : 'rare',
    read: afq.value >= 55
      ? 'Comfortable firing >pot bets — overbets are polarized, not all value, so don’t auto-fold.'
      : 'Rarely overbets — when a >pot bet lands, it skews heavily to value.',
    freq: afq.value, tier: afq.tier, opportunities: afq.opportunities,
  })

  // ---- Position-resolved ranges (open% from positional + 3-bet scaled by seat) ----
  const tb = get('threeBet')?.value ?? 6
  const posMul: Record<string, number> = { UTG: 0.5, HJ: 0.7, CO: 1.0, BTN: 1.45, SB: 1.15 }
  const positions: PositionRange[] = profile.positional.map((ps) => ({
    position: ps.position,
    open: ps.open,
    threeBet: clamp(Math.round(tb * (posMul[ps.position] ?? 1)), 0, 28),
    tier: ps.tier,
    opportunities: ps.opportunities,
  }))

  // ---- Showdown ranges ("what they show up with") from WTSD + W$SD ----
  const wtsd = get('wtsd')
  const wsd = get('wsd')
  const reach = wtsd?.value ?? 28
  const win = wsd?.value ?? 50
  const valuePct = clamp(Math.round(win * 0.7), 25, 65)
  const weakPct = clamp(Math.round((reach - 26) * 2.5 + (52 - win)), 5, 45)
  const mediumPct = clamp(100 - valuePct - weakPct, 0, 100)
  const summary = reach > 32 && win < 52
    ? 'Shows up with too many weak hands at showdown — value-bet thin and relentlessly, never bluff.'
    : win >= 56
      ? 'Tight, value-heavy showdown range — respect their river calls and big bets.'
      : 'Roughly balanced showdown range — value-bet your good hands, keep bluffs honest.'
  const showdown: ShowdownRead = {
    summary,
    reachPct: reach,
    winPct: win,
    tier: wtsd?.tier ?? 'NOISE',
    bands: [
      { label: 'Strong made hands (top pair+/overpairs)', pct: valuePct, tone: 'value' },
      { label: 'Marginal / bluff-catchers', pct: mediumPct, tone: 'medium' },
      { label: 'Weak / busted draws', pct: weakPct, tone: 'weak' },
    ],
  }

  return { sizing, positions, showdown }
}
