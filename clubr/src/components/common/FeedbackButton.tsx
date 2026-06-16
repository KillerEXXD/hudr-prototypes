import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquarePlus, X, Send, CheckCircle2, ClipboardList, ArrowRight } from 'lucide-react'
import { captureQuickNote, getIdentity } from '@/lib/analytics'
import ReviewWizard from '@/components/common/ReviewWizard'

// Floating "Feedback" launcher for the ClubR prototype. Leads with a
// frictionless quick note — type a line, hit send, done (no rating, no required
// name/email). The longer guided review (which rates each feature) stays one
// tap away. Captures the current screen + session replay via PostHog. Pinned
// inside the centered phone frame, above the bottom nav (mounted in AppShell).

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [note, setNote] = useState('')

  const canSend = note.trim().length > 0

  function send() {
    if (!canSend) return
    captureQuickNote(note)
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); setNote('') }, 1500)
  }

  return (
    <>
      {/* launcher — pinned to the right edge of the centered app frame, above the nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-md justify-end px-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03] cursor-pointer"
          aria-label="Give feedback on the ClubR prototype"
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
                <p className="text-sm font-semibold text-text-primary">Note sent — thank you!</p>
                <p className="text-xs text-text-muted">It helps us shape the ClubR build.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Quick note</h3>
                    <p className="text-[11px] text-text-muted">on the <span className="font-semibold">ClubR</span> prototype · {(window.location.hash || '#/').replace('#', '')}</p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>

                {/* quick note — send immediately, no rating / name / email */}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send() }}
                  rows={3}
                  autoFocus
                  placeholder="A bug, an idea, anything that felt off…"
                  className="mt-3 w-full resize-none rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />

                <button
                  type="button"
                  onClick={send}
                  disabled={!canSend}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" /> Send note
                </button>
                <p className="mt-1.5 text-center text-[10px] text-text-muted">Sends instantly · {getIdentity() ? 'attached to your name' : 'no name or rating needed'} · ⌘/Ctrl+Enter</p>

                <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-text-muted">
                  <span className="h-px flex-1 bg-border" /> got more time? <span className="h-px flex-1 bg-border" />
                </div>

                {/* upsell to the full guided review */}
                <button
                  type="button"
                  onClick={() => { setOpen(false); setReviewOpen(true) }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-3 py-2.5 text-left transition-colors hover:bg-accent-blue/20 cursor-pointer"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/20 text-accent-blue"><ClipboardList className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-accent-blue">Take the 3‑min guided review</span>
                    <span className="block text-[11px] text-text-muted">Rate each ClubR feature — the most useful feedback</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-accent-blue" />
                </button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}

      <ReviewWizard open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </>
  )
}
