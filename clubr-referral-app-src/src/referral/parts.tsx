import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Avatar, Badge, Sheet } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { money, pct, fmtDate, tierLabel } from '@/lib/referralFormat'
import type { EarningDetail } from '@/types/referral'

export function Stat({ label, value, tone = 'primary', sub }: { label: string; value: string; tone?: 'primary' | 'blue' | 'emerald' | 'amber' | 'purple'; sub?: string }) {
  const col: Record<string, string> = { primary: 'text-text-primary', blue: 'text-accent-blue', emerald: 'text-accent-emerald', amber: 'text-accent-amber', purple: 'text-accent-purple' }
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</div>
      <div className={cn('mt-1 text-xl font-extrabold tabular-nums', col[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-text-muted">{sub}</div>}
    </div>
  )
}

export function LevelBadge({ level }: { level: 'direct' | 'residual' }) {
  return level === 'direct' ? <Badge tone="blue">Direct</Badge> : <Badge tone="green">Residual</Badge>
}

/** A tappable list row with an avatar, title, subtitle and a right slot. */
export function PersonRow({ name, color, pic, sub, right, onClick, badge }: { name: string; color?: string; pic?: string | null; sub?: ReactNode; right?: ReactNode; onClick?: () => void; badge?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn('flex w-full items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-left', onClick && 'transition-colors hover:bg-bg-surface cursor-pointer')}>
      <Avatar name={name} color={color} pic={pic} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold">{name}</span>{badge}</div>
        {sub && <div className="truncate text-xs text-text-muted">{sub}</div>}
      </div>
      {right}
      {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />}
    </button>
  )
}

/** One earnings ledger row (a purchase → your cut). */
export function LedgerRow({ d, onClick }: { d: EarningDetail; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn('flex w-full items-center gap-3 border-t border-border/60 px-1 py-2.5 text-left first:border-t-0', onClick && 'cursor-pointer hover:bg-bg-surface')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="truncate">{d.sourceName} bought {money(d.grossUsd)}</span>
          {d.purchaseStatus === 'refunded' && <Badge tone="red">refunded</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          <LevelBadge level={d.level} />
          <span>{d.level === 'direct' ? `${tierLabel(d.tierYear)} · ${pct(d.rate)}` : `${pct(d.rate)} residual`}</span>
          <span>· {fmtDate(d.purchaseDate)}</span>
        </div>
      </div>
      <div className={cn('shrink-0 text-sm font-extrabold tabular-nums', d.purchaseStatus === 'refunded' ? 'text-text-muted line-through' : 'text-accent-emerald')}>+{money(d.amountUsd)}</div>
    </button>
  )
}

export function EarningSheet({ open, onClose, d }: { open: boolean; onClose: () => void; d: EarningDetail | null }) {
  return (
    <Sheet open={open && !!d} onClose={onClose} title="Earning detail">
      {d && (
        <div className="space-y-2.5 text-sm">
          <Line k="Source" v={`${d.sourceName} · ${money(d.grossUsd)} purchase`} />
          <Line k="Type" v={<LevelBadge level={d.level} />} />
          <Line k="Tier" v={d.level === 'direct' ? tierLabel(d.tierYear) : 'Flat (for life)'} />
          <Line k="Rate applied" v={pct(d.rate)} />
          <Line k="Purchase date" v={fmtDate(d.purchaseDate)} />
          <Line k="Status" v={d.purchaseStatus === 'refunded' ? <Badge tone="red">Refunded · clawed back</Badge> : <Badge tone="green">Paid</Badge>} />
          <div className="mt-2 flex items-center justify-between rounded-xl bg-bg-surface px-3 py-3">
            <span className="font-bold">Your payout</span>
            <span className={cn('text-lg font-extrabold tabular-nums', d.purchaseStatus === 'refunded' ? 'text-text-muted line-through' : 'text-accent-emerald')}>+{money(d.amountUsd)}</span>
          </div>
        </div>
      )}
    </Sheet>
  )
}
function Line({ k, v }: { k: string; v: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-text-muted">{k}</span><span className="font-semibold text-right">{v}</span></div>
}

/** Compact "no cap · for life" reassurance strip. */
export function NoCapStrip() {
  return <div className="flex items-center gap-2 rounded-xl border border-accent-emerald/25 bg-accent-emerald/5 px-3 py-2 text-xs font-semibold text-accent-emerald">♾️ No cap — you keep earning for life, as your network keeps buying.</div>
}
