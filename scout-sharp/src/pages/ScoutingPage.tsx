import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Brain, Target, ClipboardList, BarChart3, ShieldCheck, Activity,
  Loader2, Award, Sparkles, ArrowRight, SlidersHorizontal, ChevronUp,
} from 'lucide-react'
import { usePlayer, usePlayerProfile } from '@/hooks'
import { buildSharpExtras } from '@/engine'
import type { StatFilters, TableSizeBucket, DepthBucket } from '@/engine'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import ConfidenceMeter from '@/components/common/ConfidenceMeter'
import ExploitCard from '@/components/scout/ExploitCard'
import StatHandsExplorer from '@/components/scout/StatHandsExplorer'
import { TldrCard, BetSizingSection, PositionRangesSection, ShowdownSection } from '@/components/scout/SharpSections'
import BoundaryTrace from '@/components/scout/BoundaryTrace'
import ScopeFilters from '@/components/scout/ScopeFilters'
import PlayerChatSheet from '@/components/scout/PlayerChatSheet'
import Strengths from '@/components/scout/Strengths'
import PlayerTournaments from '@/components/scout/PlayerTournaments'
import type { ReactNode } from 'react'

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

  const [filters, setFilters] = useState<StatFilters>({
    // Opened from a tournament (?t=) → land on THIS EVENT's stats (the user
    // clicked in from that event). Standalone (from the Players list) → career.
    // Either way the scope filter lets them switch; thin event samples surface
    // the sample-size banner honestly.
    scope: tournamentId ? 'event' : 'career',
    tournamentId: tournamentId ?? null,
    tableSize: (['short', 'full'].includes(tsParam ?? '') ? tsParam : 'all') as TableSizeBucket,
    depth: (['short', 'mid', 'deep'].includes(dpParam ?? '') ? dpParam : 'all') as DepthBucket,
  })

  const [chatOpen, setChatOpen] = useState(false)
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

  const { narrative, typing, exploits } = profile
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

  return (
    <div className="animate-fade-up">
      {/* ---- Header (slim, Pro-first: no nickname, no opaque scores) ---- */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <div className="flex items-start gap-3">
          <PlayerAvatar initials={player.initials} color={player.color} photoUrl={player.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold leading-tight">{player.name}</h1>
              <span aria-hidden>{player.flag}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ArchetypeBadge archetype={typing.archetype} size="md" />
              <ConfidenceMeter value={typing.confidence} unclassified={typing.archetype === 'UNCLASSIFIED'} />
            </div>
          </div>
        </div>

        {/* Ask-AI launcher — the single AI surface */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
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

      {/* ---- 5-second TL;DR read (above the fold) ---- */}
      <TldrCard profile={profile} scopeLabel={scopeLabel} />

      {/* ---- Tournaments in DB (hands per tournament) ---- */}
      <div className="mt-3">
        <PlayerTournaments playerId={id} firstName={first} />
      </div>

      {/* ---- Filters ---- */}
      <div ref={filtersRef} className="mt-3">
        <ScopeFilters filters={filters} onChange={setFilters} eventAvailable={!!tournamentId} />
      </div>

      {thin && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-3">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary">
            Only {reliableCount}/{profile.stats.length} stats are RELIABLE at this filter — most reads are TENTATIVE or NOISE.
            Widen the scope to Career for a trustworthy read; treat everything below as directional until then.
          </p>
        </div>
      )}

      {/* ---- Typing (no radar — boundary trace is the honest "why") ---- */}
      <Section icon={<Brain className="h-4 w-4" />} title="Player type">
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <p className="text-sm leading-relaxed text-text-primary">{narrative.proSummary}</p>
          <div className="mt-3 border-t border-border pt-3">
            <BoundaryTrace typing={typing} />
          </div>
        </div>
      </Section>

      {/* ---- Exploits ---- */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Exploits (ranked by severity)"
        sub="Only RELIABLE-tier leaks fire. Each pairs a counter with a confirmation stat."
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
      </Section>

      {/* ---- Strengths ---- */}
      <Section icon={<Award className="h-4 w-4" />} title="Strengths">
        <Strengths strengths={profile.strengths} />
      </Section>

      {/* ---- Exploit plan (by phase) ---- */}
      <Section icon={<ClipboardList className="h-4 w-4" />} title="Exploit plan" sub="Actionable, by phase.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {([['Preflop', profile.plan.preflop], ['Postflop', profile.plan.postflop], ['ICM', profile.plan.icm]] as const).map(([label, item]) => (
            <div key={label} className="rounded-xl border border-accent-emerald/25 bg-accent-emerald/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-accent-emerald">{label}</div>
              <p className="mt-1 text-sm leading-snug text-text-primary">{item.pro}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Bet-sizing tendencies (new) ---- */}
      <BetSizingSection sizing={extras.sizing} />

      {/* ---- Position-resolved ranges (new) ---- */}
      <PositionRangesSection positions={extras.positions} />

      {/* ---- Showdown range (new) ---- */}
      <ShowdownSection showdown={extras.showdown} />

      {/* ---- Stats with evidence drill (tap a stat → its hands) ---- */}
      <Section
        icon={<BarChart3 className="h-4 w-4" />}
        title="Full stat profile"
        sub={`${profile.totalHands} hands · ${scopeLabel} · tap any stat to see the hands behind it`}
      >
        <StatHandsExplorer stats={profile.stats} playerId={id} tournamentId={filters.tournamentId} first={first} />
      </Section>

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Prototype · stats segmented by scope/table-size/depth are modeled; typing, exploits &amp; derived reads are computed deterministically and gated by sample size.
      </p>

      <PlayerChatSheet open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />

      {/* Sticky scope summary — pinned under the header so you always know what the report below is showing */}
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
