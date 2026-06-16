import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Phone, Target, Timer, Lock } from 'lucide-react'
import { useMemberProfile } from '@/hooks'
import { Avatar, Badge, Card, Section, Spinner, EmptyState } from '@/components/common/ui'

export function MemberPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: m, isLoading } = useMemberProfile(id)

  if (isLoading) return <Spinner label="Loading member…" />
  if (!m) return <EmptyState title="Member not found" />

  const roleTone = { admin: 'purple', host: 'green', player: 'blue' } as const

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>

      <div className="flex items-center gap-3">
        <Avatar name={m.user.name} color={m.user.avatarColor} size={56} />
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{m.user.name}</h1><p className="text-xs text-text-muted">@{m.user.handle}</p></div>
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
