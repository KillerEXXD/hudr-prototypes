import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Search, Trophy, Users, ChevronRight, Layers, Target, Brain, Loader2, X, ArrowRight } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useTournaments, usePlayers, useProfiles, careerFilters } from '@/hooks'
import TournamentListItem from '@/components/scout/TournamentListItem'
import PlayerListItem from '@/components/scout/PlayerListItem'
import { cn } from '@/lib/utils'

const PIPELINE_STEPS = [
  { icon: Layers, label: 'Stats', tint: 'text-accent-blue', title: 'Layer 1 · Stat engine', desc: 'We compute ~20 poker stats (VPIP, PFR, 3-bet, c-bet, WTSD…) from the hands — each gated by sample size into Reliable / Tentative / hidden, so a read off 12 hands is never treated like one off 1,200.' },
  { icon: Users, label: 'Type', tint: 'text-accent-purple', title: 'Layer 2 · Player typing', desc: 'The reliable stats map to an archetype (TAG, LAG, Nit, Calling Station, Maniac…) via explicit boundaries, with a confidence score. No clean match → "Unclassified" rather than a forced label.' },
  { icon: Target, label: 'Exploits', tint: 'text-accent-amber', title: 'Layer 3 · Exploit matrix', desc: 'Every leak that crosses a threshold becomes a ranked exploit with a concrete counter-strategy and a confirmation stat to watch — fired only from Reliable reads.' },
  { icon: Brain, label: 'Report', tint: 'text-accent-emerald', title: 'Layer 4 · Narrated report', desc: 'Everything is narrated into a plain-English scouting report — nickname, how they play, how to beat them, a game plan — composed only from the computed numbers, never invented.' },
]

function PipelineStrip() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-bg-card px-2 py-2.5">
        {PIPELINE_STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <button
              onClick={() => setOpen(i)}
              aria-label={`How ${s.label} works`}
              className="flex flex-col items-center gap-1 rounded-lg px-1.5 py-1 transition-colors hover:bg-bg-surface cursor-pointer"
            >
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-bg-surface', s.tint)}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-medium text-text-muted">{s.label}</span>
            </button>
            {i < PIPELINE_STEPS.length - 1 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-text-muted/50" />}
          </div>
        ))}
      </div>

      {open !== null && createPortal((() => {
        const s = PIPELINE_STEPS[open]
        const Icon = s.icon
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
            <div className="animate-fade-up w-full max-w-sm rounded-2xl border border-border bg-bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-bg-surface', s.tint)}><Icon className="h-4 w-4" /></span>
                  <h3 className="text-sm font-bold text-text-primary">{s.title}</h3>
                </div>
                <button onClick={() => setOpen(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
              <div className="mt-4 flex items-center gap-1">
                {PIPELINE_STEPS.map((st, i) => (
                  <button key={st.label} onClick={() => setOpen(i)} className={cn('h-1.5 flex-1 rounded-full transition-colors cursor-pointer', i === open ? 'bg-accent-blue' : 'bg-bg-surface hover:bg-border-light')} aria-label={st.label} />
                ))}
              </div>
            </div>
          </div>
        )
      })(), document.body)}
    </>
  )
}

function SectionHeader({ icon, title, count, seeAll }: { icon: React.ReactNode; title: string; count: number; seeAll: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-accent-blue">{icon}</span>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <span className="nums text-xs text-text-muted">{count}</span>
      <Link to={seeAll} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-blue hover:underline cursor-pointer">
        See all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

const PREVIEW = 3

export default function FindPage() {
  const { isPro } = useMode()
  const [q, setQ] = useState('')

  const { data: tournaments = [], isLoading: tLoading } = useTournaments()
  const { data: players = [], isLoading: pLoading } = usePlayers()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profileByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

  const searching = q.trim().length > 0
  const tournamentMatches = useMemo(
    () => tournaments.filter((t) => (t.name + t.event + t.venue).toLowerCase().includes(q.toLowerCase())),
    [tournaments, q],
  )
  const playerMatches = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [players, q],
  )

  // Idle: lead with live tournaments. Searching: show matches.
  const tList = searching ? tournamentMatches : [...tournaments].sort((a, b) => Number(b.isLive) - Number(a.isLive))
  const pList = searching ? playerMatches : players

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

      {tLoading || pLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-5">
          <section>
            <SectionHeader icon={<Trophy className="h-4 w-4" />} title={searching ? 'Tournaments' : 'Live & recent'} count={tList.length} seeAll="/tournaments" />
            {tList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-text-muted">No matching tournaments.</p>
            ) : (
              <div className="space-y-2">
                {tList.slice(0, PREVIEW).map((t) => <TournamentListItem key={t.id} tournament={t} />)}
              </div>
            )}
          </section>

          <section>
            <SectionHeader icon={<Users className="h-4 w-4" />} title={searching ? 'Players' : 'Featured players'} count={pList.length} seeAll="/players" />
            {pList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-text-muted">No matching players.</p>
            ) : (
              <div className="space-y-2">
                {pList.slice(0, PREVIEW).map((p) => <PlayerListItem key={p.id} player={p} profile={profileByPlayer[p.id]} plain={!isPro} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
