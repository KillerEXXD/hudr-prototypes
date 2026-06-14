import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Brain, Target, ClipboardList, Activity, MapPin, BarChart3, ShieldCheck, Quote,
  Crosshair, Gauge, Loader2, Database, Award, Sparkles, ArrowRight, SlidersHorizontal, ChevronUp,
} from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePlayer, usePlayerProfile } from '@/hooks'
import type { StatFilters, StatKey, TableSizeBucket, DepthBucket } from '@/engine'
import { PLAYER_DIMENSIONS } from '@/data'
import RadarChart from '@/components/charts/RadarChart'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import ConfidenceMeter from '@/components/common/ConfidenceMeter'
import ExploitCard from '@/components/scout/ExploitCard'
import StatList from '@/components/scout/StatList'
import BoundaryTrace from '@/components/scout/BoundaryTrace'
import PositionalOpens from '@/components/scout/PositionalOpens'
import ScopeFilters from '@/components/scout/ScopeFilters'
import PlayerChatSheet from '@/components/scout/PlayerChatSheet'
import Strengths from '@/components/scout/Strengths'
import PlayerTournaments from '@/components/scout/PlayerTournaments'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const PLAIN_KEY_STATS: StatKey[] = ['vpip', 'pfr', 'steal', 'foldToCbetFlop', 'wtsd']

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

function ScoreChip({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5', tone)}>
      {icon}
      <div className="leading-tight">
        <div className="nums text-base font-bold">{value}</div>
        <div className="text-[9px] uppercase tracking-wide opacity-80">{label}</div>
      </div>
    </div>
  )
}

const exploitTone = (n: number) => n >= 70 ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
  : n >= 50 ? 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
  : n > 0 ? 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue'
  : 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald'

const gradeTone = (g: string) => /A/.test(g) ? 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald'
  : /B/.test(g) ? 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue'
  : /C/.test(g) ? 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
  : g === '—' ? 'border-border bg-bg-surface text-text-muted'
  : 'border-accent-red/30 bg-accent-red/10 text-accent-red'

