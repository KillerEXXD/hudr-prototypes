import { Compass, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow } from '@/components/common/cards'
import type { ClubView } from '@/types'

// Shared "Clubs to join" preview — IDENTICAL on the Player Discover home and the
// Club Host home (one source of truth). Shows up to 3 joinable clubs, **near you
// first, most-recently-created within** (`useRecentClubs` is already sorted
// newest-first and excludes private clubs), with "See all" → the full
// `/discover/clubs` list. Capped so it never buries the rest of the page.
const CLUBS_CAP = 3

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  return (
    <Btn size="sm" variant="secondary" onClick={() => req.mutate(club.id)} loading={req.isPending}>
      <Plus className="h-3.5 w-3.5" /> Request
    </Btn>
  )
}

export function ClubsToJoinSection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const clubs = useRecentClubs()

  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable
  const top = [...near, ...others].slice(0, CLUBS_CAP)

  if (clubs.isLoading) return <Section title="Clubs to join"><Spinner /></Section>
  if (joinable.length === 0) {
    return <Section title="Clubs to join"><EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab." /></Section>
  }
  return (
    <Section
      title={`Clubs to join · ${joinable.length}`}
      action={joinable.length > CLUBS_CAP
        ? <button type="button" onClick={() => navigate('/discover/clubs')} className="text-xs font-semibold text-accent-blue cursor-pointer">See all →</button>
        : undefined}
    >
      <div className="flex flex-col gap-2">{top.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}</div>
    </Section>
  )
}
