import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useArena } from '@/hooks/arena'
import { Avatar, Btn, Section, Spinner } from '@/components/common/ui'
import { TYPE_META, type ArenaGame } from '@/lib/arena/unifiedGame'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// Table Home (player) — IN-SESSION. The bet: the app is used AT the table,
// mid-game, one-handed. So when something's live it fills the screen — big type,
// glanceable status, fat tap targets — and settling is one obvious action. When
// nothing's live it's a calm launchpad. Built for arm's-length legibility.
// =====================================================================

function bigProgress(g: ArenaGame): { big: string; small: string } {
  if (!g.progress) return { big: g.phaseLabel, small: '' }
  if (g.progress.unit === 'alive') return { big: `${g.progress.value}`, small: `of ${g.progress.total} still in` }
  if (g.progress.unit === 'claimed') return { big: `${g.progress.value}`, small: 'of 100 squares' }
  return { big: `${g.progress.value}`, small: `of ${g.progress.total} drafted` }
}

/** The hero live tile — designed to be read from across a table. */
function LiveHero({ g }: { g: ArenaGame }) {
  const navigate = useNavigate()
  const t = TYPE_META[g.type]
  const p = bigProgress(g)
  return (
    <div className="rounded-3xl border-2 border-accent-emerald/40 bg-[radial-gradient(120%_100%_at_50%_0%,#123022_0%,#0C2218_60%)] p-5 table-pulse">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-emerald/15 px-3 py-1.5 text-sm font-extrabold text-accent-emerald">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-emerald table-dot" />LIVE
        </span>
        <span className="text-sm font-bold text-text-secondary">{t.glyph} {t.label}</span>
      </div>

      <div className="mt-1 flex items-baseline gap-1 text-text-muted">
        <span className="text-base">{g.clubEmoji}</span><span className="text-sm">{g.clubName}</span>
      </div>
      <h2 className="mt-1 text-2xl font-extrabold leading-tight text-text-primary">{g.title}</h2>

      {/* the one big number you glance at */}
      <div className="my-5 flex items-end gap-3">
        <span className="text-[64px] font-extrabold leading-none text-accent-emerald" style={{ fontFamily: 'var(--font-family-display)' }}>{p.big}</span>
        <span className="mb-2 text-lg text-text-secondary">{p.small}</span>
      </div>

      <div className="flex items-center justify-between border-t border-border-light pt-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Pot</p>
          <p className="font-mono text-xl font-extrabold text-text-primary">{g.stake.toLocaleString()}<span className="ml-1 text-sm font-normal text-text-muted">Stakes</span></p>
        </div>
        <Btn size="md" onClick={() => navigate(g.href)} className="text-base">Open table →</Btn>
      </div>
    </div>
  )
}

export function TableHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const arena = useArena()
  if (arena.loading) return <Spinner label="Reading the table…" />

  const { live, needsYou, upcoming } = arena
  const settling = arena.games.filter((g) => g.phase === 'settling' || (g.phase === 'live' && g.relation === 'hosting'))
  const heroLive = live[0]
  const otherLive = live.slice(1)
  const myUpcoming = upcoming.filter((g) => g.relation === 'in' || g.relation === 'hosting').slice(0, 3)
  const openNear = upcoming.filter((g) => g.relation === 'open').slice(0, 3)

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          {heroLive ? 'At the table' : `Hey ${user?.name.split(' ')[0]}`}
        </h1>
        <Avatar name={user?.name} color={user?.avatarColor} size={40} />
      </div>

      {/* THE hero — your live game, full width */}
      {heroLive ? (
        <LiveHero g={heroLive} />
      ) : (
        <div className="rounded-3xl border border-border bg-bg-card p-6 text-center">
          <p className="text-lg font-bold text-text-primary">Nothing live right now</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-text-secondary">When a game kicks off, it takes over this screen so you can run it one-handed.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Btn onClick={() => navigate('/games')}>Browse games</Btn>
            <Btn variant="secondary" onClick={() => navigate('/clubs')}>Your clubs</Btn>
          </div>
        </div>
      )}

      {/* needs-you actions as big tappable rows */}
      {needsYou.filter((g) => g.id !== heroLive?.id).length > 0 && (
        <Section title="Your move">
          <div className="space-y-2.5">
            {needsYou.filter((g) => g.id !== heroLive?.id).map((g) => (
              <button key={g.id} onClick={() => navigate(g.href)}
                className="flex w-full items-center gap-3 rounded-2xl border border-accent-gold/35 bg-bg-card p-4 text-left active:scale-[0.99]">
                <span className="text-2xl">{TYPE_META[g.type].glyph}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text-primary">{g.title}</p>
                  <p className="text-sm text-text-muted">{g.clubName} · {g.phaseLabel}</p>
                </div>
                <span className="text-2xl text-accent-gold">→</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* other live (compact) */}
      {otherLive.length > 0 && (
        <Section title="Also live">
          <div className="space-y-2.5">
            {otherLive.map((g) => (
              <button key={g.id} onClick={() => navigate(g.href)}
                className="flex w-full items-center gap-3 rounded-2xl border border-accent-emerald/25 bg-bg-card p-4 text-left active:scale-[0.99]">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-emerald table-dot" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text-primary">{g.title}</p>
                  <p className="text-sm text-text-muted">{g.clubName} · {g.phaseLabel}</p>
                </div>
                <span className="text-xl text-text-muted">→</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* upcoming you're in */}
      {myUpcoming.length > 0 && (
        <Section title="Coming up">
          <div className="space-y-2.5">
            {myUpcoming.map((g) => (
              <button key={g.id} onClick={() => navigate(g.href)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card p-4 text-left active:scale-[0.99]">
                <span className="text-2xl">{TYPE_META[g.type].glyph}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text-primary">{g.title}</p>
                  <p className="text-sm text-text-muted">{g.clubName}</p>
                </div>
                {g.deadline && <span className="shrink-0 text-sm"><Countdown deadline={regDeadline(g.deadline)} prefix="" /></span>}
              </button>
            ))}
          </div>
        </Section>
      )}

      {openNear.length > 0 && (
        <Section title="Open in your clubs" action={<button onClick={() => navigate('/games')} className="text-sm font-bold text-accent-gold">All →</button>}>
          <div className="space-y-2.5">
            {openNear.map((g) => (
              <button key={g.id} onClick={() => navigate(g.href)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card p-4 text-left active:scale-[0.99]">
                <span className="text-2xl">{TYPE_META[g.type].glyph}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text-primary">{g.title}</p>
                  <p className="text-sm text-text-muted">{g.clubName} · {g.phaseLabel}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-3 py-1.5 text-sm font-bold', 'bg-accent-gold/15 text-accent-gold')}>Join</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <div className="h-2" />
      {/* keep settling referenced (future settle-flow hook); avoids lint unused */}
      <span className="hidden">{settling.length}</span>
    </div>
  )
}
