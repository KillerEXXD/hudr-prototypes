import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, SlidersHorizontal, Undo2 } from 'lucide-react'
import { usePlayerAdmin, useConfig, useSetOverride, useReverse } from '@/hooks/referral'
import { Avatar, Badge, Btn, Sheet, Spinner } from '@/components/common/ui'
import { Stat, LedgerRow, LevelBadge } from '@/referral/parts'
import { money, pct, fmtDate, tierLabel } from '@/lib/referralFormat'
import type { EarningDetail } from '@/types/referral'

export function AdminPlayerDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, isLoading } = usePlayerAdmin(id)
  const { data: config } = useConfig()
  const setOverride = useSetOverride()
  const reverse = useReverse()
  const [ovOpen, setOvOpen] = useState(false)
  const [audit, setAudit] = useState<EarningDetail | null>(null)
  const [y1, setY1] = useState(''); const [y2, setY2] = useState(''); const [y3, setY3] = useState(''); const [res, setRes] = useState('')

  useEffect(() => {
    if (!config) return
    const o = data?.override ?? {}
    setY1(String(Math.round(((o.y1 ?? config.y1)) * 100)))
    setY2(String(Math.round(((o.y2 ?? config.y2)) * 100)))
    setY3(String(Math.round(((o.y3plus ?? config.y3plus)) * 100)))
    setRes(String(Math.round(((o.residual ?? config.residual)) * 100)))
  }, [config, data, ovOpen])

  if (isLoading || !data) return <Spinner />
  const { summary, ledger } = data

  const saveOverride = async () => {
    await setOverride.mutateAsync({ userId: id!, override: { y1: (+y1 || 0) / 100, y2: (+y2 || 0) / 100, y3plus: (+y3 || 0) / 100, residual: (+res || 0) / 100 } })
    setOvOpen(false)
  }
  const clearOverride = async () => { await setOverride.mutateAsync({ userId: id!, override: null }); setOvOpen(false) }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary cursor-pointer"><ChevronLeft className="h-4 w-4" /> Back</button>

      <div className="flex items-center gap-3">
        <Avatar name={summary.name} color={summary.avatarColor} pic={summary.avatarUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h1 className="truncate text-xl font-extrabold">{summary.name}</h1>{data.override && <Badge tone="amber">override</Badge>}</div>
          <div className="font-mono text-xs text-text-muted">{data.scheduleLabel}</div>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setOvOpen(true)}><SlidersHorizontal className="h-4 w-4" /> Override</Btn>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Lifetime earned" value={money(summary.lifetimeEarned)} tone="emerald" />
        <Stat label="Available" value={money(summary.available)} tone="blue" />
        <Stat label="Direct referrals" value={String(summary.directCount)} tone="blue" />
        <Stat label="Residual sources" value={String(summary.residualCount)} tone="purple" />
      </div>

      {summary.directReferrals.length > 0 && (
        <div>
          <h2 className="mb-2 px-0.5 text-base font-extrabold">Their downline</h2>
          <div className="space-y-2">
            {summary.directReferrals.map((r) => (
              <div key={r.referral.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2.5">
                <Avatar name={r.name} color={r.avatarColor} pic={r.avatarUrl} size={34} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{r.name}</div><div className="text-[11px] text-text-muted">{tierLabel(r.tierYearNow)} · {r.subCount} sub-referral{r.subCount === 1 ? '' : 's'}</div></div>
                <div className="text-right text-sm font-extrabold tabular-nums text-accent-emerald">{money(r.directEarned + r.residualFromThem)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-1 px-0.5 text-base font-extrabold">Earnings ledger <span className="text-sm font-semibold text-text-muted">· tap to audit / reverse</span></h2>
        <div className="rounded-2xl border border-border bg-bg-card px-3 py-1">
          {ledger.length === 0 ? <p className="py-4 text-center text-sm text-text-muted">No earnings yet.</p> : ledger.map((d) => <LedgerRow key={d.id} d={d} onClick={() => setAudit(d)} />)}
        </div>
      </div>

      {/* Override editor */}
      <Sheet open={ovOpen} onClose={() => setOvOpen(false)} title={`Rate override · ${summary.name}`}>
        <p className="mb-3 text-xs text-text-muted">Overrides apply to this player's <strong>new</strong> referrals. Existing relationships keep the rate locked at activation.</p>
        <div className="grid grid-cols-2 gap-3">
          {[['Year 1 %', y1, setY1], ['Year 2 %', y2, setY2], ['Year 3+ %', y3, setY3], ['Residual %', res, setRes]].map(([label, val, set]) => (
            <label key={label as string} className="block">
              <span className="mb-1 block text-xs font-semibold text-text-secondary">{label as string}</span>
              <input inputMode="numeric" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-sm font-bold" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Btn className="flex-1" onClick={saveOverride} loading={setOverride.isPending}>Save override</Btn>
          <Btn variant="secondary" onClick={clearOverride}>Reset to default</Btn>
        </div>
      </Sheet>

      {/* Purchase audit + reverse */}
      <Sheet open={!!audit} onClose={() => setAudit(null)} title="Purchase audit">
        {audit && (
          <div className="space-y-2.5 text-sm">
            <Row k="Beneficiary" v={summary.name} />
            <Row k="Source purchase" v={`${audit.sourceName} · ${money(audit.grossUsd)}`} />
            <Row k="Type" v={<LevelBadge level={audit.level} />} />
            <Row k="Tier / rate" v={audit.level === 'direct' ? `${tierLabel(audit.tierYear)} · ${pct(audit.rate)}` : `${pct(audit.rate)} residual`} />
            <Row k="Date" v={fmtDate(audit.purchaseDate)} />
            <Row k="Payout" v={<span className="font-extrabold text-accent-emerald">+{money(audit.amountUsd)}</span>} />
            <Row k="Status" v={audit.purchaseStatus === 'refunded' ? <Badge tone="red">Refunded</Badge> : <Badge tone="green">Paid</Badge>} />
            {audit.purchaseStatus === 'paid' ? (
              <Btn variant="danger" className="mt-2 w-full" loading={reverse.isPending} onClick={async () => { await reverse.mutateAsync(audit.purchaseId); setAudit(null) }}><Undo2 className="h-4 w-4" /> Reverse (refund) — claw back all earnings</Btn>
            ) : (
              <div className="mt-2 rounded-lg bg-accent-red/10 px-3 py-2 text-xs font-semibold text-accent-red">This purchase was refunded — every earning it generated has been clawed back.</div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>
}
