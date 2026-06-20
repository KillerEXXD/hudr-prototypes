import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useCrews, type CrewPulse } from '@/hooks/crews'
import { Avatar, Btn, EmptyState, Section, Spinner } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// Rail Home (player) — PEOPLE-FIRST. Rail's bet: these are friend groups first,
// games second. So the home is your CREWS as living tiles (who's around, what's
// live, your standing), hottest crew first. Games live one tap inside a crew.
// =====================================================================

function NetTag({ n }: { n: number }) {
  const up = n > 0, flat = n === 0
  return <span className={cn('font-mono text-[12px] font-bold tabular-nums', up ? 'text-accent-emerald' : flat ? 'text-text-muted' : 'text-accent-red')}>{up ? '+' : ''}{n.toLocaleString()}</span>
}

function CrewTile({ crew }: { crew: CrewPulse }) {
  const navigate = useNavigate()
  const hasLive = crew.live.length > 0
  const needs = crew.needsYou.length
  return (
    <button
      onClick={() => navigate(`/club/${crew.clubId}`)}
      className={cn('w-full cursor-pointer rounded-[20px] border p-4 text-left transition-all active:scale-[0.99]',
        hasLive ? 'border-accent-emerald/30 bg-bg-card' : needs > 0 ? 'border-accent-gold/35 bg-bg-card' : 'border-border bg-bg-card hover:border-border-light')}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: crew.clubColor ?? 'var(--color-bg-surface)' }}>{crew.clubEmoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-text-primary">{crew.clubName}</p>
          <p className="text-[12px] text-text-muted">👥 {crew.memberCount} · {crew.myRole === 'owner' ? 'You host' : crew.myRole === 'host' ? 'Co-host' : 'Member'}</p>
        </div>
        {crew.ledger && (
          <div className="text-right">
            <NetTag n={crew.ledger.net} />
            <p className="text-[10px] text-text-muted">your net</p>
          </div>
        )}
      </div>

      {/* pulse line — what's happening in this crew right now */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {hasLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-emerald/12 px-2 py-1 text-[11px] font-bold text-accent-emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald rail-dot" />{crew.live.length} live now
          </span>
        )}
        {needs > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-gold/12 px-2 py-1 text-[11px] font-bold text-accent-gold">⚡ {needs} need{needs === 1 ? 's' : ''} you</span>
        )}
        {crew.open.length > 0 && !hasLive && needs === 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-bg-surface px-2 py-1 text-[11px] font-semibold text-text-secondary">{crew.open.length} open to join</span>
        )}
        {!hasLive && needs === 0 && crew.open.length === 0 && (
          <span className="text-[11px] text-text-muted">Quiet right now</span>
        )}
        {/* most-imminent game title */}
        {(crew.live[0] ?? crew.needsYou[0] ?? crew.open[0]) && (
          <span className="ml-auto truncate text-[11px] text-text-muted">{(crew.live[0] ?? crew.needsYou[0] ?? crew.open[0]).title}</span>
        )}
      </div>
    </button>
  )
}

export function RailHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { loading, crews } = useCrews()
  const clubs = useRecentClubs()
  const requestJoin = useRequestToJoin()
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none').slice(0, 3)

  if (loading) return <Spinner label="Catching up your crews…" />

  const totalNeeds = crews.reduce((n, c) => n + c.needsYou.length, 0)
  const totalLive = crews.reduce((n, c) => n + c.live.length, 0)

  return (
    <div className="animate-fade-up space-y-1">
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            {totalNeeds > 0 ? `${totalNeeds} waiting on you` : totalLive > 0 ? `${totalLive} live across your crews` : 'Your crews'}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]}</h1>
        </div>
        <Avatar name={user?.name} color={user?.avatarColor} size={40} />
      </div>

      {crews.length === 0 ? (
        <div className="mt-4"><EmptyState title="No crews yet" sub="Join a club below and your crews — with who's around and what's live — show up here." /></div>
      ) : (
        <Section title="Your crews">
          <div className="space-y-2.5">
            {crews.map((c) => <CrewTile key={c.clubId} crew={c} />)}
          </div>
        </Section>
      )}

      {joinable.length > 0 && (
        <Section title="Find a crew" action={<button onClick={() => navigate('/discover/clubs')} className="text-[12px] font-semibold text-accent-gold">See all →</button>}>
          <div className="space-y-2">
            {joinable.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-[20px] border border-border bg-bg-card p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl" style={{ background: c.color }}>{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-text-primary">{c.name}</p>
                  <p className="text-[12px] text-text-muted">📍 {c.location ?? '—'} · 👥 {c.members.length} members</p>
                </div>
                <Btn size="sm" variant="secondary" loading={requestJoin.isPending} onClick={() => requestJoin.mutate(c.id)}>+ Request</Btn>
              </div>
            ))}
          </div>
        </Section>
      )}
      <div className="h-2" />
    </div>
  )
}
