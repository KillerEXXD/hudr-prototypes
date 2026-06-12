import { Link } from 'react-router-dom'
import { Bookmark, Crown, Mail, CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks'
import PlayerAvatar from '@/components/player/PlayerAvatar'

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading || !user) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
  }

  const rows = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: CalendarDays, label: 'Member since', value: user.memberSince },
  ]
  const links = [
    { to: '/saved', icon: Bookmark, label: 'Saved players & tournaments' },
    { to: '/subscription', icon: Crown, label: 'Subscription', badge: user.planId },
  ]

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Profile</h1>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-bg-card to-bg-surface p-4">
        <PlayerAvatar initials={user.initials} color={user.color} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-lg font-bold leading-tight">{user.name}</div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-blue">
            <Crown className="h-3 w-3" /> {user.planId}
          </span>
        </div>
      </div>

      <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-bg-card">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-muted">{label}</span>
            <span className="ml-auto truncate text-sm font-medium text-text-primary">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
          >
            <Icon className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {badge && <span className="rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-blue">{badge}</span>}
            <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
