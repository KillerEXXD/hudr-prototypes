import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, Crown, User as UserIcon, Ticket, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Btn, Field } from '@/components/common/ui'
import { CityField } from '@/components/common/CityField'
import { LogoMark } from '@/components/common/LogoMark'
import * as api from '@/lib/api/services'
import type { AccountRole } from '@/types'

const ROLES: { role: AccountRole; label: string; who: string; icon: typeof UserIcon; color: string; userId?: string }[] = [
  { role: 'member', label: 'Member', who: 'Sam Rivers · joins clubs & plays', icon: UserIcon, color: '#3b82f6' },
  { role: 'owner', label: 'Aces High Owner', who: 'Harper · owns "Aces High", approves members', icon: Crown, color: '#10b981' },
  { role: 'owner', label: 'Bayou City Poker Club Owner', who: 'Marcus · owns "Bayou City Poker Club"', icon: Crown, color: '#a855f7', userId: 'u_cc_host' },
  { role: 'owner', label: 'Gulf Coast Card Club Owner', who: 'Diana · owns "Gulf Coast Card Club"', icon: Crown, color: '#dc2626', userId: 'u_tch_host' },
  { role: 'admin', label: 'App Admin', who: 'Avery · manages all clubs & users', icon: ShieldCheck, color: '#8b5cf6' },
]

export function LoginScreen() {
  const { loginAs, signUp } = useAuth()
  const [joinOpen, setJoinOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const joinCode = params.get('join')
  useEffect(() => { if (joinCode) { setJoinOpen(true); setCode(joinCode.toUpperCase()) } }, [joinCode])

  const emailOk = /.+@.+\..+/.test(email)
  // One front door (mirrors live): verify (phone) + name/email/city. The invite
  // code rides the URL (live: applied post-verify by useApplyInviteOnLogin).
  // Demo mocks the phone verification.
  const canJoin = !!phone.trim() && !!name.trim() && emailOk && !!location.trim() && !!code.trim()
  async function joinWithLink() {
    if (!canJoin) return
    const u = signUp(name, email, phone, location)
    const r = await api.applyInviteCode(code, u.id)
    // Mirror live: public → club page with the outcome banner; valid private code →
    // home with a "Request sent" confirmation (club not disclosed); no match → message.
    if (r.kind === 'club') navigate(`/club/${r.club.id}`, { state: { joinResult: r.club.myStatus === 'member' ? 'already-member' : 'pending' } })
    else if (r.kind === 'private-requested') navigate('/', { state: { inviteSent: true } })
    else setMsg('No club found for that code (try ACES24).')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-5">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <LogoMark size={60} className="mx-auto block" />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary">Clubr<span className="text-accent-blue">GO</span></h1>
          <p className="mt-1 text-sm text-text-secondary">The transparent scorekeeper for your poker club — FT Fantasy &amp; Last Longer.</p>
        </div>

        {!joinOpen ? (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Sign in as…</p>
            <div className="flex flex-col gap-2.5">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => loginAs(r.role, r.userId)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors hover:bg-bg-surface cursor-pointer"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: r.color }}><r.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-primary">{r.label}</span>
                    <span className="block truncate text-xs text-text-muted">{r.who}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
                </button>
              ))}
            </div>
            <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wide text-text-muted">
              <span className="h-px flex-1 bg-border" /> new here? <span className="h-px flex-1 bg-border" />
            </div>
            <Btn variant="secondary" className="w-full" onClick={() => setJoinOpen(true)}><Ticket className="h-4 w-4" /> Join a club with an invite link</Btn>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-bg-card p-4">
            {joinCode && (
              <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-accent-emerald/40 bg-accent-emerald/10 p-3">
                <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">You've been invited to a club.</span> Verify to continue — we'll add you right after.</p>
              </div>
            )}
            <h2 className="mb-1 text-base font-bold text-text-primary">Verify &amp; continue</h2>
            <p className="mb-3 text-xs text-text-muted">In the live app you verify your phone first; then just these. (Demo mocks the verification.)</p>
            <div className="flex flex-col gap-3">
              <Field label="Phone number *" value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 123‑4567" />
              <Field label="Your name *" value={name} onChange={setName} placeholder="First & last name" />
              <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <CityField label="Your city *" value={location} onChange={setLocation} />
              {!joinCode && <Field label="Invite code *" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />}
              <Btn className="w-full" onClick={joinWithLink} disabled={!canJoin}>Join club</Btn>
              {msg && <p className="text-center text-xs font-semibold text-accent-emerald">{msg}</p>}
              <button onClick={() => { setJoinOpen(false); setMsg('') }} className="text-center text-xs text-text-muted hover:text-text-secondary cursor-pointer">← back to sign in</button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-text-muted">Prototype · mock data · {ROLES.length} demo roles · 6 skins</p>
      </div>
    </div>
  )
}
