import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trophy, Users, ChevronRight, Radio, Layers, Target, Brain, Loader2 } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useTournaments, usePlayers, useProfiles, careerFilters } from '@/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import { cn, fmtChips } from '@/lib/utils'

function PipelineStrip() {
  const steps = [
    { icon: Layers, label: 'Stats', tint: 'text-accent-blue' },
    { icon: Users, label: 'Type', tint: 'text-accent-purple' },
    { icon: Target, label: 'Exploits', tint: 'text-accent-amber' },
    { icon: Brain, label: 'Report', tint: 'text-accent-emerald' },
  ]
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2.5">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-bg-surface', s.tint)}>
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-medium text-text-muted">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-text-muted/50" />}
        </div>
      ))}
    </div>
  )
}

export default function FindPage() {
  const { isPro } = useMode()
  const [q, setQ] = useState('')

  const { data: tournaments = [], isLoading: tLoading } = useTournaments()
  const { data: players = [], isLoading: pLoading } = usePlayers()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profileByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

  const tournamentMatches = useMemo(
    () => tournaments.filter((t) => (t.name + t.event + t.venue).toLowerCase().includes(q.toLowerCase())),
    [tournaments, q],
  )
  const playerMatches = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [players, q],
  )

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Scout the table</h1>
      <p className="mb-3 mt-0.5 text-sm text-text-secondary">
        {isPro ? 'Deterministic stats, archetypes & exploits — narrated on demand.' : 'Find any tournament or player and get a plain-English read.'}
      </p>

      <PipelineStrip />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tournaments or players…"
          className="h-11 w-full rounded-xl border border-border bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      <Tabs defaultValue="tournaments">
        <TabsList>
          <TabsTrigger value="tournaments"><span className="flex items-center justify-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Tournaments</span></TabsTrigger>
          <TabsTrigger value="players"><span className="flex items-center justify-center gap-1.5"><Users className="h-3.5 w-3.5" />Players</span></TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          {tLoading ? <Loading /> : (
            <div className="space-y-2">
              {tournamentMatches.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournament/${t.id}`}
                  className="block rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-text-primary">{t.name}</h3>
                        {t.isLive && (
                          <span className="flex items-center gap-1 rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-red">
                            <Radio className="h-2.5 w-2.5" />LIVE
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-text-muted">{t.event} · {t.venue} · {t.date}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary nums">
                    <span>{t.playerCount} players</span>
                    <span>{t.handCount} hands</span>
                    <span>{fmtChips(t.prizePool)}</span>
                    {t.exploitableCount > 0 && (
                      <span className="rounded-full bg-accent-amber/10 px-1.5 py-0.5 font-semibold text-accent-amber">
                        {t.exploitableCount} exploitable
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {tournamentMatches.length === 0 && <Empty />}
            </div>
          )}
        </TabsContent>

        <TabsContent value="players">
          {pLoading ? <Loading /> : (
            <div className="space-y-2">
              {playerMatches.map((p) => {
                const prof = profileByPlayer[p.id]
                return (
                  <Link
                    key={p.id}
                    to={`/player/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
                  >
                    <PlayerAvatar initials={p.initials} color={p.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-text-primary">{p.name} <span aria-hidden>{p.flag}</span></h3>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {prof && <ArchetypeBadge archetype={prof.typing.archetype} plain={!isPro} size="sm" />}
                        {prof && prof.exploits.length > 0 && (
                          <span className="text-[11px] text-text-muted nums">{prof.exploits.length} leak{prof.exploits.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  </Link>
                )
              })}
              {playerMatches.length === 0 && <Empty />}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Empty() {
  return <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-text-muted">No matches.</div>
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  )
}
