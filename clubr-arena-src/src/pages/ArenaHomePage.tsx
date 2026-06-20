import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useArena } from '@/hooks/arena'
import { ArenaCard } from '@/components/arena/ArenaCard'
import { Avatar, Badge, Btn, EmptyState, Section, Spinner } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// Arena Home (player) — LIVE-FIRST. The redesign's thesis: a player opening
// the app has one of two intents — "what's happening that I'm in" or "where do
// I stand with my crews." So we lead with state (needs-you → live → upcoming),
// surface the relationship ledger, and push discovery below the fold.
// =====================================================================

function StakesNet({ n }: { n: number }) {
  const up = n > 0, flat = n === 0
  return (
    <span className={cn('font-mono font-bold tabular-nums', up ? 'text-accent-emerald' : flat ? 'text-text-secondary' : 'text-accent-red')}>
      {up ? '+' : ''}{n.toLocaleString()}<span className="ml-0.5 text-[0.7em] font-normal text-text-muted">Stakes</span>
    </span>
  )
}

export function ArenaHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const arena = useArena()
  const clubs = useRecentClubs()
  const requestJoin = useRequestToJoin()
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none').slice(0, 3)

  if (arena.loading) return <Spinner label="Loading your games…" />

  const { needsYou, live, upcoming, ledger } = arena
  const liveNotNeeding = live.filter((g) => !g.needsYou)
  const upcomingNotNeeding = upcoming.filter((g) => !g.needsYou && (g.relation === 'in' || g.relation === 'hosting'))
  const openToJoin = upcoming.filter((g) => g.relation === 'open')
  const quiet = needsYou.length === 0 && live.length === 0 && upcomingNotNeeding.length === 0

  return (
    <div className="space-y-1">
      {/* Greeting — quiet, the games are the hero */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            {needsYou.length > 0 ? `${needsYou.length} ${needsYou.length === 1 ? 'thing needs' : 'things need'} you` : live.length > 0 ? 'Live now' : 'All quiet'}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]}</h1>
        </div>
        <Avatar name={user?.name} color={user?.avatarColor} size={40} />
      </div>

      {/* 1 · NEEDS YOU — the most important pixels. Only shows when real. */}
      {needsYou.length > 0 && (
        <Section title="Needs you now">
          <div className="space-y-2.5">
            {needsYou.map((g) => <ArenaCard key={g.id} g={g} />)}
          </div>
        </Section>
      )}

      {/* 2 · LIVE (that you're in, not already in needs-you) */}
      {liveNotNeeding.length > 0 && (
        <Section title="Live in your clubs">
          <div className="space-y-2.5">
            {liveNotNeeding.map((g) => <ArenaCard key={g.id} g={g} />)}
          </div>
        </Section>
      )}

      {/* 3 · UPCOMING you're in / hosting */}
      {upcomingNotNeeding.length > 0 && (
        <Section title="Coming up">
          <div className="space-y-2.5">
            {upcomingNotNeeding.map((g) => <ArenaCard key={g.id} g={g} />)}
          </div>
        </Section>
      )}

      {/* Quiet-state direction (errors-as-direction principle) */}
      {quiet && (
        <div className="mt-4">
          <EmptyState
            title="Nothing live right now"
            sub="When your clubs open a game — FT Fantasy, Last Longer or Squares — it'll surface here first. Browse what's open below, or jump into a club."
          />
        </div>
      )}

      {/* 4 · YOUR LEDGER — the relationship tally. The retention surface. */}
      {ledger.lines.length > 0 && (
        <Section title="Where you stand" action={
          <button onClick={() => navigate('/ledger')} className="text-[12px] font-semibold text-accent-gold">Full ledger →</button>
        }>
          <button onClick={() => navigate('/ledger')} className="w-full cursor-pointer rounded-2xl border border-border bg-bg-card p-4 text-left transition-all hover:border-border-light active:scale-[0.99]">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Net across all crews</p>
                <p className="mt-0.5 text-2xl"><StakesNet n={ledger.totals.net} /></p>
              </div>
              <div className="text-right text-[12px] text-text-secondary">
                <span className="font-mono font-bold text-text-primary tabular-nums">{ledger.totals.cashes}</span> cashes ·{' '}
                <span className="font-mono font-bold text-text-primary tabular-nums">{Math.round(ledger.totals.cashRate * 100)}%</span> rate
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {ledger.lines.slice(0, 4).map((l) => (
                <span key={l.clubId} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-surface px-2 py-1 text-[11px]">
                  <span aria-hidden>{l.clubEmoji}</span>
                  <span className="text-text-secondary">{l.clubName.split(' ')[0]}</span>
                  <StakesNet n={l.net} />
                </span>
              ))}
            </div>
          </button>
        </Section>
      )}

      {/* 5 · OPEN TO JOIN — open games in your clubs you haven't joined */}
      {openToJoin.length > 0 && (
        <Section title="Open in your clubs" action={
          <button onClick={() => navigate('/games')} className="text-[12px] font-semibold text-accent-gold">All games →</button>
        }>
          <div className="space-y-2.5">
            {openToJoin.slice(0, 4).map((g) => <ArenaCard key={g.id} g={g} />)}
          </div>
        </Section>
      )}

      {/* 6 · DISCOVERY — below the fold, where it belongs */}
      {joinable.length > 0 && (
        <Section title="Clubs to join" action={
          <button onClick={() => navigate('/discover/clubs')} className="text-[12px] font-semibold text-accent-gold">See all →</button>
        }>
          <div className="space-y-2">
            {joinable.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: c.color }}>{c.emoji}</span>
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
