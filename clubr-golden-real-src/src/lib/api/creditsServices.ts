// Credit-economy services — swap seam (mock store today, API later). SPEC §19.
import { MOCK_LATENCY_MS } from '@/config/api'
import * as store from '@/data/creditsStore'
import type { CreditPackage, CreditTxnKind, EconomyConfig, Wallet } from '@/types/credits'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

export async function getWallet(userId: string): Promise<Wallet> {
  await delay(60)
  return { balance: store.getBalance(userId), txns: store.getTxns(userId).slice() }
}
export async function getEconomy(): Promise<{ costs: EconomyConfig; packages: CreditPackage[] }> {
  await delay(40)
  return { costs: { ...store.ECONOMY }, packages: [...store.PACKAGES].sort((a, b) => a.sortOrder - b.sortOrder) }
}

/** Charge for an action (the UI gate has already confirmed). Returns ok + new balance. */
export async function spend(userId: string, kind: CreditTxnKind, label: string, amount: number): Promise<{ ok: boolean; balance: number }> {
  await delay(80)
  const ok = store.charge(userId, kind, label, amount)
  return { ok, balance: store.getBalance(userId) }
}

/** Mock top-up from a package (real checkout wired in Phase 2). */
export async function buyPackage(userId: string, packageId: string): Promise<void> {
  await delay(150)
  const p = store.PACKAGES.find((x) => x.id === packageId)
  if (p) store.topUp(userId, `Purchased ${p.credits.toLocaleString()} credits · $${p.priceUSD}`, p.credits)
}

// ---- App Admin: configure the economy ----
export async function updateCosts(costs: EconomyConfig): Promise<void> {
  await delay(80)
  store.ECONOMY.joinGameCost = Math.max(0, costs.joinGameCost)
  store.ECONOMY.createClubCost = Math.max(0, costs.createClubCost)
  store.ECONOMY.hostGameCost = Math.max(0, costs.hostGameCost)
}
export async function upsertPackage(p: CreditPackage): Promise<void> {
  await delay(80)
  const i = store.PACKAGES.findIndex((x) => x.id === p.id)
  if (i >= 0) store.PACKAGES[i] = p
  else store.PACKAGES.push({ ...p, id: p.id || `pk_${Date.now()}` })
}
export async function deletePackage(id: string): Promise<void> {
  await delay(80)
  const i = store.PACKAGES.findIndex((x) => x.id === id)
  if (i >= 0) store.PACKAGES.splice(i, 1)
}
