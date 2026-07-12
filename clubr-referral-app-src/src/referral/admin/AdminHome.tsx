import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, HandCoins, PiggyBank, Clock, Zap, Trophy } from 'lucide-react'
import { useKpis, usePlayers, useSimulate } from '@/hooks/referral'
import { Spinner, Btn, Sheet, Avatar } from '@/components/common/ui'
import { money } from '@/lib/referralFormat'
import { cn } from '@/lib/utils/cn'

export function AdminHome() {
  const nav = useNavigate()
  const { data: k, isLoading } = useKpis()
  const { data: players } = usePlayers()
  const sim = useSimulate()
  const [simOpen, setSimOpen] = useState(false)
  const [simUser, setSimUser] = useState('u_ben')
  const [simAmt, setSimAmt] = useState('100')

  if (isLoading || !k) return <Spinner label="Loading dashboard…" />

  const kpis = [
    { label: 'Coin revenue', value: money(k.coinRevenue), Icon: Coins, tone: 'text-accent-amber', bg: 'bg-accent-amber/12' },
    { label: 'Paid to referrers', value: money(k.paidToReferrers), Icon: HandCoins, tone: 'text-accent-purple', bg: 'bg-accent-purple/12' },
    { label: 'Outstanding balance', value: money(k.outstanding), Icon: PiggyBank, tone: 'text-accent-emerald', bg: 'bg-accent-emerald/12' },
    { label: 'Pending withdrawals', value: money(k.pendingWithdrawals), Icon: Clock, tone: 'text-accent-blue', bg: 'bg-accent-blue/12' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Referral overview</h1>
        <Btn size="sm" variant="secondary" onClick={() => setSimOpen(true)}><Zap className="h-4 w-4 text-accent-amber" /> Simulate purchase</Btn>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-bg-card p-3.5">
            <span className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-xl', t.bg, t.tone)}><t.Icon className="h-4 w-4" /></span>
            <div className="text-xl font-extrabold tabular-nums">{t.value}</div>
            <div className="text-[11px] font-semibold text-text-muted">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-border bg-bg-card p-3.5"><div className="text-xl font-extrabold tabular-nums">{k.activeReferrers}</div><div className="text-[11px] font-semibold text-text-muted">Active referrers</div></div>
        <div className="rounded-2xl border border-border bg-bg-card p-3.5"><div className="text-xl font-extrabold tabular-nums">{k.totalReferrals}</div><div className="text-[11px] font-semibold text-text-muted">Total referral links</div></div>
      </div>

      {/* Top referrers */}
      <div>
        <div className="mb-2 flex items-center gap-2 px-0.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-amber/15 text-accent-amber"><Trophy className="h-4 w-4" /></span><h2 className="text-base font-extrabold">Top referrers</h2></div>
        <div className="space-y-2">
          {k.topReferrers.map((r, i) => (
            <button key={r.userId} type="button" onClick={() => nav(`/admin/players/${r.userId}`)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-left transition-colors hover:bg-bg-surface cursor-pointer">
              <span className="w-5 text-center text-sm font-extrabold text-text-muted">{i + 1}</span>
              <Avatar name={r.name} color={r.avatarColor} pic={r.avatarUrl} size={34} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.name}</span>
              <span className="text-sm font-extrabold tabular-nums text-accent-emerald">{money(r.earned)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulate purchase (A7) */}
      <Sheet open={simOpen} onClose={() => setSimOpen(false)} title="Simulate a real purchase">
        <p className="mb-3 text-xs text-text-muted">Runs the accrual engine live — watch earnings + residuals flow to the upline across every dashboard.</p>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Buyer</span>
          <select value={simUser} onChange={(e) => setSimUser(e.target.value)} className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-sm font-semibold cursor-pointer">
            {(players ?? []).map((p) => <option key={p.userId} value={p.userId}>{p.name}</option>)}
            <option value="u_cara">Cara Diaz</option><option value="u_dylan">Dylan Wu</option><option value="u_eve">Eve Larsen</option><option value="u_eli">Eli Barnes</option>
          </select>
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Amount (USD)</span>
          <input inputMode="decimal" value={simAmt} onChange={(e) => setSimAmt(e.target.value)} className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-sm font-bold" />
        </label>
        <Btn className="w-full" loading={sim.isPending} onClick={async () => { await sim.mutateAsync({ userId: simUser, amountUsd: Math.max(0, parseFloat(simAmt) || 0) }); setSimOpen(false) }}>Run purchase</Btn>
      </Sheet>
    </div>
  )
}
