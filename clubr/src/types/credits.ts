// =====================================================================
// Credit economy (coins) — see SPEC §19. Credits are the real-money
// facilitation fee for acting (join / create / host); never a prize, and
// distinct from offline "Stakes". Non-cash, non-refundable to money, no P2P.
// =====================================================================

export type CreditTxnKind = 'seed' | 'purchase' | 'join' | 'create_club' | 'host_game' | 'refund'

export interface CreditTxn {
  id: string
  ts: string            // display time, e.g. 'now', '2d ago'
  kind: CreditTxnKind
  label: string         // human line, e.g. 'Joined DogHouse Main Event FT'
  amount: number        // +credits (purchase/refund/seed) or −credits (spend)
  balanceAfter: number
}

export interface CreditPackage {
  id: string
  label: string
  credits: number
  priceUSD: number
  active: boolean
  sortOrder: number
  bonus?: string        // optional tag, e.g. 'Best value'
}

/** App-Admin-configurable action costs (defaults 100 / 200 / 100). */
export interface EconomyConfig {
  joinGameCost: number
  createClubCost: number
  hostGameCost: number
}

export interface Wallet {
  balance: number
  txns: CreditTxn[]      // newest first
}

export const DEFAULT_ECONOMY: EconomyConfig = { joinGameCost: 100, createClubCost: 200, hostGameCost: 100 }
export const STARTING_CREDITS = 1000
