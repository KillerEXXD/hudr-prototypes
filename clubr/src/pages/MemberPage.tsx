import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Mail, Phone, Target, Timer, Lock, MapPin } from 'lucide-react'
import { useMemberProfile } from '@/hooks'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'

export function MemberPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: m, isLoading, isError, refetch } = useMemberProfile(id)

  // Where to return to: callers pass the origin in router state so Back always goes to
  // *where you came from* (even a private club / deep link). Falls back to history (-1).
  // Rendered in EVERY state and prominent so it's never missed.
  const from = (location.state as { from?: string } | null)?.from
  const goBack = () => (from ? navigate(from) : navigate(-1))
  const back = (
    <button onClick={goBack} className="mb-3 inline-flex items-center gap-1 rounded-lg border border-border bg-bg-surface px-2.5 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
  )

  if (isLoading) return <div className="animate-fade-up">{back}<Spinner label="Loading member…" /></div>
  if (isError) return (
    <div className="animate-fade-up">
      {back}
      <div className="flex flex-col items-center gap-3 py-2">
        <EmptyState title="Couldn't load this member" sub="Check your connection and try again." />
        <Btn variant="secondary" onClick={() => refetch()}>Retry</Btn>
      </div>
    </div>
  )
  if (!m) return <div className="animate-fade-up">{back}<EmptyState title="Member not found" /></div>

  const roleTone = { admin: 'purple', host: 'green', player: 'blue' } as const

  return (
    <div className="animate-fade-up">
      {back}

      <div className="flex items-center gap-3">
        <Avatar name={m.user.name} color={m.user.avatarColor} pic={m.user.avatarUrl} size={56} />
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{m.user.name}</h1><p className="flex items-center gap-1 text-xs text-text-muted">{m.user.handle ? <>@{m.user.handle}</> : null}{m.user.location ? <>{m.user.handle ? ' · ' : null}<MapPin className="h-3 w-3" />{m.user.location}</> : null}</p></div>
        <Badge tone={roleTone[m.user.role]}>{m.user.role}</Badge>
      </div>

      {m.canSeeContact ? (
        <Section title="Contact">
          <Card className="flex flex-col gap-2">
            <a href={`mailto:${m.user.email}`} className="flex items-center gap-2 text-sm text-text-primary hover:text-accent-blue"><Mail className="h-4 w-4 text-text-muted" />{m.user.email}</a>
            {m.user.phone && <a href={`tel:${m.user.phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-2 text-sm text-text-primary hover:text-accent-blue"><Phone className="h-4 w-4 text-text-muted" />{m.user.phone}</a>}
          </Card>
        </Section>
      ) : (
        <Card className="mt-3 flex items-start gap-2 text-xs text-text-muted"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Contact details are visible only to the host/admin of a club this member is in.</Card>
      )}

      <Section title="Track record">
        <div className="grid grid-cols-2 gap-2">
          <Card className="flex items-center gap-2"><Target className="h-5 w-5 text-accent-purple" /><div><p className="text-lg font-extrabold text-text-primary">{m.ftLifetime}</p><p className="text-[11px] text-text-muted">FT Fantasy played</p></div></Card>
          <Card className="flex items-center gap-2"><Timer className="h-5 w-5 text-accent-amber" /><div><p className="text-lg font-extrabold text-text-primary">{m.llLifetime}</p><p className="text-[11px] text-text-muted">Last Longers played</p></div></Card>
        </div>
        <p className="mt-1.5 text-[11px] text-text-muted">Lifetime totals. The games below are only those you can see (your clubs).</p>
      </Section>

      {(m.publicClubs.length > 0 || m.privateClubCount > 0) && (
        <Section title="Clubs">
          <div className="flex flex-col gap-1.5">
            {m.publicClubs.map((c) => (
              <button key={c.id} type="button" onClick={() => navigate(`/club/${c.id}`)} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-left transition-colors hover:bg-bg-surface cursor-pointer">
                <span className="text-lg leading-none">{c.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{c.name}</span>
              </button>
            ))}
            {m.privateClubCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-bg-card/50 px-3 py-2">
                <Lock className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="flex-1 text-sm text-text-secondary">Private clubs · {m.privateClubCount}</span>
                <span className="text-[10px] text-text-muted">names hidden</span>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="History">
        {m.games.length === 0 ? (
          <EmptyState title="No shared games" sub="You don't share any games with this member yet." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {m.games.map((g) => (
              <Card key={`${g.kind}_${g.id}`} onClick={() => navigate(g.kind === 'ft' ? `/fantasy/${g.id}` : `/lastlonger/${g.id}`)} className="flex items-center gap-2.5 p-2.5">
                {g.kind === 'ft' ? <Target className="h-4 w-4 shrink-0 text-accent-purple" /> : <Timer className="h-4 w-4 shrink-0 text-accent-amber" />}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{g.title}</p><p className="truncate text-[11px] text-text-muted">{g.clubName} · {g.status}</p></div>
                <Badge tone="neutral">{g.result}</Badge>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
