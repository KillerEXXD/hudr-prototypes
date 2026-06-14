import { useMemo, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Radio, Table2, ChevronRight, Loader2, History, Flame, Sparkles, ArrowRight, Trophy } from 'lucide-react'
import { useTournament, useTournamentPlayers, useTournamentProfiles, useTournamentHighlights, useTournamentHands, useProfiles } from '@/hooks'
import { STAT_DEFS } from '@/engine'
import type { PlayerProfile, StatKey } from '@/engine'
import type { Player, Highlight, HandSummary } from '@/lib/api/domain'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import HandViewerButton from '@/components/scout/HandViewer'
import TournamentChatSheet from '@/components/scout/TournamentChatSheet'
import TournamentResults from '@/components/scout/TournamentResults'
import MiniCard from '@/components/common/MiniCard'
import { cn, fmtChips } from '@/lib/utils'

const TABLE_COLS: StatKey[] = ['vpip', 'pfr', 'threeBet', 'af', 'wtsd']

interface Row { profile: PlayerProfile; player: Player | undefined }

export default function TournamentPage() {
  const { id = '' } = useParams()
  const [chatOpen, setChatOpen] = useState(false)
  const { data: t, isLoading: tLoading } = useTournament(id)
  const { data: players = [] } = useTournamentPlayers(id)
  const { data: highlights = [], isLoading: highlightsLoading } = useTournamentHighlights(id)
  const { data: hands = [], isLoading: handsLoading } = useTournamentHands(id)
  const rosterIds = useMemo(() => players.map((p) => p.id), [players])
  // Career profiles label the stat cards with who each player is overall + their top leak.
  const { profiles } = useTournamentProfiles(id, rosterIds)
  // Stats tab reads THIS EVENT's stat lines, matching where a tapped player lands.
  const { profiles: eventProfiles, isLoading: eventLoading } = useProfiles(rosterIds, { scope: 'event', tournamentId: id, tableSize: 'all', depth: 'all' })
  // Tapping a player opens their report scoped to THIS event (?t=).
  const playerQuery = `?t=${id}`

  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players])
  const eventRows: Row[] = useMemo(() => eventProfiles.map((profile) => ({ profile, player: byId[profile.playerId] })), [eventProfiles, byId])
  // Career profile per player (archetype + top leak) to enrich the event stat cards.
  const careerByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

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

        {/* Ask-AI launcher — tournament-scoped assistant */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-3 py-2.5 text-sm font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20 cursor-pointer"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-blue/20">
            <Sparkles className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-accent-blue ring-2 ring-bg-card" />
          </span>
          Ask AI about this event
          <ArrowRight className="ml-auto h-4 w-4" />
        </button>
      </div>

      {/* Explore — one player list lives in the Stats tab (no duplicate roster) */}
      <h2 className="mb-2 mt-4 text-sm font-semibold text-text-secondary">Explore this tournament</h2>
      <Tabs defaultValue={t.winnerId ? 'results' : 'hands'}>
        <TabsList>
          <TabsTrigger value="results"><span className="flex items-center justify-center gap-1"><Trophy className="h-3.5 w-3.5" />Results</span></TabsTrigger>
          <TabsTrigger value="hands"><span className="flex items-center justify-center gap-1"><History className="h-3.5 w-3.5" />Hands</span></TabsTrigger>
          <TabsTrigger value="highlights"><span className="flex items-center justify-center gap-1"><Flame className="h-3.5 w-3.5" />Highlights</span></TabsTrigger>
          <TabsTrigger value="stats"><span className="flex items-center justify-center gap-1"><Table2 className="h-3.5 w-3.5" />Stats</span></TabsTrigger>
        </TabsList>
        <TabsContent value="results"><TournamentResults tournament={t} players={players} /></TabsContent>
        <TabsContent value="hands"><HandsList hands={hands} loading={handsLoading} /></TabsContent>
        <TabsContent value="highlights"><HighlightsList items={highlights} loading={highlightsLoading} /></TabsContent>
        <TabsContent value="stats">
          {eventRows.length === 0
            ? (eventLoading
                ? <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading event stats…</Centered>
                : <EmptyNote>No stats yet — this event hasn't been played.</EmptyNote>)
            : <EventStatCards rows={eventRows} linkQuery={playerQuery} careerByPlayer={careerByPlayer} />}
        </TabsContent>
      </Tabs>

      <TournamentChatSheet open={chatOpen} onClose={() => setChatOpen(false)} profiles={profiles} tournamentName={t.name} />
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted">{children}</div>
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-muted">{children}</div>
}

function HandsList({ hands, loading }: { hands: HandSummary[]; loading: boolean }) {
  if (loading) return <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading hands…</Centered>
  if (!hands.length) return <EmptyNote>No hands yet — this event hasn't been played.</EmptyNote>
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

function HighlightsList({ items, loading }: { items: Highlight[]; loading: boolean }) {
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

  if (loading) return <Centered><Loader2 className="h-4 w-4 animate-spin" /> Loading highlights…</Centered>
  if (!items.length) return <EmptyNote>No highlights yet — this event hasn't been played.</EmptyNote>

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

// This event's stat lines as clickable player cards. Tapping one opens that
// player's report scoped to THIS event — where the full card grid + the hands
// behind each stat live.
function EventStatCards({ rows, linkQuery, careerByPlayer }: { rows: Row[]; linkQuery: string; careerByPlayer: Record<string, PlayerProfile> }) {
  return (
    <div>
      <p className="mb-2 text-[11px] text-text-muted">This event's stat lines — tap a player to open their report &amp; the hands behind each stat for this event.</p>
      <div className="space-y-2">
        {rows.map(({ profile, player }) => {
          const career = careerByPlayer[profile.playerId] ?? profile
          const topLeak = career.exploits[0]
          return (
          <Link
            key={profile.playerId}
            to={`/player/${profile.playerId}${linkQuery}`}
            className="block rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-accent-blue/50 hover:bg-bg-surface cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <PlayerAvatar initials={player?.initials ?? '?'} color={player?.color ?? '#444'} photoUrl={player?.photoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-text-primary">{profile.name}</span>
                  {player?.flag && <span aria-hidden>{player.flag}</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <ArchetypeBadge archetype={career.typing.archetype} size="sm" />
                  {topLeak && <span className="truncate text-[11px] text-text-muted">{topLeak.title}</span>}
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-accent-blue">
                This event <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-5 gap-1.5 border-t border-border/60 pt-2.5">
              {TABLE_COLS.map((c) => {
                const s = profile.stats.find((x) => x.key === c)!
                const tone = s.tier === 'NOISE' ? 'text-text-muted' : s.tier === 'TENTATIVE' ? 'text-accent-amber' : 'text-text-primary'
                return (
                  <div key={c} className="text-center">
                    <div className={cn('nums text-sm font-bold', tone)}>{s.unit === 'ratio' ? s.value.toFixed(1) : `${s.value}%`}</div>
                    <div className="text-[9px] uppercase tracking-wide text-text-muted">{STAT_DEFS[c].label}</div>
                  </div>
                )
              })}
            </div>
          </Link>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-text-muted">Amber = small sample · grey = too few hands. Numbers are for this event; open a player to switch to Career.</p>
    </div>
  )
}
