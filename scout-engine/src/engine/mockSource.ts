// =====================================================================
// Prototype-only mock source data. In production these numbers come from
// the deterministic stat engine over real hand histories (player_stat_hands).
// Here we extend the base STATS dataset with the spec-only stats that the
// original prototype dataset didn't carry, plus illustrative sample hands.
// =====================================================================

/** Spec stats not present in the base STATS records, per player. */
export interface ExtraStats {
  foldTo3Bet: number
  fourBet: number
  coldCall: number
  foldToCbetFlop: number
  foldToCbetTurn: number
  donk: number
  wwsf: number
  afq: number
  riverBet: number
}

export const EXTRA_STATS: Record<string, ExtraStats> = {
  p1: { foldTo3Bet: 45, fourBet: 6, coldCall: 8, foldToCbetFlop: 48, foldToCbetTurn: 50, donk: 3, wwsf: 52, afq: 48, riverBet: 40 },
  p2: { foldTo3Bet: 40, fourBet: 8, coldCall: 6, foldToCbetFlop: 42, foldToCbetTurn: 45, donk: 2, wwsf: 55, afq: 52, riverBet: 42 },
  p3: { foldTo3Bet: 62, fourBet: 4, coldCall: 14, foldToCbetFlop: 64, foldToCbetTurn: 58, donk: 9, wwsf: 44, afq: 38, riverBet: 30 },
  p4: { foldTo3Bet: 48, fourBet: 7, coldCall: 10, foldToCbetFlop: 58, foldToCbetTurn: 52, donk: 4, wwsf: 50, afq: 47, riverBet: 35 },
  p5: { foldTo3Bet: 44, fourBet: 9, coldCall: 12, foldToCbetFlop: 50, foldToCbetTurn: 48, donk: 5, wwsf: 50, afq: 50, riverBet: 40 },
  p6: { foldTo3Bet: 42, fourBet: 8, coldCall: 8, foldToCbetFlop: 46, foldToCbetTurn: 48, donk: 3, wwsf: 55, afq: 50, riverBet: 36 },
  p7: { foldTo3Bet: 40, fourBet: 9, coldCall: 13, foldToCbetFlop: 36, foldToCbetTurn: 40, donk: 6, wwsf: 47, afq: 55, riverBet: 44 },
  p8: { foldTo3Bet: 70, fourBet: 3, coldCall: 10, foldToCbetFlop: 36, foldToCbetTurn: 50, donk: 7, wwsf: 45, afq: 32, riverBet: 25 },
  p9: { foldTo3Bet: 68, fourBet: 2, coldCall: 6, foldToCbetFlop: 42, foldToCbetTurn: 45, donk: 4, wwsf: 40, afq: 40, riverBet: 38 },
}

export interface SampleHand {
  label: string
  board: string[]
  desc: string
}

/** Illustrative hands referenced by fired exploits (spec §5.2 "sample hand per leak"). */
export const SAMPLE_HANDS: Record<string, SampleHand> = {
  'h-cbet': { label: 'Hand 34', board: ['Kd', '8s', '3c'], desc: 'Raised the BB, c-bet a dry K-8-3 flop, opponent folded instantly — the standard line that prints.' },
  'h-turn': { label: 'Hand 51', board: ['Qh', '9d', '4c', 'Ah'], desc: 'Barreled the turn when the ace landed; opponent folded a pair of nines.' },
  'h-steal': { label: 'Hand 18', board: [], desc: 'Min-raised the button, big blind folded preflop without a fight.' },
  'h-3bet': { label: 'Hand 27', board: [], desc: 'Light 3-bet from the SB; opponent open-folded their button raise.' },
  'h-float': { label: 'Hand 62', board: ['Js', '7h', '2d', '5c'], desc: 'Floated the flop c-bet in position, took it away on the turn check.' },
  'h-station': { label: 'Hand 44', board: ['Th', '6s', '6d', '2c', 'Kh'], desc: 'Triple-barrel got called down by second pair — never bluff this player.' },
  'h-wtsd': { label: 'Hand 39', board: ['9c', '5h', '4s', 'Qd', 'Jc'], desc: 'Called three streets with ace-high and lost — pure curiosity call.' },
  'h-cr': { label: 'Hand 21', board: ['8d', '7d', '3s'], desc: 'Check-raised a wet flop to blow a thin value bet off its equity.' },
  'h-donk': { label: 'Hand 12', board: ['Ac', 'Kd', '9h'], desc: 'Donk-led the flop with middle pair — a classic capped, raisable range.' },
  'h-nit': { label: 'Hand 9', board: [], desc: 'Folded to a small re-raise with a hand most players defend.' },
}
