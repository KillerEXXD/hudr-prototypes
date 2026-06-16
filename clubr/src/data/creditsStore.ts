// In-memory credit-economy store. Mutated by creditsServices + the game/club
// services (charge on action, refund on decline). See SPEC §19.
import type { CreditPackage, CreditTxn, CreditTxnKind, EconomyConfig } from '@/types/credits'
import { DEFAULT_ECONOMY, STARTING_CREDITS } from '@/types/credits'

let _tx = 0
const txn = (kind: CreditTxnKind, label: string, amount: number, balanceAfter: number, ts = 'now'): CreditTxn =>
  ({ id: `tx_${++_tx}`, ts, kind, label, amount, balanceAfter })

// ---- balances + per-user ledger (newest first) ----
const BALANCES: Record<string, number> = {}
const LEDGER: Record<string, CreditTxn[]> = {}

/** Make sure a user has a wallet (new sign-ups start at 1000). */
export function ensureWallet(userId: string) {
  if (BALANCES[userId] == null) {
    BALANCES[userId] = STARTING_CREDITS
    LEDGER[userId] = [txn('seed', 'Welcome bonus', STARTING_CREDITS, STARTING_CREDITS, 'on signup')]
  }
}
export const getBalance = (userId: string): number => { ensureWallet(userId); return BALANCES[userId] }
export const getTxns = (userId: string): CreditTxn[] => { ensureWallet(userId); return LEDGER[userId] }

/** Deduct `amount` for an action. Returns false (no-op) if the balance can't cover it. */
export function charge(userId: string, kind: CreditTxnKind, label: string, amount: number): boolean {
  ensureWallet(userId)
  if (BALANCES[userId] < amount) return false
  BALANCES[userId] -= amount
  LEDGER[userId].unshift(txn(kind, label, -amount, BALANCES[userId]))
  return true
}
/** Return credits (auto-refund on decline/withdraw/cancel). Never returns cash. */
export function refund(userId: string, label: string, amount: number) {
  ensureWallet(userId)
  BALANCES[userId] += amount
  LEDGER[userId].unshift(txn('refund', label, amount, BALANCES[userId]))
}
/** Top up from a purchased package (mock in prototype; real checkout in Phase 2). */
export function topUp(userId: string, label: string, amount: number) {
  ensureWallet(userId)
  BALANCES[userId] += amount
  LEDGER[userId].unshift(txn('purchase', label, amount, BALANCES[userId]))
}

// ---- App-Admin-configurable economy ----
export const ECONOMY: EconomyConfig = { ...DEFAULT_ECONOMY }

export const PACKAGES: CreditPackage[] = [
  { id: 'pk_500', label: 'Starter', credits: 500, priceUSD: 5, active: true, sortOrder: 1 },
  { id: 'pk_1200', label: 'Regular', credits: 1200, priceUSD: 10, active: true, sortOrder: 2, bonus: 'Popular' },
  { id: 'pk_2000', label: 'Pro', credits: 2000, priceUSD: 15, active: true, sortOrder: 3, bonus: 'Best value' },
  { id: 'pk_5000', label: 'Whale', credits: 5000, priceUSD: 30, active: true, sortOrder: 4 },
]

// ---- demo seed: balances + a little history (admin has no wallet) ----
function seedSpend(userId: string, items: [CreditTxnKind, string, number][]) {
  ensureWallet(userId)
  for (const [kind, label, amt] of items) {
    BALANCES[userId] -= amt
    LEDGER[userId].unshift(txn(kind, label, -amt, BALANCES[userId]))
  }
}
seedSpend('u_host', [['create_club', 'Created Aces High', 200], ['host_game', 'Hosted Sunday Squares', 100], ['host_game', 'Hosted WSOP Main FT', 100]]) // 1000 → 600
seedSpend('u_player', [['join', 'Joined Cowboys @ Niners Squares', 100]]) // 1000 → 900
ensureWallet('u_mike'); ensureWallet('u_tom'); ensureWallet('u_jordan')
