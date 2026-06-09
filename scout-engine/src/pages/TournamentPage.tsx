import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Radio, MessageSquare, Table2, ChevronRight, Crown } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { TOURNAMENTS_LIST, PLAYERS } from '@/data'
import { getProfile, STAT_DEFS } from '@/engine'
import type { PlayerProfile, StatKey } from '@/engine'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'
import AIChat from '@/components/scout/AIChat'
import { cn, fmtChips } from '@/lib/utils'

const TABLE_COLS: StatKey[] = ['vpip', 'pfr', 'threeBet', 'af', 'wtsd']

function statusFor(tournamentId: string, playerId: string) {
  const t = TOURNAMENTS_LIST.find((x) => x.id === tournamentId)!
  const p = PLAYERS.find((x) => x.id === playerId)
  if (t.winner === playerId) return { label: 'Winner', cls: 'text-accent-amber bg-accent-amber/15', icon: true }
  if (t.status === 'live') return { label: 'In play', cls: 'text-accent-emerald bg-accent-emerald/15', icon: false }
  if (tournamentId === 't1' && p) {
    if (p.status === 'runner-up') return { label: '2nd', cls: 'text-text-secondary bg-bg-surface', icon: false }
    if (p.status === 'eliminated') return { label: `${p.finish}th`, cls: 'text-text-muted bg-bg-surface', icon: false }
  }
  return { label: 'Field', cls: 'text-text-muted bg-bg-surface', icon: false }
}

export default function TournamentPage() {
  const { id = '' } = useParams()
  const { isPro } = useMode()
  const t = TOURNAMENTS_LIST.find((x) => x.id === id)

  const rosterIds = useMemo(() => {
    if (id === 't1') return PLAYERS.map((p) => p.id)
    if (t && t.topPlayers.length) return t.topPlayers
    return PLAYERS.map((p) => p.id)
  }, [id, t])

  const profiles = useMemo(
    () => rosterIds.map(getProfile).filter((p): p is PlayerProfile => !!p),
    [rosterIds],
  )

  if (!t) return <div className="py-10 text-center text-text-muted">Tournament not found.</div>

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold leading-tight">{t.name}</h1>
          {t.status === 'live' && (
            <span className="flex items-center gap-1 rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-red"><Radio className="h-2.5 w-2.5" />LIVE</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{t.event} · {t.venue} · {t.date}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['Players', String(t.players)], ['Hands', String(t.hands)], ['Prize', fmtChips(t.prize)]].map(([k, v]) => (
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
        {profiles.map((prof) => {
          const p = PLAYERS.find((x) => x.id === prof.playerId)!
          const st = statusFor(id, prof.playerId)
          const top = prof.exploits[0]
          return (
            <Link
              key={prof.playerId}
              to={`/player/${prof.playerId}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
            >
              <PlayerAvatar initials={p.initials} color={p.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-text-primary">{p.name}</span>
                  <span className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', st.cls)}>
                    {st.icon && <Crown className="h-2.5 w-2.5" />}{st.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <ArchetypeBadge archetype={prof.typing.archetype} plain={!isPro} size="sm" />
                  {top && <span className="truncate text-[11px] text-text-muted">{isPro ? top.title : top.title.toLowerCase()}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
          )
        })}
      </div>

      {/* Analysis tools */}
      <h2 className="mb-2 mt-5 text-sm font-semibold text-text-secondary">Analyze this tournament</h2>
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat"><span className="flex items-center justify-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />AI Chat</span></TabsTrigger>
          <TabsTrigger value="stats"><span className="flex items-center justify-center gap-1.5"><Table2 className="h-3.5 w-3.5" />{isPro ? 'Stats Table' : 'Table Read'}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AIChat playerIds={rosterIds} />
        </TabsContent>

        <TabsContent value="stats">
          {isPro ? <ProStatsTable profiles={profiles} /> : <PlainTableRead profiles={profiles} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProStatsTable({ profiles }: { profiles: PlayerProfile[] }) {
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
          {profiles.map((prof) => {
            const p = PLAYERS.find((x) => x.id === prof.playerId)!
            return (
              <tr key={prof.playerId} className="border-b border-border/50 last:border-0 hover:bg-bg-surface/40">
                <td className="px-3 py-2">
                  <Link to={`/player/${prof.playerId}`} className="font-medium text-accent-blue hover:underline">{p.name.split(' ').slice(-1)[0]}</Link>
                </td>
                {TABLE_COLS.map((c) => {
                  const s = prof.stats.find((x) => x.key === c)!
                  return (
                    <td key={c} className={cn('nums px-2 py-2 text-right', s.tier === 'NOISE' ? 'text-text-muted' : s.tier === 'TENTATIVE' ? 'text-accent-amber' : 'text-text-primary')}>
                      {s.unit === 'ratio' ? s.value.toFixed(1) : s.value}
                    </td>
                  )
                })}
                <td className="px-3 py-2"><ArchetypeBadge archetype={prof.typing.archetype} size="sm" /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-text-muted">Amber = small sample (TENTATIVE), grey = too few hands (NOISE). Tap a name for the full report.</p>
    </div>
  )
}

function PlainTableRead({ profiles }: { profiles: PlayerProfile[] }) {
  return (
    <div className="space-y-2">
      {profiles.map((prof) => {
        const p = PLAYERS.find((x) => x.id === prof.playerId)!
        return (
          <Link key={prof.playerId} to={`/player/${prof.playerId}`} className="block rounded-xl border border-border bg-bg-card p-3 hover:bg-bg-surface cursor-pointer transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-text-primary">{p.name}</span>
              <ArchetypeBadge archetype={prof.typing.archetype} plain size="sm" />
            </div>
            <p className="mt-1 text-xs leading-snug text-text-secondary">{prof.narrative.summary}</p>
          </Link>
        )
      })}
    </div>
  )
}
