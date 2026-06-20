import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useArena } from '@/hooks/arena'
import { useGrindStats } from '@/hooks/grindStats'
import { ArenaCard } from '@/components/arena/ArenaCard'
import { Avatar, EmptyState, Section, Spinner } from '@/components/common/ui'
import { TYPE_META } from '@/lib/arena/unifiedGame'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// Ledger Home (player) — STATS COCKPIT. The grinder thesis: open to your
// numbers. Net, cash rate, per-type ROI, a cumulative trend line, and your live
// games as a compact strip underneath. Dense, mono, one electric accent.
// =====================================================================

function Net({ n, size = 'lg' }: { n: number; size?: 'lg' | 'md' | 'sm' }) {
  const up = n > 0, flat = n === 0
  const cls = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-lg' : 'text-[13px]'
  return (
    <span className={cn('stat font-bold', cls, up ? 'text-accent-gold' : flat ? 'text-text-secondary' : 'text-accent-red')}>
      {up ? '+' : ''}{n.toLocaleString()}<span className="ml-1 text-[0.5em] font-normal text-text-muted">Stakes</span>
    </span>
  )
}

/** Cumulative net trend — a tiny inline SVG sparkline. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const min = Math.min(0, ...points), max = Math.max(0, ...points)
  const range = max - min || 1
  const W = 280, H = 56
  const step = W / (points.length - 1)
  const y = (v: number) => H - ((v - min) / range) * H
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const zeroY = y(0)
  const last = points[points.length - 1]
  const stroke = last >= 0 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 56 }}>
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="var(--color-border-light)" strokeWidth="1" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function LedgerHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const stats = useGrindStats()
  const arena = useArena()

  if (stats.loading) return <Spinner label="Crunching your numbers…" />

  const { totals, byType, trend, ledgerLines } = stats
  const liveAndNeeds = [...arena.live, ...arena.needsYou.filter((g) => g.phase !== 'live')]
  const hasData = totals.played > 0

  return (
    <div className="animate-fade-up space-y-1">
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Your numbers</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{user?.name.split(' ')[0]}'s ledger</h1>
        </div>
        <Avatar name={user?.name} color={user?.avatarColor} size={40} />
      </div>

      {!hasData ? (
        <div className="mt-4"><EmptyState title="No settled games yet" sub="Play a few games and your performance — net, cash rate, ROI by type — builds here." /></div>
      ) : (
        <>
          {/* Hero net + trend */}
          <div className="mt-3 rounded-lg border border-accent-gold/25 bg-bg-card p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">Net · all-time</p>
                <Net n={totals.net} />
              </div>
              <div className="text-right">
                <p className="stat text-lg font-bold text-text-primary">{Math.round(totals.cashRate * 100)}%</p>
                <p className="text-[11px] text-text-muted">cash rate</p>
              </div>
            </div>
            <div className="mt-3"><Sparkline points={trend.map((t) => t.cum)} /></div>
            <div className="mt-2 grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
              {[['Played', totals.played], ['Cashes', totals.cashes], ['Wins', totals.wins], ['Crews', totals.clubs]].map(([k, v]) => (
                <div key={k as string}>
                  <p className="stat text-base font-bold text-text-primary">{v}</p>
                  <p className="text-[10px] text-text-muted">{k}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-type ROI table */}
          <Section title="By game type">
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-bg-surface px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <span>Type</span><span className="text-right">Played</span><span className="text-right">Cash%</span><span className="text-right">Net</span>
              </div>
              {byType.map((t, i) => (
                <div key={t.type} className={cn('grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-2.5', i > 0 && 'border-t border-border')}>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                    <span className={cn(t.type === 'ft' ? 'text-accent-purple' : t.type === 'll' ? 'text-accent-amber' : 'text-accent-emerald')}>{TYPE_META[t.type].glyph}</span>
                    {t.label}
                  </span>
                  <span className="stat text-right text-[13px] text-text-secondary">{t.played}</span>
                  <span className="stat text-right text-[13px] text-text-secondary">{Math.round(t.cashRate * 100)}%</span>
                  <span className="text-right"><Net n={t.net} size="sm" /></span>
                </div>
              ))}
            </div>
          </Section>

          {/* Per-crew standings (compact) */}
          {ledgerLines.length > 0 && (
            <Section title="By crew" action={<button onClick={() => navigate('/ledger')} className="font-mono text-[11px] font-semibold text-accent-gold">Detail →</button>}>
              <div className="overflow-hidden rounded-lg border border-border">
                {ledgerLines.map((l, i) => (
                  <button key={l.clubId} onClick={() => navigate(`/club/${l.clubId}`)}
                    className={cn('grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 px-3 py-2.5 text-left hover:bg-bg-surface', i > 0 && 'border-t border-border')}>
                    <span className="text-base">{l.clubEmoji}</span>
                    <span className="truncate text-[13px] font-semibold text-text-primary">{l.clubName}</span>
                    <span className="stat text-[12px] text-text-muted">{l.wins}W/{l.cashes}C/{l.played}</span>
                    <span className="text-right"><Net n={l.net} size="sm" /></span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Live / needs-you as a compact strip — the action, secondary to the numbers */}
      {liveAndNeeds.length > 0 && (
        <Section title="Active now" action={<button onClick={() => navigate('/games')} className="font-mono text-[11px] font-semibold text-accent-gold">All →</button>}>
          <div className="space-y-2">
            {liveAndNeeds.slice(0, 3).map((g) => <ArenaCard key={g.id} g={g} />)}
          </div>
        </Section>
      )}
      <div className="h-2" />
    </div>
  )
}
