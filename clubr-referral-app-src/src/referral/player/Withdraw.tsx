import { useState } from 'react'
import { Banknote, Check, Clock, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSummary, useWithdrawals, useRequestWithdrawal, useConfig } from '@/hooks/referral'
import { Btn, Spinner, Badge } from '@/components/common/ui'
import { money, fmtDate } from '@/lib/referralFormat'
import type { WithdrawalStatus } from '@/types/referral'

const STATUS: Record<WithdrawalStatus, { tone: 'amber' | 'green' | 'red'; Icon: typeof Check; label: string }> = {
  pending: { tone: 'amber', Icon: Clock, label: 'Pending' },
  approved: { tone: 'green', Icon: Check, label: 'Paid' },
  rejected: { tone: 'red', Icon: X, label: 'Rejected' },
}

export function Withdraw() {
  const { user } = useAuth()
  const { data: summary, isLoading } = useSummary(user?.id)
  const { data: history } = useWithdrawals(user?.id)
  const { data: config } = useConfig()
  const req = useRequestWithdrawal()
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (isLoading || !summary) return <Spinner />
  const min = config?.minWithdrawalUsd ?? 50
  const avail = summary.available

  const submit = async () => {
    setErr(null); setDone(false)
    const amt = Math.round(parseFloat(amount) * 100) / 100
    if (!amt || amt <= 0) return setErr('Enter an amount.')
    const res = await req.mutateAsync({ userId: user!.id, amountUsd: amt, note: 'To bank ••4291' })
    if (!res.ok) return setErr(res.error ?? 'Could not submit.')
    setDone(true); setAmount('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-emerald/15 text-accent-emerald"><Banknote className="h-5 w-5" /></span>
        <h1 className="text-lg font-extrabold">Withdraw earnings</h1>
      </div>

      <div className="rounded-3xl border border-accent-emerald/25 bg-gradient-to-b from-accent-emerald/12 to-transparent p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-text-muted">Available balance</div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums text-accent-emerald">{money(avail)}</div>
        <div className="mt-0.5 text-xs text-text-muted">Minimum withdrawal {money(min)}</div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Amount (USD)</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-muted">$</span>
            <input inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setErr(null); setDone(false) }} placeholder="0.00" className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-accent-blue" />
            <Btn size="sm" variant="secondary" onClick={() => setAmount(String(avail))}>Max</Btn>
          </div>
        </label>
        <div className="mt-2 text-xs text-text-muted">Paid to your linked bank account (mock). Real payouts via Stripe/PayPal in production.</div>
        {err && <div className="mt-2 rounded-lg bg-accent-red/10 px-3 py-2 text-xs font-semibold text-accent-red">{err}</div>}
        {done && <div className="mt-2 rounded-lg bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald">Request submitted — it's now pending admin approval.</div>}
        <Btn className="mt-3 w-full" onClick={submit} loading={req.isPending} disabled={avail <= 0}>Request withdrawal</Btn>
      </div>

      <div>
        <h2 className="mb-2 px-0.5 text-base font-extrabold">History</h2>
        <div className="space-y-2">
          {(history ?? []).length === 0 && <p className="text-sm text-text-muted">No withdrawals yet.</p>}
          {(history ?? []).map((w) => {
            const st = STATUS[w.status]
            return (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface"><st.Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold tabular-nums">{money(w.amountUsd)}</div><div className="text-xs text-text-muted">{w.note} · {fmtDate(w.requestedAt)}</div></div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
