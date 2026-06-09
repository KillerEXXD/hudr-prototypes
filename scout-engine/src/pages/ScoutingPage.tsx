import { useParams } from 'react-router-dom'
import { Brain, Target, ClipboardList, Activity, MapPin, BarChart3, ShieldCheck, Quote } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { getProfile } from '@/engine'
import type { StatKey } from '@/engine'
import { PLAYERS, PLAYER_DIMENSIONS } from '@/data'
import RadarChart from '@/components/charts/RadarChart'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import ConfidenceMeter from '@/components/common/ConfidenceMeter'
import ExploitCard from '@/components/scout/ExploitCard'
import StatList from '@/components/scout/StatList'
import BoundaryTrace from '@/components/scout/BoundaryTrace'
import PositionalOpens from '@/components/scout/PositionalOpens'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const PLAIN_KEY_STATS: StatKey[] = ['vpip', 'pfr', 'steal', 'foldToCbetFlop', 'wtsd']

function Section({ icon, title, sub, children, className }: { icon: ReactNode; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-4', className)}>
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
  const { isPro } = useMode()
  const profile = getProfile(id)
  const player = PLAYERS.find((p) => p.id === id)
  const dims = PLAYER_DIMENSIONS[id]

  if (!profile || !player) return <div className="py-10 text-center text-text-muted">Player not found.</div>

  const { narrative, typing, exploits } = profile

  return (
    <div className="animate-fade-up">
      {/* ---- Header / nickname ---- */}
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
        <p className="mt-3 text-sm leading-snug text-text-secondary">{narrative.summary}</p>
      </div>

      {typing.archetype === 'UNCLASSIFIED' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-3">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary">
            {typing.confidence >= 0.5
              ? (isPro
                ? 'Enough RELIABLE inputs, but no archetype boundary matched — profiling by individual leaks rather than forcing a label.'
                : 'This player doesn’t fit one of the usual styles — so we’re reading them by their individual habits below.')
              : (isPro
                ? 'Too few RELIABLE typing inputs to assign an archetype — sample still thin.'
                : 'We don’t have enough hands to label this player’s style yet. Treat the notes below as early hints.')}
          </p>
        </div>
      )}

      {/* ---- Layer 2: How they play ---- */}
      <Section icon={<Brain className="h-4 w-4" />} title={isPro ? 'Player type' : 'How they play'}>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <p className="text-sm leading-relaxed text-text-primary">{isPro ? narrative.proSummary : narrative.typePlain}</p>
          <div className="mt-4 flex justify-center">
            <RadarChart dimensions={dims} color={player.color} size={200} />
          </div>
          {isPro && (
            <div className="mt-3 border-t border-border pt-3">
              <BoundaryTrace typing={typing} />
            </div>
          )}
        </div>
      </Section>

      {/* ---- Layer 3: How to beat them ---- */}
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
                ? 'No leak crosses an exploit threshold at RELIABLE tier. This is a tough, well-rounded opponent — default to a balanced, value-leaning line.'
                : 'This player doesn’t give away easy chips. Play solid, value-bet your strong hands, and don’t get fancy.'}
            </p>
          </div>
        )}
      </Section>

      {/* ---- Layer 4: Game plan ---- */}
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

      {/* ---- Stats (dual density) ---- */}
      <Section icon={<BarChart3 className="h-4 w-4" />} title={isPro ? 'Full stat profile' : 'Key tendencies'} sub={isPro ? `${profile.totalHands} hands · tiers gate every read` : undefined}>
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
        Prototype · stats, typing &amp; exploits are computed deterministically; the report is narrated from that structured profile.
      </p>
    </div>
  )
}
