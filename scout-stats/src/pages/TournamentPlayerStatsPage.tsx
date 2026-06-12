import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Loader2, CheckCheck, XCircle, BarChart3, Database } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { usePlayer, useTournament, usePlayerProfile, usePlayerStatHands } from '@/hooks'
import { STAT_DEFS } from '@/engine'
import type { StatWithTier, StatFilters } from '@/engine'
import type { StatHand } from '@/lib/api/domain'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import MiniCard from '@/components/common/MiniCard'
import HandViewerButton from '@/components/scout/HandViewer'
import { cn, fmtChips } from '@/lib/utils'

const tierDot = (t: string) => t === 'RELIABLE' ? 'bg-accent-emerald' : t === 'TENTATIVE' ? 'bg-accent-amber' : 'bg-text-muted'

function eventFilters(tid: string): StatFilters {
  return { scope: 'event', tournamentId: tid, tableSize: 'all', depth: 'all' }
}

const fmtStat = (s: StatWithTier) => (s.unit === 'ratio' ? s.value.toFixed(1) : `${s.value}%`)

export default function TournamentPlayerStatsPage() {
  const { tid = '', pid = '' } = useParams()
  const { isPro } = useMode()
  const { data: tournament } = useTournament(tid)
  const { data: player } = usePlayer(pid)
  const { data: profile, isLoading } = usePlayerProfile(pid, eventFilters(tid))
  const [selected, setSelected] = useState<string | null>(null)

  // Default to VPIP (or the first stat) so hands show immediately.
  const effective = useMemo(() => {
    if (!profile) return null
    if (selected && profile.stats.some((s) => s.key === selected)) return selected
    return profile.stats.find((s) => s.key === 'vpip')?.key ?? profile.stats[0]?.key ?? null
  }, [profile, selected])

  const groups = useMemo(() => {
    const stats = profile?.stats ?? []
    return [
      { label: 'Preflop', items: stats.filter((s) => s.category === 'preflop') },
      { label: 'Postflop & Showdown', items: stats.filter((s) => s.category === 'postflop') },
    ].filter((g) => g.items.length)
  }, [profile])

  if (isLoading || !profile || !player) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading player stats…</div>
  }

  const selectedStat = profile.stats.find((s) => s.key === effective)
  const first = player.name.split(' ')[0]

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
            <p className="mt-0.5 truncate text-xs text-text-muted">in {tournament?.name ?? 'this event'}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-lg border border-border bg-bg-surface/60 px-2 py-1 text-[11px] text-text-secondary">
                <Database className="h-3.5 w-3.5 text-text-muted" /><span className="nums font-semibold">{profile.totalHands}</span> hands
              </span>
              <Link to={`/player/${pid}?t=${tid}`} className="text-[11px] font-semibold text-accent-blue hover:underline cursor-pointer">Full report →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Stat grid ---- */}
      <div className="mt-4 mb-2 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-accent-blue" />
        <h2 className="text-sm font-semibold text-text-primary">{isPro ? 'Stats' : 'Their tendencies'}</h2>
        <span className="text-[11px] text-text-muted">tap one to see the hands behind it</span>
      </div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">{g.label}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {g.items.map((s) => {
                const active = s.key === effective
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelected(s.key)}
                    className={cn(
                      'flex flex-col items-start rounded-xl border p-2.5 text-left transition-colors cursor-pointer',
                      active ? 'border-accent-blue bg-accent-blue/10' : 'border-border bg-bg-card hover:border-border-light hover:bg-bg-surface',
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="truncate text-xs font-medium text-text-secondary">{isPro ? s.label : STAT_DEFS[s.key].plainName}</span>
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tierDot(s.tier))} title={s.tier} />
                    </div>
                    <span className={cn('nums mt-0.5 text-base font-bold', active ? 'text-accent-blue' : 'text-text-primary')}>{fmtStat(s)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Hands for the selected stat ---- */}
      {effective && selectedStat && (
        <StatHandsPanel
          key={effective}
          playerId={pid}
          tournamentId={tid}
          statKey={effective}
          statLabel={isPro ? selectedStat.label : STAT_DEFS[effective].plainName}
          plainMeaning={STAT_DEFS[effective].plain}
          isPro={isPro}
          first={first}
        />
      )}
    </div>
  )
}

type ActionFilter = 'executed' | 'folded' | 'all'

function StatHandsPanel({ playerId, tournamentId, statKey, statLabel, plainMeaning, isPro, first }: {
  playerId: string; tournamentId: string; statKey: string; statLabel: string; plainMeaning: string; isPro: boolean; first: string
}) {
  const { data: hands = [], isLoading } = usePlayerStatHands(playerId, statKey, tournamentId)
  const [filter, setFilter] = useState<ActionFilter>('executed')

  const { executed, folded, shown } = useMemo(() => {
    const ex = hands.filter((h) => h.actionTaken)
    const fo = hands.filter((h) => !h.actionTaken)
    const shown = filter === 'executed' ? ex : filter === 'folded' ? fo : hands
    return { executed: ex, folded: fo, shown }
  }, [hands, filter])

  return (
    <section className="mt-5">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-text-primary">{statLabel}</h2>
        <span className="text-[11px] text-text-muted">{isPro ? 'hands behind this stat' : `${first}'s hands`}</span>
      </div>
      {!isPro && <p className="mb-2 text-xs leading-snug text-text-muted">{plainMeaning}</p>}

      {/* Executed / Folded / All tabs */}
      <div className="mb-3 inline-flex items-center rounded-lg border border-border bg-bg-surface/60 p-0.5 text-xs">
        <Tab active={filter === 'executed'} onClick={() => setFilter('executed')}>
          <CheckCheck className="h-3 w-3" /> {isPro ? 'Executed' : 'Did it'} <Count n={executed.length} active={filter === 'executed'} />
        </Tab>
        <Tab active={filter === 'folded'} onClick={() => setFilter('folded')}>
          <XCircle className="h-3 w-3" /> {isPro ? 'Folded' : 'Passed'} <Count n={folded.length} active={filter === 'folded'} />
        </Tab>
        <Tab active={filter === 'all'} onClick={() => setFilter('all')}>All <Count n={hands.length} active={filter === 'all'} /></Tab>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading hands…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-muted">No hands in this view.</div>
      ) : (
        <div className="space-y-2">
          {shown.map((h, i) => <StatHandRow key={`${h.handNumber}-${i}`} hand={h} />)}
        </div>
      )}
    </section>
  )
}

function StatHandRow({ hand: h }: { hand: StatHand }) {
  const win = h.netResult >= 0
  return (
    <div className="rounded-xl border border-border bg-bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex gap-1">{h.holeCards.map((c, i) => <MiniCard key={i} card={c} />)}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">{h.position}</span>
              <span className={cn('nums text-xs font-bold', win ? 'text-accent-emerald' : 'text-accent-red')}>{win ? '+' : '−'}{fmtChips(Math.abs(h.netResult))}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-text-muted">Hand #{h.handNumber} · {h.board.join(' ')}</p>
          </div>
        </div>
        <HandViewerButton className="shrink-0" hand={{ handNumber: h.handNumber, title: h.result, board: h.board, videoSeconds: h.videoSeconds, hasReplay: h.hasReplay }} />
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer', active ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-secondary')}
    >
      {children}
    </button>
  )
}

function Count({ n, active }: { n: number; active: boolean }) {
  return <span className={cn('nums ml-0.5 text-[10px]', active ? 'text-white/80' : 'text-text-muted')}>({n})</span>
}
