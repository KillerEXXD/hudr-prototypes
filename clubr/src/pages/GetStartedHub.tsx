import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Compass, Plus, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useJoinViaInvite } from '@/hooks'
import { Btn, Card, Field } from '@/components/common/ui'

/**
 * Stage-0 surface (onboarding Phase 2). Shown as the player's Home while they have
 * no club yet — one focused fork instead of four empty tabs:
 *   • Join a club (primary) — paste an invite code, or browse public clubs.
 *   • Create your own club (secondary) — the host path.
 * A player can do nothing until they're in a club, so this never dead-ends: both
 * doors lead somewhere. The bottom nav is hidden at this stage (see BottomNav).
 */
export function GetStartedHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const join = useJoinViaInvite()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  async function applyCode() {
    const c = await join.mutateAsync(code.trim())
    setMsg(c
      ? `Request to join ${c.name} sent — you'll get in once the host approves.`
      : "If a club matches that code, your request was sent — you'll get access once the host admits you.")
    setCode('')
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Welcome, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-secondary">How do you want to start?</p>
      </div>

      {/* Join a club — the primary door (most people join before they host). */}
      <Card className="flex flex-col gap-3 border-accent-blue/30">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Ticket className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-extrabold text-text-primary">Join a club</p>
            <p className="text-[11px] text-text-muted">Got an invite code from a host? Paste it.</p>
          </div>
        </div>
        <Field label="Invite code" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
        <Btn className="w-full" disabled={!code.trim()} loading={join.isPending} onClick={applyCode}>Request to join</Btn>
        {msg && <p className="text-center text-xs font-semibold text-accent-emerald">{msg}</p>}
        <button type="button" onClick={() => navigate('/discover/clubs')} className="flex items-center justify-center gap-1 text-xs font-semibold text-accent-blue cursor-pointer">
          <Compass className="h-3.5 w-3.5" />Browse public clubs to join<ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Card>

      {/* Create a club — the host door (opens the create sheet on the Clubs screen). */}
      <button type="button" onClick={() => navigate('/clubs', { state: { create: true } })}
        className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors hover:bg-bg-surface cursor-pointer">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-surface text-text-secondary"><Plus className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-text-primary">Create your own club</span>
          <span className="block text-[11px] text-text-muted">Host FT Fantasy, Last Longer & Squares for your crew.</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
      </button>
    </div>
  )
}
