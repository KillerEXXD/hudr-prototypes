import { ChevronLeft, Compass, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useMyClubs, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow, WaitingBadge } from '@/components/common/cards'
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
  const myClubs = useMyClubs()

  const pending = (myClubs.data ?? []).filter((c) => c.myStatus === 'pending')
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Clubs to join</h1>
      <p className="text-sm text-text-secondary">Request to join — the host vets &amp; admits you.</p>

      {/* Start your own — always available here so the full list never dead-ends a
          player who'd rather host than join. Opens the create-club sheet (Clubs tab);
          returnTo brings them back here if they cancel instead of stranding them on My Clubs. */}
      <Btn className="mt-3 w-full" onClick={() => navigate('/clubs', { state: { create: true, returnTo: '/discover/clubs' } })}><Plus className="h-4 w-4" />Create a club</Btn>

      {/* Pending approval — every club you've requested, still waiting on a host. */}
      {pending.length > 0 && (
        <Section title={`Pending approval · ${pending.length}`}>
          <div className="flex flex-col gap-2">{pending.map((c) => <ClubRow key={c.id} club={c} right={<WaitingBadge />} />)}</div>
        </Section>
      )}

      {clubs.isLoading ? (
        <Section title="Clubs to join"><Spinner /></Section>
      ) : joinable.length === 0 ? (
        // Don't show the "you're in every club" dead-end while requests are pending.
        pending.length === 0 ? (
          <Section title="Clubs to join"><EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab, or join with an invite code." /></Section>
        ) : null
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