export default function ScoutingPage() {
  const { id = '' } = useParams()
  const [search] = useSearchParams()
  const { isPro } = useMode()
  const { flags } = useTheme()
  const tournamentId = search.get('t')
  const tsParam = search.get('ts')
  const dpParam = search.get('depth')

  const [filters, setFilters] = useState<StatFilters>({
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
  const dims = PLAYER_DIMENSIONS[id]

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
  const reliableCount = profile.stats.filter((s) => s.tier === 'RELIABLE').length
  const thin = reliableCount < 3
  const scopeLabel = filters.scope === 'event' ? 'This event' : 'Career'
  const scopeText = [
    scopeLabel,
    filters.tableSize === 'short' ? 'Short ≤4' : filters.tableSize === 'full' ? 'Full ≥5' : null,
    filters.depth === 'short' ? '<15bb' : filters.depth === 'mid' ? '15–40' : filters.depth === 'deep' ? '40+' : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="animate-fade-up">
      {/* ---- Header ---- */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <div className="flex items-start gap-3">
          <PlayerAvatar initials={player.initials} color={player.color} photoUrl={player.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold leading-tight">{player.name}</h1>
              <span aria-hidden>{player.flag}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-accent-amber">
              <Quote className="h-3 w-3 shrink-0" />
              <span
                className={cn('font-semibold italic', flags.serifHeadline ? 'text-xl not-italic' : 'text-sm')}
                style={flags.serifHeadline ? { fontFamily: 'var(--font-family-display)' } : undefined}
              >
                {narrative.nickname}
              </span>
            </div>
            {flags.goldRule && <div className="mt-2 h-px w-full bg-accent-amber/50" />}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ArchetypeBadge archetype={typing.archetype} plain={!isPro} size="md" />
              <ConfidenceMeter value={typing.confidence} plain={!isPro} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ScoreChip icon={<Crosshair className="h-4 w-4" />} label="Exploitability" value={`${profile.exploitability}`} tone={exploitTone(profile.exploitability)} />
          <ScoreChip icon={<Gauge className="h-4 w-4" />} label="Skill" value={profile.skill.grade} tone={gradeTone(profile.skill.grade)} />
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-bg-surface/60 px-2.5 py-1.5 text-[11px] text-text-secondary">
            <Database className="h-3.5 w-3.5 text-text-muted" />
            <span className="nums font-semibold">{profile.totalHands}</span> hands · {scopeLabel}
          </div>
        </div>

        <p className="mt-3 text-sm leading-snug text-text-secondary">{narrative.summary}</p>

        {/* Ask-AI launcher — opens the full-screen chat */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-3 py-2.5 text-sm font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20 cursor-pointer"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-blue/20">
            <Sparkles className="h-4 w-4" />
            <span className="skin-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-blue ring-2 ring-bg-card" />
          </span>
          Ask AI about {player.name.split(' ')[0]}
          <ArrowRight className="ml-auto h-4 w-4" />
        </button>
      </div>

      {/* ---- Tournaments in DB (hands per tournament) ---- */}
      <div className="mt-3">
        <PlayerTournaments playerId={id} firstName={player.name.split(' ')[0]} />
      </div>

      {/* ---- Filters ---- */}
      <div ref={filtersRef} className="mt-3">
        <ScopeFilters filters={filters} onChange={setFilters} eventAvailable={!!tournamentId} />
      </div>

      {thin && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-3">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary">
            {isPro
              ? `Only ${reliableCount}/${profile.stats.length} stats are RELIABLE at this filter — most reads are TENTATIVE/NOISE. Widen the scope to Career for a trustworthy read.`
              : 'This is a small slice of hands, so treat the reads below as early hints. Switch Scope to “Career” for a stronger read.'}
          </p>
        </div>
      )}

      {/* ---- Layer 2: typing ---- */}
      <Section icon={<Brain className="h-4 w-4" />} title={isPro ? 'Player type' : 'How they play'}>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <p className="text-sm leading-relaxed text-text-primary">{isPro ? narrative.proSummary : narrative.typePlain}</p>
          {dims && (
            <div className="mt-4 flex justify-center">
              <RadarChart dimensions={dims} color={player.color} size={200} />
            </div>
          )}
          {isPro && (
            <div className="mt-3 border-t border-border pt-3">
              <BoundaryTrace typing={typing} />
            </div>
          )}
        </div>
      </Section>

      {/* ---- Layer 3: exploits ---- */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title={isPro ? 'Exploits (ranked by severity)' : 'How to beat them'}
        sub={isPro ? 'Only RELIABLE-tier leaks fire. Each pairs a counter with a confirmation stat.' : 'The biggest weaknesses, and exactly what to do about them.'}
      >
        {exploits.length > 0 ? (
          <div className="space-y-3">
            {exploits.slice(0, 5).map((e, i) => <ExploitCard key={e.leakId} exploit={e} rank={i + 1} plain={!isPro} />)}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
            <p className="text-sm leading-snug text-text-secondary">
              {isPro
                ? 'No leak crosses an exploit threshold at RELIABLE tier under this filter. Either a tough opponent or too thin a sample — widen the scope to confirm.'
                : 'No clear weakness shows up at this filter. Play solid, value-bet your strong hands, and don’t get fancy.'}
            </p>
          </div>
        )}
      </Section>

      {/* ---- Strengths ---- */}
      <Section icon={<Award className="h-4 w-4" />} title={isPro ? 'Strengths' : 'What they do well'}>
        <Strengths strengths={profile.strengths} />
      </Section>

      {/* ---- Layer 4: exploit plan (by phase) ---- */}
      <Section icon={<ClipboardList className="h-4 w-4" />} title={isPro ? 'Exploit plan' : 'Your game plan'} sub={isPro ? 'Actionable, by phase.' : 'What to do, by stage of the hand.'}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {([['Preflop', profile.plan.preflop], ['Postflop', profile.plan.postflop], ['ICM', profile.plan.icm]] as const).map(([label, item]) => (
            <div key={label} className="rounded-xl border border-accent-emerald/25 bg-accent-emerald/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-accent-emerald">{label}</div>
              <p className="mt-1 text-sm leading-snug text-text-primary">{isPro ? item.pro : item.plain}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Stats ---- */}
      <Section icon={<BarChart3 className="h-4 w-4" />} title={isPro ? 'Full stat profile' : 'Key tendencies'} sub={isPro ? `${profile.totalHands} hands · ${scopeLabel} · tiers gate every read` : undefined}>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-1">
          <StatList stats={isPro ? profile.stats : profile.stats.filter((s) => PLAIN_KEY_STATS.includes(s.key))} plain={!isPro} />
        </div>
      </Section>

      {/* ---- Positional ---- */}
      <Section icon={<MapPin className="h-4 w-4" />} title={isPro ? 'Open % by position' : 'Where they get aggressive'}>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <PositionalOpens data={profile.positional} plain={!isPro} />
        </div>
      </Section>

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Prototype · stats segmented by scope/table-size/depth are modeled; typing, exploits &amp; scores are computed deterministically.
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
