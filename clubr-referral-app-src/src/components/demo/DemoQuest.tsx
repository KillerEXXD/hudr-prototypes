import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, GraduationCap, PartyPopper, ArrowRight, Gamepad2, Radio, UserPlus, Plus } from 'lucide-react'

// The "First Hand" quest — Chip the dealer mascot walks a brand-new user through their
// demo sandbox (docs/DEMO_CLUBS.md, Phase 3). A guided, dismissible checklist on the
// demo club page; finishing it celebrates + nudges toward a real club. Progress lives in
// localStorage so it survives reloads and is shared across both demo clubs.

interface Mission { id: string; label: string; hint: string; icon: typeof Gamepad2 }
const MISSIONS: Mission[] = [
  { id: 'open', label: 'Open a game', hint: 'Tap any game below to see how it plays.', icon: Gamepad2 },
  { id: 'join', label: 'Jump in — it’s free', hint: 'Join a game or claim a spot. Demo games never cost credits.', icon: UserPlus },
  { id: 'live', label: 'Find it in Live', hint: 'Games you’re in show up in the Live tab.', icon: Radio },
  { id: 'host', label: 'Host your own', hint: 'Tap the + in the bottom bar to spin up a new game.', icon: Plus },
]
const KEY = 'clubr_demo_quest_v1'

type Stored = { done: string[]; dismissed: boolean }
function load(): Stored {
  try { const v = JSON.parse(localStorage.getItem(KEY) || ''); return { done: v.done ?? [], dismissed: !!v.dismissed } }
  catch { return { done: [], dismissed: false } }
}

export function DemoQuest() {
  const navigate = useNavigate()
  const [state, setState] = useState<Stored>(load)
  const save = (s: Stored) => { setState(s); try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ } }

  const done = useMemo(() => new Set(state.done), [state.done])
  const complete = (id: string) => { if (!done.has(id)) save({ ...state, done: [...state.done, id] }) }
  const count = MISSIONS.filter((m) => done.has(m.id)).length
  const allDone = count === MISSIONS.length

  if (state.dismissed) return null

  function tap(m: Mission) {
    complete(m.id)
    if (m.id === 'live') navigate('/live')
    // 'open'/'join'/'host' — the games + the nav + are right there; completing nudges progress.
  }

  // Progress ring geometry (r=18, circumference ≈ 113).
  const pct = count / MISSIONS.length
  const dash = 113
  const off = dash * (1 - pct)

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl border border-accent-blue/30 bg-gradient-to-br from-accent-blue/15 via-bg-card to-accent-purple/15 p-4 shadow-lg">
      <button
        type="button" onClick={() => save({ ...state, dismissed: true })}
        aria-label="Dismiss the demo guide"
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-bg-surface/70 text-text-muted hover:text-text-primary"
      ><X className="h-4 w-4" /></button>

      <div className="flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}chip.png`} alt="Chip, your demo guide" width={56} height={56}
          className="h-14 w-14 shrink-0 rounded-2xl ring-1 ring-white/10" />
        <div className="min-w-0 flex-1">
          {allDone ? (
            <>
              <p className="flex items-center gap-1.5 text-base font-extrabold text-text-primary"><PartyPopper className="h-5 w-5 text-accent-amber" />Demo Graduate!</p>
              <p className="mt-0.5 text-xs leading-snug text-text-secondary">Nice — you’ve got the hang of it. Ready for the real thing?</p>
            </>
          ) : (
            <>
              <p className="text-base font-extrabold text-text-primary">Hey, I’m Chip 👋</p>
              <p className="mt-0.5 text-xs leading-snug text-text-secondary">This is your free sandbox — nothing’s real. Try these {MISSIONS.length} things to get the hang of it.</p>
            </>
          )}
        </div>
        {/* Progress ring */}
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-bg-surface" />
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"
              className="text-accent-emerald transition-all duration-500" strokeDasharray={dash} strokeDashoffset={off} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-text-primary">{count}/{MISSIONS.length}</span>
        </div>
      </div>

      {allDone ? (
        <button type="button" onClick={() => navigate('/')}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-accent-blue to-accent-purple px-4 py-2.5 text-sm font-extrabold text-white shadow active:scale-[0.99]">
          <GraduationCap className="h-4 w-4" />Create your real club<ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {MISSIONS.map((m) => {
            const isDone = done.has(m.id)
            return (
              <li key={m.id}>
                <button
                  type="button" onClick={() => tap(m)} disabled={isDone}
                  className={`flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition ${isDone ? 'border-accent-emerald/30 bg-accent-emerald/10' : 'border-border bg-bg-surface/50 hover:border-accent-blue/40 active:scale-[0.99]'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-accent-emerald text-white' : 'bg-bg-card text-accent-blue'}`}>
                    {isDone ? <Check className="h-4 w-4" /> : <m.icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${isDone ? 'text-text-muted line-through' : 'text-text-primary'}`}>{m.label}</span>
                    {!isDone && <span className="block text-[11px] leading-snug text-text-muted">{m.hint}</span>}
                  </span>
                  {!isDone && <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
