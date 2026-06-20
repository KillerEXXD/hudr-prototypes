const PODIUM = [
  { rank: 2, name: 'Gabby B', pts: 218, color: 'bg-zinc-400', prize: '30%', h: 'h-20' },
  { rank: 1, name: 'Ravee S', pts: 263, color: 'bg-amber-400', prize: '50%', h: 'h-28', you: true },
  { rank: 3, name: 'Tom D', pts: 191, color: 'bg-amber-700', prize: '20%', h: 'h-14' },
]
const STANDINGS = [
  { rank: 1, name: 'Ravee S', team: 'Seidel · Holz · Koon · Ivey', pts: 263, you: true },
  { rank: 2, name: 'Gabby B', team: 'Dwan · Chidwick · Selbst · Boeree', pts: 218 },
  { rank: 3, name: 'Tom D', team: 'Negreanu · Ivey · Koon · Holz', pts: 191 },
  { rank: 4, name: 'Annie S', team: 'Selbst · Boeree · Dwan · Seidel', pts: 174 },
  { rank: 5, name: 'Sara R', team: 'Chidwick · Koon · Negreanu · Ivey', pts: 152 },
]

export function Results() {
  return (
    <div className="pb-6">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span>🚀</span>Houston Rockets<span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] font-bold">Completed</span></div>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">🏆 WSOP Main FT — Results</h1>
        <div className="mt-1 text-xs text-zinc-500">9 entries · 🏆 750 pool · settled offline</div>
      </div>

      {/* podium */}
      <div className="px-4 pt-5">
        <div className="flex items-end justify-center gap-2">
          {PODIUM.map((p) => (
            <div key={p.rank} className="flex w-1/3 flex-col items-center">
              <div className={`grid h-12 w-12 place-items-center rounded-full text-base font-black text-zinc-900 ${p.color} ${p.you ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-[#0a0a0f]' : ''}`}>{p.name.split(' ').map((x) => x[0]).join('')}</div>
              <div className="mt-1 text-xs font-bold">{p.name}{p.you && <span className="text-sky-400"> (you)</span>}</div>
              <div className="text-[11px] text-zinc-500">{p.pts} pts</div>
              <div className={`mt-1 flex w-full ${p.h} flex-col items-center justify-start rounded-t-lg bg-gradient-to-b from-white/10 to-white/[0.02] pt-1.5`}>
                <span className="text-lg">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                <span className="mt-0.5 text-[10px] font-bold text-emerald-300">{p.prize}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* standings */}
      <div className="px-4 pt-5">
        <h2 className="mb-2 text-sm font-bold text-zinc-300">Final standings</h2>
        <div className="flex flex-col gap-1.5">
          {STANDINGS.map((s) => (
            <div key={s.rank} className={`flex items-center gap-3 rounded-xl border p-2.5 ${s.you ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-zinc-900/60'}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${s.rank <= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-zinc-400'}`}>{s.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}{s.you && <span className="text-sky-400"> · you</span>}</span>
                <span className="block truncate text-[11px] text-zinc-500">{s.team}</span>
              </span>
              <span className="font-mono text-sm font-bold text-violet-300">{s.pts}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-center text-[11px] leading-snug text-zinc-500">
          Winnings are settled <span className="font-semibold text-zinc-300">between players offline</span> — ClubrGo just keeps the score.
        </p>
      </div>
    </div>
  )
}
