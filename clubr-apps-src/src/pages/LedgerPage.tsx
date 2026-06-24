import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useArena } from '@/hooks/arena'
import { EmptyState, Section, Spinner } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import type { LedgerLine } from '@/lib/arena/ledger'

// =====================================================================
// Ledger — "where you stand with each crew." Derived from settled results;
// dollar-blind Stakes. This is the redesign's retention surface: the single
// number a returning player actually wants. Transparent scorekeeping — it
// mirrors what the table would tally on paper, holds nothing.
// =====================================================================

function NetPill({ n, big }: { n: number; big?: boolean }) {
  const up = n > 0, flat = n === 0
  return (
    <span className={cn('font-mono font-bold tabular-nums', big ? 'text-2xl' : 'text-[15px]',
      up ? 'text-accent-emerald' : flat ? 'text-text-secondary' : 'text-accent-red')}>
      {up ? '+' : ''}{n.toLocaleString()}<span className={cn('ml-1 font-normal text-text-muted', big ? 'text-xs' : 'text-[0.7em]')}>Stakes</span>
    </span>
  )
}

/** A tiny win/loss strip — newest on the right. Encodes recent form at a glance. */
function FormStrip({ recent }: { recent: LedgerLine['recent'] }) {
  if (recent.length === 0) return null
  return (
    <div className="flex items-center gap-1">
      {[...recent].reverse().map((r, i) => (
        <span key={i} title={r.won ? 'Win' : r.net >= 0 ? 'Cash' : 'No cash'}
          className={cn('h-4 w-1.5 rounded-full', r.won ? 'bg-accent-gold' : r.net >= 0 ? 'bg-accent-emerald/70' : 'bg-border-light')} />
      ))}
    </div>
  )
}

export function LedgerPage() {
  const navigate = useNavigate()
  const { loading, ledger } = useArena()
  if (loading) return <Spinner label="Tallying your results…" />

  const { lines, totals } = ledger

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate('/')} className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-text-secondary hover:text-text-primary">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Your ledger</h1>
      <p className="text-[13px] text-text-secondary">Where you stand with each crew. Derived from settled games — Stakes, never cash.</p>

      {lines.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No settled games yet" sub="Once a game you've played wraps up, your standing with that crew shows here." />
        </div>
      ) : (
        <>
          {/* Hero totals */}
          <div className="mt-4 rounded-2xl border border-accent-gold/25 bg-[linear-gradient(135deg,#1A3326,#11201A)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Net across all crews</p>
            <div className="mt-1"><NetPill n={totals.net} big /></div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-3">
              {[['Played', totals.played], ['Cashes', totals.cashes], ['Wins', totals.wins]].map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[11px] text-text-muted">{k}</p>
                  <p className="font-mono text-lg font-bold text-text-primary tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[12px] text-text-secondary">
              Cash rate <span className="font-mono font-bold text-accent-gold">{Math.round(totals.cashRate * 100)}%</span>
            </div>
          </div>

          {/* Per-club lines */}
          <Section title="By crew">
            <div className="space-y-2">
              {lines.map((l) => (
                <button key={l.clubId} onClick={() => navigate(`/club/${l.clubId}`)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-bg-card p-4 text-left transition-all hover:border-border-light active:scale-[0.99]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-surface text-xl">{l.clubEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-text-primary">{l.clubName}</p>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-text-muted">
                      <span className="font-mono tabular-nums">{l.played} played</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{l.wins}W / {l.cashes}C</span>
                      <FormStrip recent={l.recent} />
                    </div>
                  </div>
                  <NetPill n={l.net} />
                </button>
              ))}
            </div>
          </Section>

          <p className="mt-4 px-1 text-[11px] leading-relaxed text-text-muted">
            ClubR is a transparent scorekeeper — it awards nothing, holds nothing, pools nothing.
            This ledger is a derived tally of your settled results, the way your table would total it on paper.
          </p>
        </>
      )}
    </div>
  )
}
