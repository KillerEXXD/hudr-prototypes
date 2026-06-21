import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { type ArenaGame } from '@/lib/arena/unifiedGame'

// =====================================================================
// FeltGameCard — a faithful reproduction of the ClubrGo JSX `GameCard`:
// type chip top-left + a right slot (LOCKS IN / NEXT BREAK countdown),
// display title, club line, a 3-COLUMN LABELLED META row (POOL / ENTRY /
// PLAYERS — mono uppercase label over a bold display value, divided by
// left borders), then a footer chip + Draft -> / Enter -> action.
// =====================================================================

const TYPE_CHIP: Record<ArenaGame['type'], { label: string; glyph: string; tone: 'gold' | 'blue' | 'purple' }> = {
  ft: { label: 'FT Fantasy', glyph: '\u2660', tone: 'gold' },
  ll: { label: 'Last Longer', glyph: '\u25C6', tone: 'blue' },
  squares: { label: 'Football Squares', glyph: '\u25A6', tone: 'purple' },
}

const CHIP_TONE: Record<'gold' | 'blue' | 'purple' | 'emerald' | 'amber' | 'red' | 'neutral', string> = {
  gold: 'bg-accent-gold/[0.13] text-accent-gold border-accent-gold/[0.27]',
  blue: 'bg-[#16314A] text-accent-blue border-accent-blue/30',
  purple: 'bg-[#2A2245] text-accent-purple border-accent-purple/30',
  emerald: 'bg-[#0F3327] text-accent-emerald border-accent-emerald/30',
  amber: 'bg-[#3A2C12] text-accent-amber border-accent-amber/30',
  red: 'bg-[#3A1C18] text-accent-red border-accent-red/30',
  neutral: 'bg-bg-surface text-text-secondary border-border',
}

export function FeltChip({ tone = 'neutral', children, className }: { tone?: keyof typeof CHIP_TONE; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.02em]', CHIP_TONE[tone], className)}>{children}</span>
}

function CountdownCol({ label, deadline }: { label: string; deadline?: string | null }) {
  const d = regDeadline(deadline ?? null)
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <span className="font-mono text-[15px] font-semibold tabular-nums text-accent-gold">
        <Countdown deadline={d} prefix="" />
      </span>
    </div>
  )
}

function LivePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-red/30 bg-[#3A1C18] px-2.5 py-1 font-mono text-[11px] font-semibold text-accent-red">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-red felt-dot" />{children}
    </span>
  )
}

export function FeltGameCard({ g }: { g: ArenaGame }) {
  const navigate = useNavigate()
  const live = g.phase === 'live'
  const t = TYPE_CHIP[g.type]
  const isFt = g.type === 'ft'

  const pool = (g.stake * (g.progress?.total ?? 1)).toLocaleString()
  const thirdLabel = isFt ? 'Players' : g.type === 'll' ? 'Standing' : 'Squares'
  const thirdValue =
    isFt ? `${g.progress?.value ?? 0} / ${g.progress?.total ?? 0}`
    : g.type === 'll' ? `${g.progress?.value ?? 0} left`
    : `${g.progress?.value ?? 0} / 100`
  const meta: [string, string][] = [
    ['Pool', `${pool} Stakes`],
    ['Entry', `${g.stake.toLocaleString()} Stakes`],
    [thirdLabel, thirdValue],
  ]

  const footer = live
    ? <LivePill>{isFt ? 'LIVE \u00B7 drafting open' : g.phaseLabel}</LivePill>
    : g.phase === 'open'
      ? <FeltChip tone={t.tone}>{g.phaseLabel}</FeltChip>
      : <FeltChip tone="neutral">{g.phaseLabel}</FeltChip>

  const cdLabel = live ? (isFt ? 'LOCKS IN' : 'NEXT BREAK') : g.phase === 'open' ? (isFt ? 'LOCKS IN' : 'CLOSES IN') : 'DONE'

  return (
    <button onClick={() => navigate(g.href)}
      className={cn('relative w-full overflow-hidden rounded-[20px] border p-4 text-left transition-all active:scale-[0.99]',
        live
          ? 'border-accent-gold/20 bg-[linear-gradient(150deg,#16291E,#11201A)] shadow-[0_8px_28px_-12px_rgba(233,196,106,0.2)]'
          : 'border-[#23382C] bg-bg-card shadow-[0_6px_20px_-14px_rgba(0,0,0,0.7)]')}>
      {live && <span className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--color-accent-gold),transparent)]" />}

      <div className="mb-3 flex items-start justify-between gap-2">
        <FeltChip tone={t.tone}>{t.glyph} {t.label}</FeltChip>
        {g.deadline && <CountdownCol label={cdLabel} deadline={g.deadline} />}
      </div>

      <div className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>{g.title}</div>
      <div className="mb-3.5 mt-0.5 text-[13px] text-text-muted">{g.clubEmoji} {g.clubName}</div>

      <div className="mb-3.5 flex border-t border-[#23382C] pt-3">
        {meta.map(([k, v], i) => (
          <div key={k} className={cn('flex-1', i > 0 && 'border-l border-[#23382C] pl-3')}>
            <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">{k}</div>
            <div className="text-[15px] font-bold text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {footer}
        <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold', t.tone === 'gold' ? 'text-accent-gold' : 'text-text-secondary')}>
          {isFt ? 'Draft' : 'Enter'} <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>
    </button>
  )
}
