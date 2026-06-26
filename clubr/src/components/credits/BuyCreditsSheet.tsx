import { useState } from 'react'
import { Coins, Plus, CreditCard, Sparkles } from 'lucide-react'
import { Sheet, Btn, Spinner } from '@/components/common/ui'
import { useWallet, useEconomy, useBuyPackage } from '@/hooks/credits'
import type { CreditPackage } from '@/types/credits'

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * The buy-credits market as a STACKED popup — opened over a create/host form (or the
 * spend confirm) when the balance is short, so the user tops up without leaving the
 * flow and losing what they typed. Buying invalidates the `['credits']` query, so the
 * parent's balance updates live and its "not enough credits" banner clears on its own.
 * The full /wallet page still exists for balance + history.
 */
export function BuyCreditsSheet({ open, onClose, need }: { open: boolean; onClose: () => void; need?: number }) {
  const wallet = useWallet()
  const economy = useEconomy()
  const buy = useBuyPackage()
  const [checkout, setCheckout] = useState<CreditPackage | null>(null)
  const [done, setDone] = useState(false)

  const balance = wallet.data?.balance ?? 0
  const packages = (economy.data?.packages ?? []).filter((p) => p.active)

  async function pay() {
    if (!checkout) return
    await buy.mutateAsync(checkout.id)
    setDone(true)
    setTimeout(() => { setDone(false); setCheckout(null) }, 1400)
  }

  return (
    <>
      <Sheet open={open} onClose={() => { setCheckout(null); setDone(false); onClose() }} title="Buy credits">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Your balance</span>
            <span className="flex items-center gap-1 font-mono text-lg font-extrabold text-text-primary"><Coins className="h-4 w-4 text-accent-amber" />{fmt(balance)}</span>
          </div>
          {need != null && need > 0 && (
            <p className="text-xs text-text-secondary">You need <b className="text-text-primary">{fmt(need)}</b> more credits — pick a package below, then come back to finish.</p>
          )}
          {economy.isLoading ? <Spinner /> : (
            <div className="grid grid-cols-2 gap-2">
              {packages.map((p) => (
                <button key={p.id} type="button" onClick={() => { setDone(false); setCheckout(p) }} className="relative flex flex-col rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:border-accent-amber/50 hover:bg-bg-surface active:scale-[0.99] cursor-pointer">
                  {p.bonus && <span className="absolute right-2 top-2 rounded-full bg-accent-amber/20 px-1.5 py-0.5 text-[9px] font-bold text-accent-amber">{p.bonus}</span>}
                  <span className="flex items-center gap-1 font-mono text-lg font-extrabold text-text-primary"><Coins className="h-4 w-4 text-accent-amber" />{fmt(p.credits)}</span>
                  <span className="text-[11px] text-text-muted">{p.label}</span>
                  <span className="mt-2 inline-flex items-center justify-center rounded-lg bg-accent-amber/15 py-1 text-sm font-bold text-accent-amber">${p.priceUSD}</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] text-text-muted">Credits are a facilitation fee — never a prize. Purchases are mock in this prototype.</p>
        </div>
      </Sheet>

      {/* Mock checkout — stacked above the package grid. */}
      <Sheet open={!!checkout} onClose={() => setCheckout(null)} title="Checkout">
        {checkout && (
          done ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles className="h-9 w-9 text-accent-amber" />
              <p className="text-sm font-semibold text-text-primary">+{fmt(checkout.credits)} credits added!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/60 px-3 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-lg font-extrabold text-text-primary"><Coins className="h-5 w-5 text-accent-amber" />{fmt(checkout.credits)}</span>
                <span className="text-lg font-extrabold text-text-primary">${checkout.priceUSD}</span>
              </div>
              <div className="rounded-xl border border-dashed border-border px-3 py-3 text-center text-xs text-text-muted">
                <CreditCard className="mx-auto mb-1 h-5 w-5" />
                Mock checkout — no real charge in the prototype.<br />A real payment step plugs in here at launch.
              </div>
              <Btn className="w-full" loading={buy.isPending} onClick={pay}><Plus className="h-4 w-4" />Pay ${checkout.priceUSD} (mock) → +{fmt(checkout.credits)} cr</Btn>
            </div>
          )
        )}
      </Sheet>
    </>
  )
}
