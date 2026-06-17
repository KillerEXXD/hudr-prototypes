import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ChevronRight, HelpCircle, TrendingUp, Medal, Gamepad2, CalendarDays } from 'lucide-react'
import { useClubLeaderboard } from '@/hooks/leaderboard'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Section, Sheet, Spinner, EmptyState } from '@/components/common/ui'
import { HowItWorks, type HowStep } from '@/components/common/HowItWorks'
import { cn } from '@/lib/utils/cn'

const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r))

function seasonLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const LB_STEPS: HowStep[] = [
  { icon: Trophy, title: 'One board per club', body: 'This leaderboard belongs to this club only. Points you earn here count toward this club — every club keeps its own separate board.' },
  { icon: TrendingUp, title: 'Points scale with the field', body: 'Each finish earns round(B × √N ÷ √rank) points, where N is how many played. Winning a bigger game is worth more, and 1st is worth far more than mid-pack.' },
  { icon: Medal, title: 'Only the top third score', body: 'Roughly the top third of the field earns points; everyone below gets zero. A game needs at least 4 players to count.' },
  { icon: Gamepad2, title: 'Every game type counts', body: 'FT Fantasy, Last Longer and Football Squares all feed the same board. Squares counts half — it’s mostly luck.' },
  { icon: CalendarDays, title: 'Fresh every month', body: 'Standings reset at the start of each calendar month, so there’s always a new race. Past months stay viewable.' },
  { icon: Medal, title: 'Ties go to the winner', body: 'Level on points? Most 1st-place finishes wins, then most podiums (top-3s).' },
]

/** Per-CLUB standings for one month — points by finish & field size across FT,
 *  Last Longer & Squares. Lives on the Club Detail page; scoped to this club
 *  only (no app-wide board). SPEC §20. */
export function LeaderboardSection({ clubId, clubName, clubEmoji }: { clubId: string; clubName: string; clubEmoji: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [season, setSeason] = useState<string | undefined>(undefined)
  const [howOpen, setHowOpen] = useState(false)
  const { data, isLoading } = useClubLeaderboard(clubId, season)

  return (
    <Section
      title="Club leaderboard"
      action={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <HelpCircle className="h-3 w-3" />How points work
          </button>
          {data && data.seasons.length > 0 && (
            <select
              aria-label="Leaderboard season"
              value={data.season}
              onChange={(e) => setSeason(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber cursor-pointer"
            >
              {data.seasons.map((s) => <option key={s} value={s}>{seasonLabel(s)}</option>)}
            </select>
          )}
        </div>
      }
    >
      <p className="mb-2 text-[11px] leading-snug text-text-muted">
        Standings for <b className="text-text-secondary">{clubEmoji} {clubName}</b> — <b className="text-text-secondary">this club only</b>; every club keeps
        its own board. Points come from finishing in this club's FT Fantasy, Last Longer &amp; Football Squares games (Squares counts half). Resets monthly.
      </p>
      {isLoading ? (
        <Spinner />
      ) : !data || data.entries.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-7 w-7" />}
          title={`No counted games in ${clubName} yet this season`}
          sub="Standings appear once the club finishes a game with at least 4 players."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.entries.map((e) => {
            const isMe = e.userId === user?.id
            return (
              <button
                key={e.userId}
                type="button"
                onClick={() => navigate(`/member/${e.userId}`)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-bg-surface cursor-pointer',
                  isMe ? 'border-accent-blue/50 bg-accent-blue/10' : e.rank <= 3 ? 'border-accent-amber/40 bg-bg-card' : 'border-border bg-bg-card',
                )}
              >
                <span className={cn('w-6 shrink-0 text-center text-sm font-extrabold', e.rank > 3 && 'text-text-muted')}>{medal(e.rank)}</span>
                <Avatar name={e.name} color={e.avatarColor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{e.name}{isMe && <span className="ml-1 text-[10px] text-accent-blue">(you)</span>}</p>
                  <p className="truncate text-[11px] text-text-muted">
                    {e.wins > 0 && <span className="text-accent-amber">{e.wins}× 🥇 · </span>}
                    {e.podiums} podium{e.podiums === 1 ? '' : 's'} · {e.games} game{e.games === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-base font-extrabold text-text-primary">
                  {e.points}<span className="ml-0.5 text-[10px] font-normal text-text-muted">pts</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              </button>
            )
          })}
        </div>
      )}

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title={`How ${clubName}'s leaderboard works`}>
        <HowItWorks steps={LB_STEPS} dotBg="bg-accent-amber" iconColor="text-accent-amber" />
      </Sheet>
    </Section>
  )
}
