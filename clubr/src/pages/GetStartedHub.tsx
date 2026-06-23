import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useJoinViaInvite, useRecentClubs } from '@/hooks'
import { Btn, Card, Field } from '@/components/common/ui'
import { ClubsToJoinSection } from '@/components/common/ClubsToJoinSection'
import { ClubExplainerCard } from '@/components/onboarding/ClubExplainerCard'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { FloatingCreateClubButton } from '@/components/onboarding/FloatingCreateClubButton'
import { ApprovedBanner } from '@/components/onboarding/ApprovedBanner'

/**
 * Stage-0 surface (onboarding). The player's Home while they have no club yet —
 * a guided "join, then play" instead of four empty tabs:
 *   1. Clubs you can join (near-you list) + an invite-code door for private clubs.
 *   2. The games — beautiful cards, tap to learn how each works (every game runs
 *      inside a club), ending in a Create-a-club CTA (the host path).
 * Nothing dead-ends. The bottom nav is hidden at this stage (see BottomNav).
 *
 * Doubles as the PENDING surface: once the player has requested a club (a host still
 * has to admit them — not "in" yet, so no nav), the requested clubs surface in the
 * **"Pending approval"** group inside <ClubsToJoinSection/> with a "Waiting for
 * approval" pill, while the rest of the hub stays so they can keep exploring.
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
  // No clubs to join anywhere → skip the "Clubs to join" list (it self-hides) and
  // show a warm welcome instead, encouraging them to explore + start their own.
  const recent = useRecentClubs()
  const noJoinable = !recent.isLoading && !(recent.data ?? []).some((c) => c.myStatus === 'none')

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
      {/* Seeds the approval-snapshot empty while you're still pre-club, so your FIRST
          admit registers as new (and renders nothing here — you have no club yet). */}
      <ApprovedBanner />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Welcome, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-secondary">Join a club to start playing — here's what's on.</p>
      </div>

      {/* 1. Your pending requests + clubs you can join (near-you list, "See all").
             When there are none to join, this self-hides and the welcome below shows. */}
      <ClubsToJoinSection />

      {/* No clubs to join yet → a warm, hopeful welcome instead of an empty list:
          tell them what ClubrGO is and nudge them to explore + be the first to host. */}
      {noJoinable && (
        <div className="overflow-hidden rounded-3xl border border-accent-amber/30 bg-gradient-to-br from-accent-amber/15 via-bg-card to-accent-emerald/10 p-5 text-center shadow-lg">
          <div className="text-[2.6rem] leading-none">🃏✨</div>
          <h2 className="mt-1.5 bg-gradient-to-r from-accent-amber to-accent-emerald bg-clip-text text-[1.55rem] font-extrabold leading-tight tracking-tight text-transparent">
            You're early — be the one who starts it!
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
            ClubrGO is where your crew keeps the <strong className="text-text-primary">poker side-games</strong> honest — <strong className="text-text-primary">FT Fantasy</strong>, <strong className="text-text-primary">Last Longer</strong> &amp; <strong className="text-text-primary">Squares</strong>. No clubs near you <em>yet</em>, so make the first move: peek at how it all works just below&nbsp;👇, then spin up your own club and drop your first game.&nbsp;🎉
          </p>
          <button
            type="button"
            onClick={() => navigate('/clubs', { state: { create: true } })}
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent-amber to-amber-500 px-5 py-2.5 text-sm font-extrabold text-bg-primary shadow-md transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Start your club
          </button>
          <p className="mt-2.5 text-[11px] text-text-muted">Got an invite code from a friend? Drop it in below&nbsp;👇</p>
        </div>
      )}

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
