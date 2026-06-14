import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronDown, Loader2, CheckCheck, XCircle, BarChart3, Database } from 'lucide-react'
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

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export default function TournamentPlayerStatsPage() {
  const { tid = '', pid = '' } = useParams()
  const { isPro } = useMode()
  const { data: tournament } = useTournament(tid)
  const { data: player } = usePlayer(pid)
  const { data: profile, isLoading } = usePlayerProfile(pid, eventFilters(tid))
  // Which stat's hands are expanded (accordion). One open by default to show the pattern.
  const [open, setOpen] = useState<string | null>('vpip')
  const panelRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  const groups = useMemo(() => {
    const stats = profile?.stats ?? []
    return [
      { label: 'Preflop', items: stats.filter((s) => s.category === 'preflop') },
      { label: 'Postflop & Showdown', items: stats.filter((s) => s.category === 'postflop') },
    ].filter((g) => g.items.length)
  }, [profile])

  // Bring the freshly-opened panel into view — but never on the initial mount (no load jump).
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    if (open && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [open])

  if (isLoading || !profile || !player) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading player stats…</div>
  }

  const first = player.name.split(' ')[0]
  const toggle = (key: string) => setOpen((cur) => (cur === key ? null : key))

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

      {/* ---- Stat grid (tap a stat → its hands expand right below the row) ---- */}
      <div className="mt-4 mb-2 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-accent-blue" />
        <h2 className="text-sm font-semibold text-text-primary">{isPro ? 'Stats' : 'Their tendencies'}</h2>
        <span className="text-[11px] text-text-muted">tap a stat to expand its hands</span>
      </div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">{g.label}</div>
            <div className="space-y-2">
              {chunk(g.items, 2).map((row, ri) => {
                const activeStat = row.find((s) => s.key === open)
                return (
                  <div key={ri}>
                    <div className="grid grid-cols-2 gap-2">
                      {row.map((s) => {
                        const active = s.key === open
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => toggle(s.key)}
                            aria-expanded={active}
                            className={cn(
                              'flex flex-col items-start rounded-xl border p-2.5 text-left transition-colors cursor-pointer',
                              active ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/40' : 'border-border bg-bg-card hover:border-border-light hover:bg-bg-surface',
                            )}
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span className="truncate text-xs font-medium text-text-secondary">{isPro ? s.label : STAT_DEFS[s.key].plainName}</span>
                              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tierDot(s.tier))} title={s.tier} />
                            </div>
                            <div className="mt-0.5 flex w-full items-center justify-between gap-1">
                              <span className={cn('nums text-base font-bold', active ? 'text-accent-blue' : 'text-text-primary')}>{fmtStat(s)}</span>
                              <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', active ? 'text-accent-blue' : 'text-text-muted')}>
                                hands <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', active && 'rotate-180')} />
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {activeStat && (
                      <div ref={panelRef} className="animate-fade-up mt-2 rounded-xl border border-accent-blue/40 bg-bg-surface/30">
                        <StatHandsPanel
                          key={activeStat.key}
                          playerId={pid}
                          tournamentId={tid}
                          statKey={activeStat.key}
                          statLabel={isPro ? activeStat.label : STAT_DEFS[activeStat.key].plainName}
                          plainMeaning={STAT_DEFS[activeStat.key].plain}
                          isPro={isPro}
                          first={first}
                          onClose={() => setOpen(null)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type ActionFilter = 'executed' | 'folded' | 'all'

function StatHandsPanel({ playerId, tournamentId, statKey, statLabel, plainMeaning, isPro, first, onClose }: {
  playerId: string; tournamentId: string; statKey: string; statLabel: string; plainMeaning: string; isPro: boolean; first: string; onClose: () => void
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
    <section className="p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-3.5 w-1 rounded-full bg-accent-blue" />
        <h2 className="text-sm font-semibold text-text-primary">{statLabel}</h2>
        <span className="text-[11px] text-text-muted">{isPro ? 'hands behind this stat' : `${first}'s hands`}</span>
        <button type="button" onClick={onClose} className="ml-auto flex items-center gap-0.5 text-[11px] font-medium text-text-muted hover:text-text-primary cursor-pointer" aria-label="Collapse">
          Hide <ChevronDown className="h-3.5 w-3.5 rotate-180" />
        </button>
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
