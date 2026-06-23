import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useMyClubs, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn } from '@/components/common/ui'
import { ClubRow, WaitingBadge } from '@/components/common/cards'
import type { ClubView } from '@/types'

// Shared "Clubs to join" preview — IDENTICAL on the Player Discover home and the
// Club Host home (one source of truth). A **"Pending approval"** group lists every
// club you've requested (from `useMyClubs`, so it catches private/older requests too)
// with a "Waiting for approval" pill, then up to 3 joinable clubs, **near you first,
// most-recently-created within** (`useRecentClubs` is sorted newest-first and excludes
// private clubs), with "See all" → the full `/discover/clubs` list. Capped so it never
// buries the rest of the page.
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
  const myClubs = useMyClubs()

  // Your in-flight requests — authoritative from your own memberships (catches
  // private/older clubs that may not be in the recent-clubs feed).
  const pending = (myClubs.data ?? []).filter((c) => c.myStatus === 'pending')
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable
  const top = [...near, ...others].slice(0, CLUBS_CAP)

  if (clubs.isLoading && pending.length === 0) return <Section title="Clubs to join"><Spinner /></Section>

  return (
    <>
      {/* Pending approval — every club you've requested, still waiting on a host. */}
      {pending.length > 0 && (
        <Section title={`Pending approval · ${pending.length}`}>
          <div className="flex flex-col gap-2">{pending.map((c) => <ClubRow key={c.id} club={c} right={<WaitingBadge />} />)}</div>
        </Section>
      )}

      {/* Clubs you can still join. When there are NONE we render nothing at all —
          no bland "no clubs" empty state. The cold-start hub shows a warm welcome
          in its place (HubWelcome); other surfaces simply omit the section. */}
      {joinable.length > 0 && (
        <Section
          title={`Clubs to join · ${joinable.length}`}
          action={joinable.length > CLUBS_CAP
            ? <button type="button" onClick={() => navigate('/discover/clubs')} className="text-xs font-semibold text-accent-blue cursor-pointer">See all →</button>
            : undefined}
        >
          <div className="flex flex-col gap-2">{top.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}</div>
        </Section>
      )}
    </>
  )
}
