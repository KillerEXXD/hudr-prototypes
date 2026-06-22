import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useJoinViaInvite } from '@/hooks'
import { Btn, Card, Field } from '@/components/common/ui'
import { ClubsToJoinSection } from '@/components/common/ClubsToJoinSection'
import { ClubExplainerCard } from '@/components/onboarding/ClubExplainerCard'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { FloatingCreateClubButton } from '@/components/onboarding/FloatingCreateClubButton'

/**
 * Stage-0 surface (onboarding). The player's Home while they have no club yet —
 * a guided "join, then play" instead of four empty tabs:
 *   1. Clubs you can join (near-you list) + an invite-code door for private clubs.
 *   2. The games — beautiful cards, tap to learn how each works (every game runs
 *      inside a club), ending in a Create-a-club CTA (the host path).
 * Nothing dead-ends. The bottom nav is hidden at this stage (see BottomNav).
 */
export function GetStartedHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const join = useJoinViaInvite()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  // One accordion across the club card + the game cards: opening any one closes
  // the rest. null = all collapsed; 'club' | a game id = that card is open.
  const [openId, setOpenId] = useState<string | null>(null)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  async function applyCode() {
    const c = await join.mutateAsync(code.trim())
    setMsg(c
      ? `Request to join ${c.name} sent — you'll get in once the host approves.`
      : "If a club matches that code, your request was sent — you'll get access once the host admits you.")
    setCode('')
  }

  return (
    <>
    <div className="animate-fade-up flex flex-col gap-5 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Welcome, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-secondary">Join a club to start playing — here's what's on.</p>
      </div>

      {/* 1. Clubs you can join — the near-you list (+ "See all"). */}
      <ClubsToJoinSection />

      {/* Invite-code door — for private clubs not in the public list. */}
      <Card className="flex flex-col gap-2.5 border-accent-blue/30">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Ticket className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-extrabold text-text-primary">Have an invite code?</p>
            <p className="text-[11px] text-text-muted">Paste it to request a private club.</p>
          </div>
        </div>
        <Field label="Invite code" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
        <Btn className="w-full" disabled={!code.trim()} loading={join.isPending} onClick={applyCode}>Request to join</Btn>
        {msg && <p className="text-center text-xs font-semibold text-accent-emerald">{msg}</p>}
      </Card>

      {/* 2. How a club works — the foundational explainer, first card above the games. */}
      <ClubExplainerCard open={openId === 'club'} onToggle={() => setOpenId(openId === 'club' ? null : 'club')} />

      {/* 3. The games — learn how each works. The host door is the floating CTA below. */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">The games</p>
        <GameHowItWorksCards openId={openId} onOpen={setOpenId} />
      </div>
    </div>

    {/* The single host door — a floating, pulsing puck that hides while you scroll
        and reappears when it settles (chat-puck pattern). Cold-start only. */}
    <FloatingCreateClubButton onClick={() => navigate('/clubs', { state: { create: true } })} />
    </>
  )
}
