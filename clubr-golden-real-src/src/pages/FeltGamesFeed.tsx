import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArena } from '@/hooks/arena'
import { useWallet } from '@/hooks/credits'
import { FeltGameCard } from '@/components/felt/FeltGame'
import { Spinner, EmptyState } from '@/components/common/ui'
import { ChipStack } from '@/components/felt/ChipStack'
import type { ArenaGame } from '@/lib/arena/unifiedGame'
import { cn } from '@/lib/utils/cn'

// =====================================================================
// FeltGamesFeed — the ClubrGo JSX "Games Feed" screen, faithfully:
// credits strip (YOUR CREDITS / N cr + Top up) -> "Games" title ->
// relationship pills (Available / Playing / Hosting / Completed with counts)
// -> the labelled-column game cards.
// =====================================================================

type Rel = 'Available' | 'Playing' | 'Hosting' | 'Completed'
const RELS: Rel[] = ['Available', 'Playing', 'Hosting', 'Completed']

function matchRel(g: ArenaGame, rel: Rel): boolean {
  if (rel === 'Available') return g.phase === 'open' && (g.relation === 'open' || g.relation === 'spectating')
  if (rel === 'Playing') return (g.relation === 'in' || g.relation === 'pending') && g.phase !== 'settled'
  if (rel === 'Hosting') return g.relation === 'hosting' && g.phase !== 'settled'
  return g.phase === 'settled' // Completed
}

export function FeltGamesFeed() {
  const navigate = useNavigate()
  const arena = useArena()
  const wallet = useWallet()
  const [rel, setRel] = useState<Rel>('Available')

  if (arena.loading) return <Spinner label="Dealing you in\u2026" />

  const credits = wallet.data?.balance ?? 0
  const counts: Record<Rel, number> = {
    Available: arena.games.filter((g) => matchRel(g, 'Available')).length,
    Playing: arena.games.filter((g) => matchRel(g, 'Playing')).length,
    Hosting: arena.games.filter((g) => matchRel(g, 'Hosting')).length,
    Completed: arena.games.filter((g) => matchRel(g, 'Completed')).length,
  }
  const shown = arena.games.filter((g) => matchRel(g, rel))

  return (
    <div className="animate-fade-up">
      {/* credits strip */}
      <div className="mt-1 flex items-center justify-between rounded-2xl border border-[#23382C] bg-[linear-gradient(110deg,#15281E,#11201A)] px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <ChipStack />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">Your credits</div>
            <div className="font-bold leading-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)', fontSize: 22 }}>
              {credits.toLocaleString()} <span className="text-[13px] font-medium text-accent-gold">cr</span>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/wallet')}
          className="rounded-full bg-accent-gold px-4 py-2.5 text-[13px] font-semibold text-bg-primary transition-transform active:scale-95">
          Top up
        </button>
      </div>

      {/* title */}
      <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em] text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>Games</h1>

      {/* relationship pills */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {RELS.map((r) => {
          const on = rel === r
          return (
            <button key={r} onClick={() => setRel(r)}
              className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                on ? 'border-accent-gold bg-accent-gold text-bg-primary' : 'border-[#23382C] bg-[#16291F] text-text-secondary')}>
              {r} <span className={cn('font-mono text-[11px]', on ? 'text-bg-primary/70' : 'text-text-muted')}>{counts[r]}</span>
            </button>
          )
        })}
      </div>

      {/* cards */}
      <div className="mt-4 flex flex-col gap-3.5">
        {shown.length > 0 ? (
          shown.map((g) => <FeltGameCard key={`${g.type}-${g.id}`} g={g} />)
        ) : (
          <EmptyState
            title={rel === 'Hosting' ? "You're not hosting anything yet" : rel === 'Playing' ? "You're not in any games yet" : rel === 'Completed' ? 'No completed games yet' : 'Nothing open to join right now'}
            sub="Check the other tabs above."
          />
        )}
      </div>
      <div className="h-2" />
    </div>
  )
}
