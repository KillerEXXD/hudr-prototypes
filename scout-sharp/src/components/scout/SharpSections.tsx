import { Zap, Ruler, MapPin, Eye } from 'lucide-react'
import type { PlayerProfile, SizingRead, PositionRange, ShowdownRead } from '@/engine'
import TierBadge from '@/components/common/TierBadge'
import { cn } from '@/lib/utils'

// =====================================================================
// Scout Sharp report sections: the 5-second TL;DR read + three new
// poker-depth sections (bet-sizing, position-resolved ranges, showdown
// ranges). Each derived read carries the sample tier it was built from.
// =====================================================================

const sevLabel = (s: number) => (s >= 70 ? 'High value' : s >= 55 ? 'Solid edge' : 'Minor edge')
const sevCls = (s: number) => (s >= 70 ? 'text-sev-critical' : s >= 55 ? 'text-sev-moderate' : 'text-sev-minor')

/** Above-the-fold 5-second read: type · confidence · sample · top 3 exploits. */
export function TldrCard({ profile, scopeLabel }: { profile: PlayerProfile; scopeLabel: string }) {
  const { typing, exploits, narrative } = profile
  const unclassified = typing.archetype === 'UNCLASSIFIED'
  const conf = Math.round(typing.confidence * 100)
  const top = exploits.slice(0, 3)
  return (
    <div className="mt-3 rounded-2xl border border-accent-blue/30 bg-accent-blue/[0.07] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-blue">
          <Zap className="h-3.5 w-3.5" /> 5-second read
        </span>
        <span className="rounded-full border border-border bg-bg-surface/70 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
          <span className="nums font-semibold">{profile.totalHands}</span> hands · {scopeLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <h2 className={cn('text-lg font-bold leading-tight', unclassified ? 'text-text-muted' : 'text-text-primary')}>
          {unclassified ? 'Unclassified' : typing.archetype}
        </h2>
        <span className="nums text-xs font-semibold text-text-secondary">{conf}% {unclassified ? 'sample' : 'confidence'}</span>
      </div>
      {unclassified && (
        <p className="mt-0.5 text-[11px] leading-snug text-text-muted">Enough hands to read, but the style doesn’t fit a clean archetype box — profile by the individual leaks below.</p>
      )}

      {top.length > 0 ? (
        <ol className="mt-2.5 space-y-1.5">
          {top.map((e, i) => (
            <li key={e.leakId} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[11px] font-bold text-accent-blue nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-text-primary">{e.title}</span>
              <span className={cn('shrink-0 text-[10px] font-semibold', sevCls(e.severity))}>{sevLabel(e.severity)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2.5 text-sm leading-snug text-text-secondary">
          No leak crosses an exploit threshold at a reliable sample under this filter — either a tough opponent or too thin a slice. Widen the scope to confirm.
        </p>
      )}

      <p className="mt-3 border-t border-accent-blue/15 pt-2.5 text-xs leading-snug text-text-secondary">{narrative.summary}</p>
    </div>
  )
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <span className="text-accent-blue">{icon}</span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

/** Bet-sizing tendencies by street. */
export function BetSizingSection({ sizing }: { sizing: SizingRead[] }) {
  if (!sizing.length) return null
  return (
    <section className="mt-4">
      <SectionHead icon={<Ruler className="h-4 w-4" />} title="Bet-sizing tendencies" sub="How big they bet, by street — and how to play it." />
      <div className="space-y-2">
        {sizing.map((r) => (
          <div key={r.street} className="rounded-xl border border-border bg-bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-primary">{r.street}</span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-[11px] font-semibold text-accent-blue">{r.sizing}</span>
                <TierBadge tier={r.tier} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-surface">
                <div className={cn('h-full rounded-full', r.tier === 'NOISE' ? 'bg-tier-noise/50' : 'bg-accent-blue')} style={{ width: `${Math.max(3, Math.min(100, r.freq))}%` }} />
              </div>
              <span className="nums text-[10px] text-text-muted">{Math.round(r.freq)}% · n={r.opportunities}</span>
            </div>
            <p className="mt-2 text-xs leading-snug text-text-secondary">{r.read}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const tierDot = (t: string) => t === 'RELIABLE' ? 'bg-tier-reliable' : t === 'TENTATIVE' ? 'bg-tier-tentative' : 'bg-text-muted'

/** Position-resolved ranges: open% + 3-bet% by seat, each sample-gated. */
export function PositionRangesSection({ positions }: { positions: PositionRange[] }) {
  if (!positions.length) return null
  return (
    <section className="mt-4">
      <SectionHead icon={<MapPin className="h-4 w-4" />} title="Position-resolved ranges" sub="Open-raise & 3-bet frequency by seat. Per-seat samples are small — most reads are tentative." />
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface/60 text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-semibold">Seat</th>
              <th className="px-2 py-2 text-right font-semibold">Open</th>
              <th className="px-2 py-2 text-right font-semibold">3-Bet</th>
              <th className="px-3 py-2 text-right font-semibold">Sample</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.position} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2 font-semibold text-text-primary">{p.position}</td>
                <td className="nums px-2 py-2 text-right text-text-primary">{p.open}%</td>
                <td className="nums px-2 py-2 text-right text-text-secondary">{p.threeBet}%</td>
                <td className="px-3 py-2">
                  <span className="flex items-center justify-end gap-1.5 text-[11px] text-text-muted">
                    <span className="nums">n={p.opportunities}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', tierDot(p.tier))} title={p.tier} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const bandTone = (t: string) => t === 'value' ? 'bg-accent-emerald' : t === 'medium' ? 'bg-accent-blue' : 'bg-accent-amber'

/** Showdown ranges — what they show up with, from WTSD + W$SD. */
export function ShowdownSection({ showdown }: { showdown: ShowdownRead }) {
  return (
    <section className="mt-4">
      <SectionHead icon={<Eye className="h-4 w-4" />} title="Showdown range" sub="What they tend to show up with at the river." />
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="nums text-lg font-bold text-text-primary">{showdown.reachPct}%</span>
            <span className="text-[11px] text-text-muted">go to showdown</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-baseline gap-1">
            <span className="nums text-lg font-bold text-text-primary">{showdown.winPct}%</span>
            <span className="text-[11px] text-text-muted">win there</span>
          </div>
          <TierBadge tier={showdown.tier} className="ml-auto" />
        </div>

        <div className="mt-3 space-y-2">
          {showdown.bands.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-text-secondary">{b.label}</span>
                <span className="nums font-semibold text-text-primary">{b.pct}%</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-bg-surface">
                <div className={cn('h-full rounded-full', bandTone(b.tone))} style={{ width: `${Math.max(2, b.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-lg bg-accent-blue/5 p-2.5 text-xs leading-snug text-text-primary">{showdown.summary}</p>
        <p className="mt-1.5 text-[10px] leading-snug text-text-muted">Estimated composition, modeled from showdown frequency &amp; win-rate — directional, not exact holdings.</p>
      </div>
    </section>
  )
}
