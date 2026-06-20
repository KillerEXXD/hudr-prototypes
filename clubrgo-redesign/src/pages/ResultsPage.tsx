import { Trophy } from 'lucide-react'
import { useStandings } from '@/hooks'
import { cn } from '@/lib/utils/cn'

const PODIUM = [
  { rank: 2, medal: '🥈', prize: '30%', h: 'h-20' },
  { rank: 1, medal: '🥇', prize: '50%', h: 'h-28' },
  { rank: 3, medal: '🥉', prize: '20%', h: 'h-14' },
]

export function ResultsPage() {
  const { data: standings = [] } = useStandings()
  const byRank = (r: number) => standings.find((s) => s.rank === r)

  return (
    <div className="pb-6">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">🚀 Houston Rockets<span className="rounded bg-bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">Completed</span></div>
        <h1 className="mt-0.5 flex items-center gap-2 text-xl font-black tracking-tight"><Trophy className="h-5 w-5 text-accent-amber" />WSOP Main FT — Results</h1>
        <div className="mt-1 text-xs text-text-muted">9 entries · 750 pool · settled offline</div>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-end justify-center gap-2">
          {PODIUM.map((p) => {
            const s = byRank(p.rank)
            return (
              <div key={p.rank} className="flex w-1/3 flex-col items-center">
                <div className={cn('grid h-12 w-12 place-items-center rounded-full text-base font-black text-white', p.rank === 1 ? 'bg-accent-amber' : p.rank === 2 ? 'bg-text-muted' : 'bg-accent-amber/60', s?.you && 'ring-2 ring-accent-blue ring-offset-2 ring-offset-bg-primary')}>
                  {s?.name.split(' ').map((x) => x[0]).join('')}
                </div>
                <div className="mt-1 text-xs font-bold">{s?.name}{s?.you && <span className="text-accent-blue"> (you)</span>}</div>
                <div className="nums text-[11px] text-text-muted">{s?.pts} pts</div>
                <div className={cn('mt-1 flex w-full flex-col items-center rounded-t-lg bg-gradient-to-b from-bg-surface to-bg-card pt-1.5', p.h)}>
                  <span className="text-lg">{p.medal}</span>
                  <span className="mt-0.5 text-[10px] font-bold text-accent-emerald">{p.prize}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-5">
        <h2 className="mb-2 text-sm font-bold text-text-secondary">Final standings</h2>
        <div className="flex flex-col gap-1.5">
          {standings.map((s) => (
            <div key={s.rank} className={cn('flex items-center gap-3 rounded-xl border p-2.5', s.you ? 'border-accent-blue/40 bg-accent-blue/10' : 'border-border bg-bg-card')}>
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black', s.rank <= 3 ? 'bg-accent-amber/20 text-accent-amber' : 'bg-bg-surface text-text-muted')}>{s.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}{s.you && <span className="text-accent-blue"> · you</span>}</span>
                <span className="block truncate text-[11px] text-text-muted">{s.team}</span>
              </span>
              <span className="nums text-sm font-bold text-accent-violet">{s.pts}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-bg-card/60 p-3 text-center text-[11px] leading-snug text-text-muted">
          Winnings are settled <span className="font-semibold text-text-secondary">between players offline</span> — ClubrGo just keeps the score.
        </p>
      </div>
    </div>
  )
}
