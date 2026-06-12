import { useMemo, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Radio, MessageSquare, Table2, ChevronRight, Crown, Loader2, History, Flame } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useTournament, useTournamentPlayers, useTournamentProfiles, useTournamentHighlights, useTournamentHands } from '@/hooks'
import { STAT_DEFS } from '@/engine'
import type { PlayerProfile, StatKey } from '@/engine'
import type { Player, Tournament, Highlight, HandSummary } from '@/lib/api/domain'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import AIChat from '@/components/scout/AIChat'
import HandViewerButton from '@/components/scout/HandViewer'
import MiniCard from '@/components/common/MiniCard'
import { cn, fmtChips } from '@/lib/utils'

const TABLE_COLS: StatKey[] = ['vpip', 'pfr', 'threeBet', 'af', 'wtsd']

interface Row { profile: PlayerProfile; player: Player | undefined }

function statusFor(t: Tournament, p: Player | undefined) {
  if (t.winnerId === p?.id) return { label: 'Winner', cls: 'text-accent-amber bg-accent-amber/15', icon: true }
  if (t.isLive) return { label: 'In play', cls: 'text-accent-emerald bg-accent-emerald/15', icon: false }
  if (t.id === 't1' && p) {
    if (p.status === 'runner-up') return { label: '2nd', cls: 'text-text-secondary bg-bg-surface', icon: false }
    if (p.status === 'eliminated' && p.finish) return { label: `${p.finish}th`, cls: 'text-text-muted bg-bg-surface', icon: false }
  }
  return { label: 'Field', cls: 'text-text-muted bg-bg-surface', icon: false }
}

