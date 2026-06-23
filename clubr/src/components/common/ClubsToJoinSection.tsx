import type { ReactNode } from 'react'
import { Plus, Clock, Compass, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useMyClubs, useRequestToJoin } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner, Btn } from '@/components/common/ui'
import { ClubRow, WaitingBadge } from '@/components/common/cards'
import { cn } from '@/lib/utils/cn'
import type { ClubView } from '@/types'

// Shared "Clubs to join" preview — IDENTICAL on the Player Discover home, the Club
// Host home, the cold-start hub, the Clubs tab AND the Golden Discover feed
// (FeltGamesFeed) — one source of truth, so its headings look the same in every skin.
// A **"Pending approval"** group lists every club you've requested (from `useMyClubs`,
// so it catches private/older requests too) with a "Waiting for approval" pill, then up
// to 3 joinable clubs, **near you first, most-recently-created within** (`useRecentClubs`
// is sorted newest-first and excludes private clubs), with "See all" → the full
// `/discover/clubs` list. Capped so it never buries the rest of the page.
const CLUBS_CAP = 3

// A prominent, unmistakable section header for the onboarding "join" surfaces:
// an icon in a tinted rounded badge + a bold heading + a count chip + a subtitle.
// Replaces the old tiny uppercase muted <Section> label, which users found too subtle
// to read as a heading. Uses ONLY semantic theme tokens (text-text-primary, accent-*, …)
// so it renders correctly in every skin, including Golden. The count chip sits OUTSIDE
// the <h2> so the heading's accessible name stays exactly the title.
function JoinHeader({ icon: Icon, tone, title, sub, count, action }: {
  icon: LucideIcon
  tone: 'amber' | 'blue'
  title: string
  sub: string
  count?: number
  action?: ReactNode
}) {
  const tint = tone === 'amber' ? 'bg-accent-amber/15 text-accent-amber' : 'bg-accent-blue/15 text-accent-blue'
  return (
    <div className="mb-3 mt-6 flex items-center gap-3 px-0.5">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tint)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight text-text-primary">{title}</h2>
          {count != null && <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums', tint)}>{count}</span>}
        </div>
        <p className="truncate text-xs text-text-muted">{sub}</p>
      </div>
      {action}
    </div>
  )
}

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

  if (clubs.isLoading && pending.length === 0) {
    return (
      <section>
        <JoinHeader icon={Compass} tone="blue" title="Clubs to join" sub="Finding clubs near you…" />
        <Spinner />
      </section>
    )
  }

  return (
    <>
      {/* Pending approval — every club you've requested, still waiting on a host. */}
      {pending.length > 0 && (
        <section>
          <JoinHeader icon={Clock} tone="amber" title="Pending approval" sub="Waiting on the host to let you in" count={pending.length} />
          <div className="flex flex-col gap-2">{pending.map((c) => <ClubRow key={c.id} club={c} right={<WaitingBadge />} />)}</div>
        </section>
      )}

      {/* Clubs you can still join. When there are NONE we render nothing at all —
          no bland "no clubs" empty state. The cold-start hub shows a warm welcome
          in its place (HubWelcome); other surfaces simply omit the section. */}
      {joinable.length > 0 && (
        <section>
          <JoinHeader
            icon={Compass}
            tone="blue"
            title="Clubs to join"
            sub="Find your crew — tap to request a spot"
            count={joinable.length}
            action={joinable.length > CLUBS_CAP
              ? <button type="button" onClick={() => navigate('/discover/clubs')} className="shrink-0 text-xs font-semibold text-accent-blue cursor-pointer">See all →</button>
              : undefined}
          />
          <div className="flex flex-col gap-2">{top.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}</div>
        </section>
      )}
    </>
  )
}
