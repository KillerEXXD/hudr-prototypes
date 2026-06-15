import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { useRecentClubs, useRecentContests, useRecentLastLongers, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn } from '@/components/common/ui'
import { ClubRow, ContestCard, LastLongerCard, MembershipBadge } from '@/components/common/cards'
import type { ClubView } from '@/types'

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  if (club.myStatus !== 'none') return <MembershipBadge status={club.myStatus} />
  return (
    <Btn size="sm" variant="secondary" onClick={() => req.mutate(club.id)} disabled={req.isPending}>
      <Plus className="h-3.5 w-3.5" /> {req.isPending ? '…' : 'Request'}
    </Btn>
  )
}

export function DiscoverPage() {
  const { user } = useAuth()
  const clubs = useRecentClubs()
  const contests = useRecentContests()
  const lls = useRecentLastLongers()
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Find a club, request to join, and play once the host approves.</p>

      <Section title="Recent clubs" action={<button onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-accent-blue cursor-pointer">{showAll ? 'Show less' : 'See all'}</button>}>
        {clubs.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {(showAll ? clubs.data : clubs.data?.slice(0, 4))?.map((c) => (
              <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent FT Fantasy contests">
        {contests.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">{contests.data?.map((c) => <ContestCard key={c.id} c={c} />)}</div>
        )}
      </Section>

      <Section title="Recent Last Longers">
        {lls.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">{lls.data?.map((ll) => <LastLongerCard key={ll.id} ll={ll} />)}</div>
        )}
      </Section>
    </div>
  )
}
