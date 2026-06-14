import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ExternalLink, Send, CheckCircle2, ClipboardList } from 'lucide-react'
import { captureReview, PROTOTYPE } from '@/lib/analytics'
import { getReviewSections } from '@/lib/reviewSections'
import { cn } from '@/lib/utils'

// Guided, feature-by-feature review of one prototype. One step per feature area
// (score 1–5 + liked/disliked quick-pick chips + free text, with a "try it" deep
// link), ending in an overall step (would-use / would-pay / NPS + required
// name & email). Submits one structured PostHog event.

interface Answer { score: number; liked: string; disliked: string; likedTags: string[]; dislikedTags: string[] }
const EMPTY: Answer = { score: 0, liked: '', disliked: '', likedTags: [], dislikedTags: [] }

const SCORE = [1, 2, 3, 4, 5]
const SCORE_LABEL: Record<number, string> = { 1: 'Poor', 2: 'Weak', 3: 'OK', 4: 'Good', 5: 'Great' }
const USE_LABEL: Record<number, string> = { 1: 'Never', 2: 'Unlikely', 3: 'Maybe', 4: 'Likely', 5: 'Definitely' }
const NPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const isEmail = (s: string) => /.+@.+\..+/.test(s.trim())

function ScoreRow({ value, onChange, labels = SCORE_LABEL }: { value: number; onChange: (n: number) => void; labels?: Record<number, string> }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {SCORE.map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn('flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-colors cursor-pointer',
              value === n ? 'border-accent-blue bg-accent-blue text-white' : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary')}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-muted">
        <span>{labels[1]}</span>
        <span>{value ? labels[value] : ''}</span>
        <span>{labels[5]}</span>
      </div>
    </div>
  )
}

function Chips({ options, selected, onToggle, tone }: { options: string[]; selected: string[]; onToggle: (t: string) => void; tone: 'pos' | 'neg' }) {
  if (!options.length) return null
  const on = tone === 'pos'
    ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald'
    : 'border-accent-amber bg-accent-amber/15 text-accent-amber'
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {options.map((o) => {
        const sel = selected.includes(o)
        return (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              sel ? on : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary')}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

export default function ReviewWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sections = getReviewSections()
  const total = sections.length + 1 // + overall step
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [wouldUse, setWouldUse] = useState(0)
  const [wouldPay, setWouldPay] = useState<'' | 'no' | 'maybe' | 'yes'>('')
  const [wouldPayAmount, setWouldPayAmount] = useState('')
  const [nps, setNps] = useState<number | null>(null)
  const [overallNote, setOverallNote] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  if (!open) return null

  const isOverall = step === sections.length
  const sec = isOverall ? null : sections[step]
  const ans = sec ? (answers[sec.key] ?? EMPTY) : EMPTY
  const setAns = (patch: Partial<Answer>) => {
    if (!sec) return
    setAnswers((a) => ({ ...a, [sec.key]: { ...(a[sec.key] ?? EMPTY), ...patch } }))
  }
  const toggleTag = (field: 'likedTags' | 'dislikedTags', tag: string) => {
    if (!sec) return
    setAnswers((a) => {
      const cur = a[sec.key] ?? EMPTY
      const list = cur[field]
      return { ...a, [sec.key]: { ...cur, [field]: list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag] } }
    })
  }
  const tryHref = sec?.tryPath ? `${import.meta.env.BASE_URL}#${sec.tryPath}` : null
  const pct = Math.round(((step + 1) / total) * 100)
  const canSubmit = name.trim().length > 0 && isEmail(email)

  function reset() {
    setStep(0); setAnswers({}); setWouldUse(0); setWouldPay(''); setWouldPayAmount('')
    setNps(null); setOverallNote(''); setName(''); setEmail(''); setSent(false)
  }
  function submit() {
    if (!canSubmit) return
    captureReview({
      sections: answers,
      would_use: wouldUse,
      would_pay: wouldPay || 'no',
      would_pay_amount: wouldPayAmount || undefined,
      nps: nps ?? -1,
      overall_note: overallNote || undefined,
      name: name.trim(),
      email: email.trim(),
    })
    setSent(true)
    setTimeout(() => { onClose(); reset() }, 2200)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="animate-fade-up flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-bg-card shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
        {/* header + progress */}
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-blue">
                <ClipboardList className="h-3.5 w-3.5" /> Review · <span className="capitalize">{PROTOTYPE}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-text-muted">{sent ? 'Done' : isOverall ? 'Last step — overall' : `Step ${step + 1} of ${total}`}</div>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          {!sent && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-surface">
              <div className="h-full rounded-full bg-accent-blue transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent-emerald" />
              <p className="text-base font-bold text-text-primary">Thanks — review submitted!</p>
              <p className="text-xs text-text-muted">This directly shapes the <span className="capitalize font-semibold">{PROTOTYPE}</span> build.</p>
            </div>
          ) : isOverall ? (
            <div>
              <h3 className="text-base font-bold text-text-primary">Overall</h3>
              <p className="mt-0.5 text-xs text-text-muted">Almost done — the big-picture questions.</p>

              <label className="mt-4 block text-xs font-semibold text-text-secondary">Would you use this for your own game?</label>
              <div className="mt-1.5"><ScoreRow value={wouldUse} onChange={setWouldUse} labels={USE_LABEL} /></div>

              <label className="mt-4 block text-xs font-semibold text-text-secondary">Would you pay for it?</label>
              <div className="mt-1.5 flex gap-1.5">
                {(['no', 'maybe', 'yes'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setWouldPay(v)}
                    className={cn('flex-1 rounded-lg border py-2 text-sm font-semibold capitalize transition-colors cursor-pointer',
                      wouldPay === v ? 'border-accent-blue bg-accent-blue text-white' : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary')}>
                    {v}
                  </button>
                ))}
              </div>
              {wouldPay === 'yes' && (
                <input value={wouldPayAmount} onChange={(e) => setWouldPayAmount(e.target.value)} placeholder="How much per month? (e.g. $10)"
                  className="mt-2 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
              )}

              <label className="mt-4 block text-xs font-semibold text-text-secondary">How likely to recommend to a poker friend? <span className="font-normal text-text-muted">(0–10)</span></label>
              <div className="mt-1.5 grid grid-cols-11 gap-1">
                {NPS.map((n) => (
                  <button key={n} type="button" onClick={() => setNps(n)}
                    className={cn('flex h-8 items-center justify-center rounded-md border text-xs font-bold transition-colors cursor-pointer',
                      nps === n ? 'border-accent-blue bg-accent-blue text-white' : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary')}>
                    {n}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-xs font-semibold text-text-secondary">Anything else? <span className="font-normal text-text-muted">(optional)</span></label>
              <textarea value={overallNote} onChange={(e) => setOverallNote(e.target.value)} rows={2} placeholder="The one thing you'd change first…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />

              <div className="mt-4 rounded-xl border border-border bg-bg-surface/40 p-3">
                <label className="block text-xs font-semibold text-text-secondary">Your name <span className="text-accent-red">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First & last name"
                  className="mt-1.5 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                <label className="mt-3 block text-xs font-semibold text-text-secondary">Your email <span className="text-accent-red">*</span></label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                  className={cn('mt-1.5 w-full rounded-lg border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue',
                    email && !isEmail(email) ? 'border-accent-red' : 'border-border')} />
                <p className="mt-1.5 text-[10px] text-text-muted">Required — so we can follow up on your feedback.</p>
              </div>
            </div>
          ) : sec && (
            <div>
              <h3 className="text-base font-bold text-text-primary">{sec.title}</h3>
              <p className="mt-0.5 text-xs leading-snug text-text-muted">{sec.blurb}</p>
              {tryHref && (
                <a href={tryHref} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1.5 text-xs font-semibold text-accent-blue hover:bg-accent-blue/20 cursor-pointer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open this feature to try it
                </a>
              )}

              <label className="mt-4 block text-xs font-semibold text-text-secondary">How was this experience?</label>
              <div className="mt-1.5"><ScoreRow value={ans.score} onChange={(n) => setAns({ score: n })} /></div>

              <label className="mt-3 block text-xs font-semibold text-text-secondary">What worked well? <span className="font-normal text-text-muted">(tap any, or type)</span></label>
              <Chips options={sec.likedChips ?? []} selected={ans.likedTags} onToggle={(t) => toggleTag('likedTags', t)} tone="pos" />
              <textarea value={ans.liked} onChange={(e) => setAns({ liked: e.target.value })} rows={2} placeholder="Anything else you'd keep…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />

              <label className="mt-3 block text-xs font-semibold text-text-secondary">What didn't, or was confusing? <span className="font-normal text-text-muted">(tap any, or type)</span></label>
              <Chips options={sec.dislikedChips ?? []} selected={ans.dislikedTags} onToggle={(t) => toggleTag('dislikedTags', t)} tone="neg" />
              <textarea value={ans.disliked} onChange={(e) => setAns({ disliked: e.target.value })} rows={2} placeholder="Anything else you'd change…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
            </div>
          )}
        </div>

        {/* footer controls */}
        {!sent && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-1 rounded-lg border border-border bg-bg-surface/60 px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {isOverall ? (
                <button type="button" onClick={submit} disabled={!canSubmit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-blue px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                  <Send className="h-4 w-4" /> Submit review
                </button>
              ) : (
                <button type="button" onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent-blue px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 cursor-pointer">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            {isOverall && !canSubmit && (
              <p className="mt-2 text-center text-[10px] text-text-muted">Add your name &amp; a valid email to submit.</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
