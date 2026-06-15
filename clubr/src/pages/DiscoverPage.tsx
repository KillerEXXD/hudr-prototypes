import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow, MembershipBadge } from '@/components/common/cards'
import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'
import type { ClubView } from '@/types'

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  if (club.myStatus !== 'none') return <MembershipBadge status={club.myStatus} role={club.myRole} />
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

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Find a club, request to join, and play once the host approves.</p>

      <Section title="Recent clubs" action={<button onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-accent-blue cursor-pointer">{showAll ? 'Show less' : 'See all'}</button>}>
        {clubs.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {(showAll ? clubs.data : clubs.data?.slice(0, 4))?.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
          </div>
        )}
      </Section>

      <Section title="FT Fantasy contests">
        {contests.isLoading ? <Spinner /> : contests.data && contests.data.length > 0 ? (
          <div className="flex flex-col gap-2">{contests.data.slice(0, 3).map((c) => <ContestRow key={c.id} c={c} />)}</div>
        ) : (
          <EmptyState title="No contests in your clubs yet" sub="Join a club to see its FT Fantasy contests." />
        )}
      </Section>

      <Section title="Last Longers">
        {games.isLoading ? <Spinner /> : games.data && games.data.length > 0 ? (
          <div className="flex flex-col gap-2">{games.data.slice(0, 3).map((g) => <GameRow key={g.id} g={g} />)}</div>
        ) : (
          <EmptyState title="No games in your clubs yet" sub="Join a club to see its Last Longer games." />
        )}
      </Section>
    </div>
  )
}
