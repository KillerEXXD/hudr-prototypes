import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShieldCheck, Crown, User as UserIcon, Ticket, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Btn, Field } from '@/components/common/ui'
import * as api from '@/lib/api/services'
import type { AccountRole } from '@/types'

const ROLES: { role: AccountRole; label: string; who: string; icon: typeof UserIcon; color: string }[] = [
  { role: 'player', label: 'Player', who: 'Sam Rivers · joins clubs & plays', icon: UserIcon, color: '#3b82f6' },
  { role: 'host', label: 'Club Host', who: 'Harper · owns "Aces High", approves members', icon: Crown, color: '#10b981' },
  { role: 'admin', label: 'App Admin', who: 'Avery · manages all clubs & users', icon: ShieldCheck, color: '#8b5cf6' },
]

export function LoginScreen() {
  const { loginAs, signUp } = useAuth()
  const [joinOpen, setJoinOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [params] = useSearchParams()
  const joinCode = params.get('join')
  useEffect(() => { if (joinCode) { setJoinOpen(true); setCode(joinCode.toUpperCase()) } }, [joinCode])

  const emailOk = /.+@.+\..+/.test(email)
  const canJoin = !!name.trim() && emailOk && !!phone.trim() && !!code.trim()
  async function joinWithLink() {
    if (!canJoin) return
    const u = signUp(name, email, phone)
    const club = await api.joinViaInvite(code, u.id)
    setMsg(club ? `Requested to join ${club.name} — awaiting host approval.` : 'No club found for that code (try ACES24).')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-5">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="text-4xl">🃏</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text-primary">ClubR</h1>
          <p className="mt-1 text-sm text-text-secondary">The transparent scorekeeper for your poker club — FT Fantasy &amp; Last Longer.</p>
        </div>

        {!joinOpen ? (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Sign in as…</p>
            <div className="flex flex-col gap-2.5">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => loginAs(r.role)}
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
            <h2 className="mb-1 text-base font-bold text-text-primary">Create your login</h2>
            <p className="mb-3 text-xs text-text-muted">Your host shared an invite code. Name, email &amp; phone are required — your host needs them to vet &amp; admit you.</p>
            <div className="flex flex-col gap-3">
              <Field label="Your name *" value={name} onChange={setName} placeholder="First & last name" />
              <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <Field label="Phone number *" value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 123‑4567" />
              <Field label="Invite code *" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
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
