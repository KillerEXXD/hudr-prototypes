import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Brain, Target, BarChart3, ShieldCheck, Activity, Loader2,
  SlidersHorizontal, ChevronUp, ChevronDown,
} from 'lucide-react'
import { usePlayer, usePlayerProfile } from '@/hooks'
import { buildSharpExtras } from '@/engine'
import type { StatFilters, TableSizeBucket, DepthBucket } from '@/engine'
import ExploitCard from '@/components/scout/ExploitCard'
import StatHandsExplorer from '@/components/scout/StatHandsExplorer'
import { TldrCard, BetSizingSection, PositionRangesSection, ShowdownSection } from '@/components/scout/SharpSections'
import BoundaryTrace from '@/components/scout/BoundaryTrace'
import ScopeFilters from '@/components/scout/ScopeFilters'
import PlayerChatSheet from '@/components/scout/PlayerChatSheet'
import PlayerTournaments from '@/components/scout/PlayerTournaments'

function Section({ icon, title, sub, children }: { icon: ReactNode; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-accent-blue">{icon}</span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {sub && <p className="mb-2 -mt-1 text-xs text-text-muted">{sub}</p>}
      {children}
    </section>
  )
}

export default function ScoutingPage() {
  const { id = '' } = useParams()
  const [search] = useSearchParams()
  const tournamentId = search.get('t')
  const tsParam = search.get('ts')
  const dpParam = search.get('depth')
  const fromEvent = !!tournamentId

  const [filters, setFilters] = useState<StatFilters>({
    // Default to the full (career) sample — even from a tournament — so the READ
    // is trustworthy instead of a thin/empty single-event slice. The hands drill
    // still scopes to this event via tournamentId, and "This event" stays
    // selectable for event-only stats.
    scope: 'career',
    tournamentId: tournamentId ?? null,
    tableSize: (['short', 'full'].includes(tsParam ?? '') ? tsParam : 'all') as TableSizeBucket,
    depth: (['short', 'mid', 'deep'].includes(dpParam ?? '') ? dpParam : 'all') as DepthBucket,
  })

  const [chatOpen, setChatOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)
  const [showScopeChip, setShowScopeChip] = useState(false)
  const { data: player } = usePlayer(id)
  const { data: profile, isLoading } = usePlayerProfile(id, filters)

  // Show a sticky scope summary once the filters scroll up under the header.
  useEffect(() => {
    const el = filtersRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setShowScopeChip(entry.boundingClientRect.bottom <= 56),
      { rootMargin: '-56px 0px 0px 0px', threshold: [0, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [profile])

  if (isLoading || !profile || !player) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Building scouting report…
      </div>
    )
  }

  const { typing, exploits } = profile
  const extras = buildSharpExtras(profile)
  const reliableCount = profile.stats.filter((s) => s.tier === 'RELIABLE').length
  const thin = reliableCount < 3
  const scopeLabel = filters.scope === 'event' ? 'This event' : 'Career'
  const scopeText = [
    scopeLabel,
    filters.tableSize === 'short' ? 'Short ≤4' : filters.tableSize === 'full' ? 'Full ≥5' : null,
    filters.depth === 'short' ? '<15bb' : filters.depth === 'mid' ? '15–40' : filters.depth === 'deep' ? '40+' : null,
  ].filter(Boolean).join(' · ')
  const first = player.name.split(' ')[0]
  const strengthLine = profile.strengths.slice(0, 3).map((s) => s.title).join(' · ')
  const eventHands = fromEvent && filters.scope === 'career'

  return (
    <div className="animate-fade-up">
      {/* ---- Identity + 5-second read (merged header) ---- */}
      <TldrCard profile={profile} player={player} scopeLabel={scopeLabel} onAskAI={() => setChatOpen(true)} />

      {/* ---- Filters ---- */}
      <div ref={filtersRef} className="mt-3">
        <ScopeFilters filters={filters} onChange={setFilters} eventAvailable={!!tournamentId} />
      </div>

      {eventHands && (
        <p className="mt-2 text-[11px] leading-snug text-text-muted">
          Showing the <span className="font-semibold text-text-secondary">career</span> read (reliable); the hands drill below is scoped to this event. Switch to <span className="font-semibold text-text-secondary">This event</span> above for event-only stats.
        </p>
      )}

      {thin && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-3">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary">
            Only {reliableCount}/{profile.stats.length} stats are RELIABLE at this filter — most reads are TENTATIVE or NOISE.
            Widen the scope to Career for a trustworthy read; treat everything below as directional until then.
          </p>
        </div>
      )}

      {/* ---- Exploits (the lead) ---- */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Exploits (ranked by severity)"
        sub="Only RELIABLE-tier leaks fire. Each pairs a counter with a confirmation stat and a real hand."
      >
        {exploits.length > 0 ? (
          <div className="space-y-3">
            {exploits.slice(0, 5).map((e, i) => <ExploitCard key={e.leakId} exploit={e} rank={i + 1} plain={false} />)}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
            <p className="text-sm leading-snug text-text-secondary">
              No leak crosses an exploit threshold at RELIABLE tier under this filter. Either a tough opponent or too thin a sample — widen the scope to confirm.
            </p>
          </div>
        )}
        {strengthLine && (
          <p className="mt-2 flex items-start gap-1.5 px-1 text-[11px] leading-snug text-text-muted">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-accent-emerald" />
            <span><span className="font-medium text-text-secondary">Solid at:</span> {strengthLine} — don’t spew into these.</span>
          </p>
        )}
      </Section>

      {/* ---- Full stat profile + evidence drill (promoted) ---- */}
      <Section
        icon={<BarChart3 className="h-4 w-4" />}
        title="Full stat profile"
        sub={`${profile.totalHands} hands · ${scopeLabel} · tap a stat to see ${eventHands ? "this event's" : 'the'} hands behind it`}
      >
        <StatHandsExplorer stats={profile.stats} playerId={id} tournamentId={filters.tournamentId} first={first} />
      </Section>

      {/* ---- Tournaments in DB (hands per tournament) ---- */}
      <div className="mt-4">
        <PlayerTournaments playerId={id} firstName={first} />
      </div>

      {/* ---- Deeper reads (estimated + typing detail) behind a toggle ---- */}
      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-surface cursor-pointer"
      >
        {showMore ? 'Hide' : 'Show'} deeper reads
        <span className="text-[11px] font-normal text-text-muted">type · sizing · positions · showdown</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
      </button>

      {showMore && (
        <div className="animate-fade-up">
          <Section icon={<Brain className="h-4 w-4" />} title="Why this type" sub="The explicit boundary the archetype matched (or didn’t).">
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <BoundaryTrace typing={typing} />
            </div>
          </Section>

          <BetSizingSection sizing={extras.sizing} />
          <PositionRangesSection positions={extras.positions} />
          <ShowdownSection showdown={extras.showdown} />
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Prototype · stats are sample-gated; exploits are computed deterministically. Sizing / positions / showdown are <span className="text-accent-amber">estimated</span> until real measured data is wired in.
      </p>

      <PlayerChatSheet open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />

      {/* Sticky scope summary — pinned under the header so you always know the active scope */}
      {showScopeChip && createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-[52px] z-20 mx-auto flex max-w-md justify-center px-4">
          <button
            type="button"
            onClick={() => filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-bg-card/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur cursor-pointer"
            aria-label="Active scope — tap to change the filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
            <span className="text-text-primary"><span className="font-semibold">{scopeText}</span> · <span className="nums text-text-muted">{profile.totalHands}</span> <span className="text-text-muted">hands</span></span>
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}
