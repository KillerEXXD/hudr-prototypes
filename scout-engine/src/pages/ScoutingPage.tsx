import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Brain, Target, ClipboardList, Activity, MapPin, BarChart3, ShieldCheck, Quote,
  Crosshair, Gauge, Loader2, Database,
} from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { usePlayer, usePlayerProfile } from '@/hooks'
import type { StatFilters, StatKey } from '@/engine'
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
  const tournamentId = search.get('t')

  const [filters, setFilters] = useState<StatFilters>({
    scope: tournamentId ? 'event' : 'career',
    tournamentId: tournamentId ?? null,
    tableSize: 'all',
    depth: 'all',
  })

  const { data: player } = usePlayer(id)
  const { data: profile, isLoading } = usePlayerProfile(id, filters)
  const dims = PLAYER_DIMENSIONS[id]

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

  return (
    <div className="animate-fade-up">
      {/* ---- Header ---- */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <div className="flex items-start gap-3">
          <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold leading-tight">{player.name}</h1>
              <span aria-hidden>{player.flag}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-accent-amber">
              <Quote className="h-3 w-3" />
              <span className="text-sm font-semibold italic">{narrative.nickname}</span>
            </div>
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
      </div>

      {/* ---- Filters ---- */}
      <div className="mt-3">
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

      {/* ---- Layer 4: game plan ---- */}
      <Section icon={<ClipboardList className="h-4 w-4" />} title="Game plan" sub={isPro ? 'Three things to do at the table.' : 'Your simple three-step plan.'}>
        <ol className="space-y-2">
          {(isPro ? narrative.gamePlanPro : narrative.gamePlanPlain).map((g, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-bg-card p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-xs font-bold text-accent-blue nums">{i + 1}</span>
              <span className="text-sm leading-snug text-text-primary">{g}</span>
            </li>
          ))}
        </ol>
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
    </div>
  )
}
