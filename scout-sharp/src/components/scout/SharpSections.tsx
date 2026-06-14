import { Zap, Ruler, MapPin, Eye, FlaskConical, Sparkles, ArrowRight } from 'lucide-react'
import type { PlayerProfile, SizingRead, PositionRange, ShowdownRead } from '@/engine'
import type { Player } from '@/lib/api/domain'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import ConfidenceMeter from '@/components/common/ConfidenceMeter'
import { cn } from '@/lib/utils'

// =====================================================================
// Scout Sharp report sections: the 5-second TL;DR read + three poker-depth
// sections (bet-sizing, position-resolved ranges, showdown ranges).
//
// IMPORTANT: these three are ESTIMATED — derived from related frequency stats,
// NOT measured from real bet sizes / per-seat counts / shown hands. They are
// marked "Estimated" and deliberately do NOT wear the Reliable/n= badge the
// real stats use. When real data lands they become measured (see sharpExtras).
// =====================================================================

const sevLabel = (s: number) => (s >= 70 ? 'High value' : s >= 55 ? 'Solid edge' : 'Minor edge')
const sevCls = (s: number) => (s >= 70 ? 'text-sev-critical' : s >= 55 ? 'text-sev-moderate' : 'text-sev-minor')

/** Honest marker for a derived read — never impersonates a measured stat. */
function EstimatedPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-amber"
      title="Estimated from related stats — not measured directly. Uses real data when available."
    >
      <FlaskConical className="h-3 w-3" /> Estimated
    </span>
  )
}

/** Merged identity + 5-second read: avatar/name, type · sample, top 3 leaks,
 *  one-line bottom read, and the single Ask-AI launcher. This is the whole header. */
export function TldrCard({ profile, player, scopeLabel, onAskAI }: {
  profile: PlayerProfile; player: Player; scopeLabel: string; onAskAI: () => void
}) {
  const { typing, exploits, narrative } = profile
  const unclassified = typing.archetype === 'UNCLASSIFIED'
  const top = exploits.slice(0, 3)
  const first = player.name.split(' ')[0]
  return (
    <div className="rounded-2xl border border-accent-blue/30 bg-gradient-to-br from-accent-blue/[0.08] to-bg-surface p-4">
      {/* identity */}
      <div className="flex items-start gap-3">
        <PlayerAvatar initials={player.initials} color={player.color} photoUrl={player.photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-bold leading-tight">{player.name}</h1>
              <span aria-hidden>{player.flag}</span>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-bg-surface/70 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              <span className="nums font-semibold">{profile.totalHands}</span> · {scopeLabel}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ArchetypeBadge archetype={typing.archetype} size="md" />
            <ConfidenceMeter value={typing.confidence} unclassified={unclassified} />
          </div>
        </div>
      </div>
      {unclassified && (
        <p className="mt-2 text-[11px] leading-snug text-text-muted">Enough hands to read, but the style doesn’t fit a clean archetype box — profile by the individual leaks below.</p>
      )}

      {/* top leaks */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-blue">
        <Zap className="h-3.5 w-3.5" /> 5-second read
      </div>
      {top.length > 0 ? (
        <ol className="mt-1.5 space-y-1.5">
          {top.map((e, i) => (
            <li key={e.leakId} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[11px] font-bold text-accent-blue nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-text-primary">{e.title}</span>
              <span className={cn('shrink-0 text-[10px] font-semibold', sevCls(e.severity))}>{sevLabel(e.severity)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1.5 text-sm leading-snug text-text-secondary">
          No leak crosses an exploit threshold at a reliable sample under this filter — either a tough opponent or too thin a slice. Widen the scope to confirm.
        </p>
      )}

      <p className="mt-3 border-t border-accent-blue/15 pt-2.5 text-xs leading-snug text-text-secondary">{narrative.summary}</p>

      <button
        type="button"
        onClick={onAskAI}
        className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-3 py-2.5 text-sm font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20 cursor-pointer"
      >
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-blue/20">
          <Sparkles className="h-4 w-4" />
          <span className="skin-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-blue ring-2 ring-bg-card" />
        </span>
        Ask AI about {first}
        <ArrowRight className="ml-auto h-4 w-4" />
      </button>
    </div>
  )
}

function SectionHead({ icon, title, sub, estimated }: { icon: React.ReactNode; title: string; sub?: string; estimated?: boolean }) {
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-accent-blue">{icon}</span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {estimated && <EstimatedPill />}
      </div>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

/** Bet-sizing tendencies by street — ESTIMATED from c-bet/barrel frequency. */
export function BetSizingSection({ sizing }: { sizing: SizingRead[] }) {
  if (!sizing.length) return null
  return (
    <section className="mt-4">
      <SectionHead icon={<Ruler className="h-4 w-4" />} title="Bet-sizing tendencies" estimated sub="Inferred from c-bet / barrel frequency — a stand-in until real bet sizes are wired in. Not a measured sizing read." />
      <div className="space-y-2">
        {sizing.map((r) => (
          <div key={r.street} className="rounded-xl border border-border bg-bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-primary">{r.street}</span>
              <span className="rounded-full bg-accent-amber/10 px-2 py-0.5 text-[11px] font-semibold text-accent-amber">{r.sizing}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-surface">
                <div className="h-full rounded-full bg-accent-amber/70" style={{ width: `${Math.max(3, Math.min(100, r.freq))}%` }} />
              </div>
              <span className="nums text-[10px] text-text-muted">{Math.round(r.freq)}% fire</span>
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
      <SectionHead icon={<MapPin className="h-4 w-4" />} title="Position-resolved ranges" estimated sub="Open scaled from PFR by seat; 3-bet modeled — illustrative until real per-seat counts land. Not measured per-seat data." />
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
      <SectionHead icon={<Eye className="h-4 w-4" />} title="Showdown range" estimated sub="What they tend to show up with at the river — composition estimated from showdown frequency & win-rate, not actual holdings." />
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