export default function TournamentPage() {
  const { id = '' } = useParams()
  const { isPro } = useMode()
  const { data: t, isLoading: tLoading } = useTournament(id)
  const { data: players = [] } = useTournamentPlayers(id)
  const { data: highlights = [] } = useTournamentHighlights(id)
  const { data: hands = [] } = useTournamentHands(id)
  const rosterIds = useMemo(() => players.map((p) => p.id), [players])
  const { profiles } = useTournamentProfiles(id, rosterIds)
  // Filtering (scope / table size / depth) lives on the player report, not here.

  const rows: Row[] = useMemo(() => {
    const byId = Object.fromEntries(players.map((p) => [p.id, p]))
    return profiles.map((profile) => ({ profile, player: byId[profile.playerId] }))
  }, [profiles, players])

  if (tLoading) return <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading tournament…</Centered>
  if (!t) return <div className="py-10 text-center text-text-muted">Tournament not found.</div>

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold leading-tight">{t.name}</h1>
          {t.isLive && (
            <span className="flex items-center gap-1 rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-red"><Radio className="h-2.5 w-2.5" />LIVE</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{t.event} · {t.venue} · {t.date}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['Players', String(t.playerCount)], ['Hands', String(t.handCount)], ['Prize', fmtChips(t.prizePool)]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-bg-secondary/60 py-2">
              <div className="nums text-sm font-bold text-text-primary">{v}</div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Roster */}
      <h2 className="mb-2 mt-4 text-sm font-semibold text-text-secondary">Players &amp; reads</h2>
      <div className="space-y-2">
        {rows.map(({ profile, player }) => {
          const st = statusFor(t, player)
          const top = profile.exploits[0]
          return (
            <Link
              key={profile.playerId}
              to={`/tournament/${id}/player/${profile.playerId}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
            >
              <PlayerAvatar initials={player?.initials ?? '?'} color={player?.color ?? '#444'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-text-primary">{profile.name}</span>
                  <span className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', st.cls)}>
                    {st.icon && <Crown className="h-2.5 w-2.5" />}{st.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <ArchetypeBadge archetype={profile.typing.archetype} plain={!isPro} size="sm" />
                  {top && <span className="truncate text-[11px] text-text-muted">{isPro ? top.title : top.title.toLowerCase()}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
          )
        })}
        {rows.length === 0 && <Centered><Loader2 className="h-4 w-4 animate-spin" /> Reading players…</Centered>}
      </div>

      {/* Explore */}
      <h2 className="mb-2 mt-5 text-sm font-semibold text-text-secondary">Explore this tournament</h2>
      <Tabs defaultValue="hands">
        <TabsList>
          <TabsTrigger value="hands"><span className="flex items-center justify-center gap-1"><History className="h-3.5 w-3.5" />Hands</span></TabsTrigger>
          <TabsTrigger value="highlights"><span className="flex items-center justify-center gap-1"><Flame className="h-3.5 w-3.5" />Highlights</span></TabsTrigger>
          <TabsTrigger value="chat"><span className="flex items-center justify-center gap-1"><MessageSquare className="h-3.5 w-3.5" />Chat</span></TabsTrigger>
          <TabsTrigger value="stats"><span className="flex items-center justify-center gap-1"><Table2 className="h-3.5 w-3.5" />Stats</span></TabsTrigger>
        </TabsList>
        <TabsContent value="hands"><HandsList hands={hands} /></TabsContent>
        <TabsContent value="highlights"><HighlightsList items={highlights} /></TabsContent>
        <TabsContent value="chat"><AIChat profiles={profiles} /></TabsContent>
        <TabsContent value="stats">
          {isPro ? <ProStatsTable rows={rows} tid={id} /> : <PlainTableRead rows={rows} tid={id} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted">{children}</div>
}

function HandsList({ hands }: { hands: HandSummary[] }) {
  if (!hands.length) return <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading hands…</Centered>
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-text-muted">Full hand history — each hand opens in a YouTube clip or the replayer. (Modeled list)</p>
      {hands.map((h) => (
        <div key={h.handNumber} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3">
          <div className="flex shrink-0 gap-1">{h.board.slice(0, 3).map((c, i) => <MiniCard key={i} card={c} />)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">Hand #{h.handNumber}</span>
              <span className="nums text-[11px] text-text-muted">{fmtChips(h.pot)}</span>
            </div>
            <p className="truncate text-xs text-text-muted">{h.result}</p>
          </div>
          <HandViewerButton hand={{ handNumber: h.handNumber, title: h.result, board: h.board, videoSeconds: h.videoSeconds, hasReplay: h.hasReplay }} />
        </div>
      ))}
    </div>
  )
}

const titleCase = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function HighlightsList({ items }: { items: Highlight[] }) {
  // Categories present (in first-seen order) with counts, for the filter chips.
  const categories = useMemo(() => {
    const order: string[] = []
    const count: Record<string, number> = {}
    for (const h of items) {
      if (!(h.type in count)) { count[h.type] = 0; order.push(h.type) }
      count[h.type]++
    }
    return order.map((type) => ({ type, count: count[type] }))
  }, [items])

  const [active, setActive] = useState<string>('all')

  // Filter to the active category, then sort by pot (biggest first).
  const shown = useMemo(
    () => items.filter((h) => active === 'all' || h.type === active).slice().sort((a, b) => b.pot - a.pot),
    [items, active],
  )

  if (!items.length) return <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading highlights…</Centered>

  return (
    <div>
      {/* Category filter chips with counts — biggest pots first within each */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip label="All" count={items.length} active={active === 'all'} onClick={() => setActive('all')} />
        {categories.map((c) => (
          <Chip key={c.type} label={titleCase(c.type)} count={c.count} active={active === c.type} onClick={() => setActive(c.type)} />
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((h) => (
          <div key={h.id} className="rounded-xl border border-border bg-bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-amber">{h.type.replace(/_/g, ' ')}</span>
                  <span className="nums text-[11px] text-text-muted">{fmtChips(h.pot)}</span>
                </div>
                <p className="mt-1 text-sm leading-snug text-text-primary">{h.preview}</p>
                <p className="text-[11px] text-text-muted">Hand #{h.handNumber} · {h.board}</p>
              </div>
              <HandViewerButton className="shrink-0" hand={{ handNumber: h.handNumber, title: h.preview, note: h.board, videoSeconds: h.videoSeconds, hasReplay: true }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Chip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
        active ? 'border-accent-blue bg-accent-blue text-white' : 'border-border bg-bg-surface/50 text-text-secondary hover:text-text-primary',
      )}
    >
      {label}
      <span className={cn('nums rounded-full px-1.5 text-[10px] font-bold', active ? 'bg-white/20 text-white' : 'bg-bg-card text-text-muted')}>{count}</span>
    </button>
  )
}

function ProStatsTable({ rows, tid }: { rows: Row[]; tid: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border scrollbar-thin">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-surface/60 text-left text-[11px] uppercase tracking-wide text-text-muted">
            <th className="px-3 py-2 font-semibold">Player</th>
            {TABLE_COLS.map((c) => <th key={c} className="px-2 py-2 text-right font-semibold">{STAT_DEFS[c].label}</th>)}
            <th className="px-3 py-2 font-semibold">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile }) => (
            <tr key={profile.playerId} className="border-b border-border/50 last:border-0 hover:bg-bg-surface/40">
              <td className="px-3 py-2">
                <Link to={`/tournament/${tid}/player/${profile.playerId}`} className="font-medium text-accent-blue hover:underline">{profile.name.split(' ').slice(-1)[0]}</Link>
              </td>
              {TABLE_COLS.map((c) => {
                const s = profile.stats.find((x) => x.key === c)!
                return (
                  <td key={c} className={cn('nums px-2 py-2 text-right', s.tier === 'NOISE' ? 'text-text-muted' : s.tier === 'TENTATIVE' ? 'text-accent-amber' : 'text-text-primary')}>
                    {s.unit === 'ratio' ? s.value.toFixed(1) : s.value}
                  </td>
                )
              })}
              <td className="px-3 py-2"><ArchetypeBadge archetype={profile.typing.archetype} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-text-muted">Amber = small sample (TENTATIVE), grey = too few hands (NOISE). Tap a name for the full report.</p>
    </div>
  )
}

function PlainTableRead({ rows, tid }: { rows: Row[]; tid: string }) {
  return (
    <div className="space-y-2">
      {rows.map(({ profile }) => (
        <Link key={profile.playerId} to={`/tournament/${tid}/player/${profile.playerId}`} className="block rounded-xl border border-border bg-bg-card p-3 hover:bg-bg-surface cursor-pointer transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">{profile.name}</span>
            <ArchetypeBadge archetype={profile.typing.archetype} plain size="sm" />
          </div>
          <p className="mt-1 text-xs leading-snug text-text-secondary">{profile.narrative.summary}</p>
        </Link>
      ))}
    </div>
  )
}
