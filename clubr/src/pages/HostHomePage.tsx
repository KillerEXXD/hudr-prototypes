import { useNavigate } from 'react-router-dom'
import { Home, Trophy, Clock, ChevronRight, Crown, Users } from 'lucide-react'
import { useContests, useAvailableFTs } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner } from '@/components/common/ui'
import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'

// Club Host home. Three things at a glance: the App-Admin FT slate you can host
// (compact cards → the Host page), then your active games split into the clubs
// YOU run vs other clubs you're a member of. Completed games stay on their tabs.
export function HostHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const contests = useContests()
  const games = useGames()
  const fts = useAvailableFTs()

  const activeFt = (contests.data ?? []).filter((c) => c.status !== 'settled')
  const activeLl = (games.data ?? []).filter((g) => g.status !== 'completed')
  const yourFt = activeFt.filter((c) => c.canManage)
  const otherFt = activeFt.filter((c) => !c.canManage)
  const yourLl = activeLl.filter((g) => g.canManage)
  const otherLl = activeLl.filter((g) => !g.canManage)

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-emerald"><Home className="h-3.5 w-3.5" /> Home</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Upcoming final tables available for you to host as Fantasy games in your club.</p>

      {/* ---- FTs to host (App-Admin slate) ---- */}
      <Section
        title={`FTs to host${fts.data?.length ? ` (${fts.data.length})` : ''}`}
        action={<button onClick={() => navigate('/host-ft')} className="flex items-center gap-0.5 text-xs font-semibold text-accent-purple cursor-pointer">See all <ChevronRight className="h-3.5 w-3.5" /></button>}
      >
        {fts.isLoading ? <Spinner /> : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(fts.data ?? []).slice(0, 6).map((f) => (
              <button key={f.id} onClick={() => navigate('/host-ft')} className="flex w-44 shrink-0 flex-col rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-surface active:scale-[0.99] cursor-pointer">
                <Badge tone="purple" className="self-start">{f.room}</Badge>
                <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-text-primary">{f.name}</p>
                <div className="mt-auto pt-2">
                  <div className="flex items-center gap-1 text-[11px] text-text-muted"><Trophy className="h-3 w-3 text-accent-amber" />{f.prizePool}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted"><Clock className="h-3 w-3" />{f.startsIn} · ICM ✓</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/host-ft')} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-2 text-xs font-bold text-accent-purple hover:bg-accent-purple/20 cursor-pointer">
          <Crown className="h-3.5 w-3.5" /> Host a final table
        </button>
      </Section>

      {/* ---- Your club (games you run) ---- */}
      <Section title="Your club">
        {yourFt.length + yourLl.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-bg-card/50 px-3 py-4 text-center text-xs text-text-muted">Nothing live in your club right now. Host an FT above, or start a Last Longer.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {yourFt.map((c) => <ContestRow key={c.id} c={c} />)}
            {yourLl.map((g) => <GameRow key={g.id} g={g} />)}
          </div>
        )}
      </Section>

      {/* ---- Other clubs you're a member of ---- */}
      {otherFt.length + otherLl.length > 0 && (
        <Section title="Other clubs you're in" action={<Badge tone="neutral"><Users className="h-3 w-3" />member</Badge>}>
          <div className="flex flex-col gap-2">
            {otherFt.map((c) => <ContestRow key={c.id} c={c} />)}
            {otherLl.map((g) => <GameRow key={g.id} g={g} />)}
          </div>
        </Section>
      )}
    </div>
  )
}
