import { useNavigate } from 'react-router-dom'
import { Clock, Compass, Info, UserCircle2, Send, ChevronRight, type LucideIcon } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { Card } from '@/components/common/ui'
import { GetStartedHub } from '@/pages/GetStartedHub'

function ExploreRow({ icon: Icon, title, sub, onClick }: { icon: LucideIcon; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-surface cursor-pointer">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-surface text-text-secondary"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="block text-[11px] text-text-muted">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </button>
  )
}

/**
 * Onboarding Phase 4 — the warm "while you wait" surface for a player whose club
 * request is PENDING (the default path, since every join is host-approved). Shown
 * as Home instead of the generic hub; no bottom nav yet (Stage 0). Invites them to
 * explore so waiting isn't a dead spinner.
 */
export function ClubPendingSurface() {
  const navigate = useNavigate()
  const clubs = useMyClubs()
  const club = (clubs.data ?? []).find((c) => c.myStatus === 'pending')
  if (!club) return <GetStartedHub />

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-amber"><Clock className="h-3.5 w-3.5" />Pending approval</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Waiting on {club.emoji} {club.name}</h1>
      </div>
      <Card className="border-accent-amber/30 bg-accent-amber/5">
        <p className="text-sm leading-snug text-text-secondary"><span className="font-bold text-text-primary">Your request is in.</span> The host will admit you after a quick look — you'll get a notification the moment you're in, and any game you were invited to is queued for you.</p>
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold text-text-secondary">While you wait</p>
        <div className="flex flex-col gap-2">
          <ExploreRow icon={Compass} title="Browse other clubs" sub="Find and request to join more — don't wait on just one" onClick={() => navigate('/discover/clubs')} />
          <ExploreRow icon={Info} title={`About ${club.name}`} sub="Description, host, members & past results" onClick={() => navigate(`/club/${club.id}`)} />
          <ExploreRow icon={Send} title="Get notified — link Telegram" sub="A ping the moment you're admitted or a game opens" onClick={() => navigate(`/club/${club.id}`)} />
          <ExploreRow icon={UserCircle2} title="Finish your profile" sub="Add a photo & city so the host sees a real person" onClick={() => navigate('/me')} />
        </div>
      </div>
    </div>
  )
}
