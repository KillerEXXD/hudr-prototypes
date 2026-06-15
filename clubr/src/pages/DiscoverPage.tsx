import { useState } from 'react'
import { Sparkles, Plus, Compass } from 'lucide-react'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow } from '@/components/common/cards'
import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'
import type { ClubView } from '@/types'

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  return (
    <Btn size="sm" variant="secondary" onClick={() => req.mutate(club.id)} disabled={req.isPending}>
      <Plus className="h-3.5 w-3.5" /> {req.isPending ? '…' : 'Request'}
    </Btn>
  )
}

export function DiscoverPage() {
  const { user } = useAuth()
  const clubs = useRecentClubs()
  const contests = useContests()
  const games = useGames()
  const [showAll, setShowAll] = useState(false)

  // Discover = act-on surface: clubs you can JOIN + live/open games only.
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const liveContests = (contests.data ?? []).filter((c) => c.status !== 'settled')
  const liveGames = (games.data ?? []).filter((g) => g.status !== 'completed')

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">New clubs to join, and games happening right now.</p>

      <Section title="Clubs to join" action={joinable.length > 4 ? <button onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-accent-blue cursor-pointer">{showAll ? 'Show less' : 'See all'}</button> : undefined}>
        {clubs.isLoading ? <Spinner /> : joinable.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(showAll ? joinable : joinable.slice(0, 4)).map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
          </div>
        ) : (
          <EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab." />
        )}
      </Section>

      {liveContests.length > 0 && (
        <Section title="FT Fantasy — open now">
          <div className="flex flex-col gap-2">{liveContests.slice(0, 3).map((c) => <ContestRow key={c.id} c={c} />)}</div>
        </Section>
      )}

      {liveGames.length > 0 && (
        <Section title="Last Longer — live now">
          <div className="flex flex-col gap-2">{liveGames.slice(0, 3).map((g) => <GameRow key={g.id} g={g} />)}</div>
        </Section>
      )}
    </div>
  )
}
