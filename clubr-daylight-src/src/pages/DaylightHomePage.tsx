import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAgenda } from '@/hooks/agenda'
import { useMyClubs, useRecentClubs, useRequestToJoin } from '@/hooks'
import { Avatar, Badge, Btn, Section, Spinner } from '@/components/common/ui'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { TYPE_META, type ArenaGame } from '@/lib/arena/unifiedGame'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// Daylight Home — CALENDAR-FIRST, thread-organized. The SAME layout whether you
// have one game or twenty: club life is a schedule. Sections render only when
// they have content, so a one-club / one-game member sees a focused, full
// screen built around that single thread, and a veteran sees a rich week — no
// empty modules. This is the "scales 1→N" requirement, applied app-wide.
// =====================================================================

const TYPE_DOT: Record<ArenaGame['type'], string> = {
  ft: 'bg-accent-purple', ll: 'bg-accent-gold', squares: 'bg-accent-emerald',
}

/** One agenda row — a date-led line item, like a calendar entry. */
function AgendaRow({ g }: { g: ArenaGame }) {
  const navigate = useNavigate()
  const t = TYPE_META[g.type]
  const live = g.phase === 'live'
  return (
    <button onClick={() => navigate(g.href)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card p-4 text-left shadow-[0_2px_10px_-6px_rgba(30,42,36,0.12)] transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_-10px_rgba(30,42,36,0.18)] active:translate-y-0">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', live ? 'bg-accent-emerald/12' : 'bg-bg-surface')}>{g.clubEmoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-accent-emerald day-dot' : TYPE_DOT[g.type])} />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t.label} · {g.clubName}</span>
        </div>
        <p className="mt-0.5 truncate text-[15px] font-semibold text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>{g.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-text-secondary">
          {live ? <span className="font-semibold text-accent-emerald">{g.phaseLabel}</span>
            : g.phase === 'open' && g.deadline ? <Countdown deadline={regDeadline(g.deadline)} prefix="Closes in" />
            : <span>{g.phaseLabel}</span>}
          {g.result && <span className={cn('font-semibold', g.result.won ? 'text-accent-gold' : 'text-text-muted')}>{g.result.won ? '· Won 🏆' : g.result.rank > 0 ? `· #${g.result.rank}` : ''}</span>}
        </div>
      </div>
      {g.needsYou && <Badge tone="gold">Your move</Badge>}
    </button>
  )
}

export function DaylightHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const agenda = useAgenda()
  const myClubs = useMyClubs()
  const clubs = useRecentClubs()
  const requestJoin = useRequestToJoin()

  if (agenda.loading) return <Spinner label="Setting out your week…" />

  const joinedClubs = (myClubs.data ?? []).filter((c) => c.myStatus === 'member')
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none').slice(0, 3)
  const { sections, openToJoin, mineCount, needsYou } = agenda

  // The greeting adapts to how full your week is — but the layout is identical.
  const headline =
    needsYou.length > 0 ? `${needsYou.length} ${needsYou.length === 1 ? 'thing needs' : 'things need'} you`
    : sections.some((s) => s.bucket === 'now') ? 'Happening now'
    : mineCount > 0 ? 'Your week'
    : joinedClubs.length > 0 ? 'All quiet — for now' : 'Welcome'

  // Date string — the calendar framing
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="animate-fade-up">
      {/* Masthead — editorial date line + greeting */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-gold">{today}</p>
          <h1 className="mt-0.5 text-[26px] font-semibold tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>
            {headline}
          </h1>
        </div>
        <button onClick={() => navigate('/me')}><Avatar name={user?.name} color={user?.avatarColor} size={42} /></button>
      </div>

      {/* AGENDA — the schedule. Each bucket is a dated section; only non-empty
          buckets render, so the page is full at 1 thread and rich at N. */}
      {sections.map((sec) => (
        <Section key={sec.bucket} title={sec.label}>
          <div className="space-y-2.5">
            {sec.games.map((g) => <AgendaRow key={`${g.type}-${g.id}`} g={g} />)}
          </div>
        </Section>
      ))}

      {/* Single-thread / quiet floor: when you have a club but nothing scheduled,
          this is a warm, specific nudge — never an empty grid. */}
      {sections.length === 0 && joinedClubs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-bg-card p-6 text-center shadow-[0_2px_12px_-6px_rgba(30,42,36,0.12)]">
          <p className="text-[17px] font-semibold text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>
            Nothing on the calendar yet
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-text-secondary">
            When {joinedClubs.length === 1 ? joinedClubs[0].name : 'your clubs'} runs a game — a Last Longer, an FT Fantasy contest, or a Squares board — it'll show up here on the day it happens.
          </p>
          <Btn className="mt-4" variant="secondary" onClick={() => navigate(`/club/${joinedClubs[0].id}`)}>
            Open {joinedClubs.length === 1 ? joinedClubs[0].name : 'a club'}
          </Btn>
        </div>
      )}

      {/* OPEN TO JOIN — gentle "one more step", only if there's something real */}
      {openToJoin.length > 0 && (
        <Section title="Open in your clubs" action={<button onClick={() => navigate('/games')} className="text-[12px] font-semibold text-accent-emerald">See all →</button>}>
          <div className="space-y-2.5">
            {openToJoin.slice(0, 4).map((g) => <AgendaRow key={`${g.type}-${g.id}`} g={g} />)}
          </div>
        </Section>
      )}

      {/* YOUR CLUBS — compact strip; present once you have any */}
      {joinedClubs.length > 0 && (
        <Section title="Your clubs" action={<button onClick={() => navigate('/clubs')} className="text-[12px] font-semibold text-accent-emerald">All →</button>}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {joinedClubs.map((c) => (
              <button key={c.id} onClick={() => navigate(`/club/${c.id}`)}
                className="flex w-[136px] shrink-0 flex-col gap-2 rounded-2xl border border-border bg-bg-card p-3 text-left shadow-[0_2px_10px_-6px_rgba(30,42,36,0.1)] transition-all hover:-translate-y-px">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: c.color }}>{c.emoji}</span>
                <span className="truncate text-[14px] font-semibold text-text-primary">{c.name}</span>
                <span className="text-[11px] text-text-muted">{c.members.length} members</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* FIND A CLUB — the only "discovery", and only when it makes sense.
          For a brand-new user with one club this still shows, gently, below
          their actual thread — never as the first thing they see. */}
      {joinable.length > 0 && (
        <Section title={joinedClubs.length === 0 ? 'Join your first club' : 'More clubs near you'} action={<button onClick={() => navigate('/discover/clubs')} className="text-[12px] font-semibold text-accent-emerald">See all →</button>}>
          <div className="space-y-2">
            {joinable.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 shadow-[0_2px_10px_-6px_rgba(30,42,36,0.1)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: c.color }}>{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-text-primary">{c.name}</p>
                  <p className="text-[12px] text-text-muted">📍 {c.location ?? '—'} · {c.members.length} members</p>
                </div>
                <Btn size="sm" variant="secondary" loading={requestJoin.isPending} onClick={() => requestJoin.mutate(c.id)}>Request</Btn>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="h-3" />
    </div>
  )
}
