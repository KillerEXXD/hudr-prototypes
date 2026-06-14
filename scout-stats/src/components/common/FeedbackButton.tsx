import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquarePlus, X, Send, CheckCircle2 } from 'lucide-react'
import { captureFeedback, PROTOTYPE } from '@/lib/analytics'

// Floating "Give feedback" launcher + a short in-context form. Captures the
// current screen automatically and sends a structured PostHog event (which
// links to the user's session replay). Positioned inside the centered phone
// frame, above the bottom nav. Present on every screen via AppShell.

const EASE = [1, 2, 3, 4, 5]
const EASE_LABEL: Record<number, string> = { 1: 'Very hard', 2: 'Hard', 3: 'OK', 4: 'Easy', 5: 'Very easy' }

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [ease, setEase] = useState(0)
  const [improve, setImprove] = useState('')
  const [liked, setLiked] = useState('')
  const [email, setEmail] = useState('')

  function reset() {
    setEase(0); setImprove(''); setLiked(''); setEmail('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    captureFeedback({ screen: window.location.hash || '#/', ease, improve, liked, email })
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); reset() }, 1700)
  }

  return (
    <>
      {/* launcher — pinned to the right edge of the centered app frame, above the nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-md justify-end px-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03] cursor-pointer"
          aria-label="Give feedback on this prototype"
        >
          <MessageSquarePlus className="h-4 w-4" /> Feedback
        </button>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="animate-fade-up w-full max-w-md rounded-t-2xl border border-border bg-bg-card p-4 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-9 w-9 text-accent-emerald" />
                <p className="text-sm font-semibold text-text-primary">Thanks — feedback sent!</p>
                <p className="text-xs text-text-muted">It helps us shape the {PROTOTYPE} build.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Quick feedback</h3>
                    <p className="text-[11px] text-text-muted">on the <span className="font-semibold capitalize">{PROTOTYPE}</span> prototype · {(window.location.hash || '#/').replace('#', '')}</p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>

                {/* ease (SEQ) */}
                <label className="mt-3 block text-xs font-semibold text-text-secondary">How easy was this to use?</label>
                <div className="mt-1.5 flex gap-1.5">
                  {EASE.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEase(n)}
                      className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-colors cursor-pointer ${ease === n ? 'border-accent-blue bg-accent-blue text-white' : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary'}`}
                      aria-label={EASE_LABEL[n]}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {ease > 0 && <p className="mt-1 text-[11px] text-text-muted">{EASE_LABEL[ease]}</p>}

                <label className="mt-3 block text-xs font-semibold text-text-secondary">What would you change or improve?</label>
                <textarea
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  rows={3}
                  placeholder="Confusing bits, missing features, anything that felt off…"
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />

                <label className="mt-3 block text-xs font-semibold text-text-secondary">What worked well? <span className="font-normal text-text-muted">(optional)</span></label>
                <input
                  value={liked}
                  onChange={(e) => setLiked(e.target.value)}
                  placeholder="The part you'd keep…"
                  className="mt-1.5 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email (optional — if we can follow up)"
                  className="mt-3 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />

                <button
                  type="submit"
                  disabled={!ease && !improve.trim()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" /> Send feedback
                </button>
                <p className="mt-2 text-center text-[10px] text-text-muted">Anonymous unless you add an email. Your session may be recorded to help us improve.</p>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
