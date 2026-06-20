import { ChevronLeft, Compass, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow } from '@/components/common/cards'
import type { ClubView } from '@/types'

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  return (
    <Btn size="sm" variant="secondary" onClick={() => req.mutate(club.id)} loading={req.isPending}>
      <Plus className="h-3.5 w-3.5" /> Request
    </Btn>
  )
}

// The full "clubs to join" list — reached via Discover's "View all". A sub-page
// (back button), not a nav tab; grouped near-you first.
export function JoinClubsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const clubs = useRecentClubs()

  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Clubs to join</h1>
      <p className="text-sm text-text-secondary">Request to join — the host vets &amp; admits you.</p>

      {clubs.isLoading ? (
        <Section title="Clubs to join"><Spinner /></Section>
      ) : joinable.length === 0 ? (
        <Section title="Clubs to join"><EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab, or join with an invite code." /></Section>
      ) : (
        <>
          {near.length > 0 && (
            <Section title={`Near you in ${user?.location}`}>
              <div className="flex flex-col gap-2">
                {near.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
              </div>
            </Section>
          )}
          {others.length > 0 && (
            <Section title={near.length > 0 ? 'More clubs to join' : 'Clubs to join'}>
              <div className="flex flex-col gap-2">
                {others.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
