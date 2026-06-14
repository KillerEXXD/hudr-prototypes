import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react'
import { ChevronDown, Loader2, CheckCheck, XCircle } from 'lucide-react'
import { usePlayerStatHands } from '@/hooks'
import { STAT_DEFS } from '@/engine'
import type { StatWithTier } from '@/engine'
import type { StatHand } from '@/lib/api/domain'
import MiniCard from '@/components/common/MiniCard'
import HandViewerButton from '@/components/scout/HandViewer'
import TierBadge from '@/components/common/TierBadge'
import { cn, fmtChips } from '@/lib/utils'

// Stat → hands evidence drill (promoted from Scout Stats into the report).
// Tapping a stat expands the actual hands behind that rate right below its row,
// split into Executed / Folded so a claim is always one tap from its evidence.

const tierDot = (t: string) => t === 'RELIABLE' ? 'bg-tier-reliable' : t === 'TENTATIVE' ? 'bg-tier-tentative' : 'bg-text-muted'
const fmtStat = (s: StatWithTier) => (s.unit === 'ratio' ? s.value.toFixed(1) : `${s.value}%`)

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export default function StatHandsExplorer({ stats, playerId, tournamentId, first, defaultOpen = 'vpip' }: {
  stats: StatWithTier[]
  playerId: string
  tournamentId: string | null
  first: string
  defaultOpen?: string
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen)
  const panelRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  const groups = useMemo(() => ([
    { label: 'Preflop', items: stats.filter((s) => s.category === 'preflop') },
    { label: 'Postflop & Showdown', items: stats.filter((s) => s.category === 'postflop') },
  ].filter((g) => g.items.length)), [stats])

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    if (open && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [open])

  const toggle = (key: string) => setOpen((cur) => (cur === key ? null : key))

  return (
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
                            <span className="truncate text-xs font-medium text-text-secondary">{s.label}</span>
                            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tierDot(s.tier))} title={s.tier} />
                          </div>
                          <div className="mt-0.5 flex w-full items-center justify-between gap-1">
                            <span className={cn('nums text-base font-bold', active ? 'text-accent-blue' : 'text-text-primary')}>{fmtStat(s)}</span>
                            <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', active ? 'text-accent-blue' : 'text-text-muted')}>
                              n={s.opportunities} <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', active && 'rotate-180')} />
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
                        playerId={playerId}
                        tournamentId={tournamentId}
                        stat={activeStat}
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
  )
}

type ActionFilter = 'executed' | 'folded' | 'all'

function StatHandsPanel({ playerId, tournamentId, stat, first, onClose }: {
  playerId: string; tournamentId: string | null; stat: StatWithTier; first: string; onClose: () => void
}) {
  const { data: hands = [] as StatHand[], isLoading } = usePlayerStatHands(playerId, stat.key, tournamentId ?? undefined)
  const [filter, setFilter] = useState<ActionFilter>('executed')
  const def = STAT_DEFS[stat.key]

  const { executed, folded, shown } = useMemo(() => {
    const ex = hands.filter((h: StatHand) => h.actionTaken)
    const fo = hands.filter((h: StatHand) => !h.actionTaken)
    const shown = filter === 'executed' ? ex : filter === 'folded' ? fo : hands
    return { executed: ex, folded: fo, shown }
  }, [hands, filter])

  return (
    <section className="p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-3.5 w-1 rounded-full bg-accent-blue" />
        <h3 className="text-sm font-semibold text-text-primary">{stat.label}</h3>
        <TierBadge tier={stat.tier} className="ml-0.5" />
        <button type="button" onClick={onClose} className="ml-auto flex items-center gap-0.5 text-[11px] font-medium text-text-muted hover:text-text-primary cursor-pointer" aria-label="Collapse">
          Hide <ChevronDown className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
      <p className="mb-2 text-xs leading-snug text-text-muted">{def.definition} · n={stat.opportunities}</p>

      <div className="mb-3 inline-flex items-center rounded-lg border border-border bg-bg-surface/60 p-0.5 text-xs">
        <Tab active={filter === 'executed'} onClick={() => setFilter('executed')}>
          <CheckCheck className="h-3 w-3" /> Executed <Count n={executed.length} active={filter === 'executed'} />
        </Tab>
        <Tab active={filter === 'folded'} onClick={() => setFilter('folded')}>
          <XCircle className="h-3 w-3" /> Passed <Count n={folded.length} active={filter === 'folded'} />
        </Tab>
        <Tab active={filter === 'all'} onClick={() => setFilter('all')}>All <Count n={hands.length} active={filter === 'all'} /></Tab>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading {first}'s hands…</div>
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

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
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
