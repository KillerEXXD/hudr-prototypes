import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Coins, Plus, ArrowDownRight, ArrowUpRight, CreditCard, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet, useEconomy, useBuyPackage } from '@/hooks/credits'
import { Btn, Card, Section, Sheet, Spinner, EmptyState } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import type { CreditPackage } from '@/types/credits'

const fmt = (n: number) => n.toLocaleString('en-US')

export function WalletPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const wallet = useWallet()
  const economy = useEconomy()
  const buy = useBuyPackage()
  const [checkout, setCheckout] = useState<CreditPackage | null>(null)
  const [done, setDone] = useState(false)

  if (user?.role === 'admin') return <EmptyState title="No wallet for App Admin" sub="Admins configure the economy (Admin → Economy); they don't spend credits." />
  if (wallet.isLoading) return <Spinner label="Loading wallet…" />

  const balance = wallet.data?.balance ?? 0
  const txns = wallet.data?.txns ?? []
  const packages = (economy.data?.packages ?? []).filter((p) => p.active)

  async function pay() {
    if (!checkout) return
    await buy.mutateAsync(checkout.id)
    setDone(true)
    setTimeout(() => { setDone(false); setCheckout(null) }, 1400)
  }

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Coins className="h-5 w-5 text-accent-amber" />Wallet</h1>

      {/* balance */}
      <div className="mt-3 rounded-2xl border border-accent-amber/40 bg-gradient-to-br from-accent-amber/20 to-bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Your credits</p>
        <p className="mt-0.5 flex items-baseline gap-1.5 font-mono text-3xl font-extrabold text-text-primary"><Coins className="h-6 w-6 text-accent-amber" />{fmt(balance)}</p>
        <p className="mt-1 text-[11px] text-text-muted">Credits cover joining, creating &amp; hosting. They're a facilitation fee — never a prize, and never cash.</p>
      </div>

      {/* package store */}
      <Section title="Buy credits">
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
        <p className="mt-1.5 text-[10px] text-text-muted">Packages are set by the app operator. Purchases are mock in this prototype.</p>
      </Section>

      {/* ledger */}
      <Section title="History">
        {txns.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="flex flex-col gap-1.5">
            {txns.map((t) => {
              const positive = t.amount >= 0
              return (
                <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', positive ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-bg-surface text-text-muted')}>
                    {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{t.label}</p>
                    <p className="text-[10px] text-text-muted">{t.ts}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-mono text-sm font-bold', positive ? 'text-accent-emerald' : 'text-text-primary')}>{positive ? '+' : ''}{fmt(t.amount)}</p>
                    <p className="font-mono text-[10px] text-text-muted">{fmt(t.balanceAfter)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* mock checkout */}
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
              <Btn className="w-full" disabled={buy.isPending} onClick={pay}><Plus className="h-4 w-4" />Pay ${checkout.priceUSD} (mock) → +{fmt(checkout.credits)} cr</Btn>
            </div>
          )
        )}
      </Sheet>
    </div>
  )
}
