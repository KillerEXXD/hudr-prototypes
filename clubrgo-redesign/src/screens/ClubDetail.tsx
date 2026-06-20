import { TYPE, STATUS, type GType } from '../ui'

const MEMBERS = [
  { name: 'Ravee S', color: 'bg-sky-500', role: 'Host' },
  { name: 'Tom D', color: 'bg-violet-500' },
  { name: 'Gabby B', color: 'bg-rose-500' },
  { name: 'Annie S', color: 'bg-emerald-500' },
  { name: 'Sara R', color: 'bg-amber-500' },
  { name: 'Vasco T', color: 'bg-fuchsia-500' },
]
const GAMES: { type: GType; title: string; meta: string; status: keyof typeof STATUS }[] = [
  { type: 'ft', title: 'WSOP Main FT', meta: '250 buy-in · 3 joined', status: 'open' },
  { type: 'll', title: 'Friday Night Last Longer', meta: '100 buy-in · 9 joined', status: 'running' },
  { type: 'sq', title: 'Sunday Squares', meta: '50 buy-in · 22 joined', status: 'completed' },
]

export function ClubDetail({ onOpenGame }: { onOpenGame: () => void }) {
  return (
    <div className="pb-6">
      <div className="relative h-28 bg-gradient-to-br from-sky-600/40 via-violet-600/30 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.08),transparent_60%)]" />
        <button className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-sm backdrop-blur">←</button>
      </div>

      <div className="px-4">
        <div className="-mt-9 flex items-end gap-3">
          <div className="grid h-18 w-18 shrink-0 place-items-center rounded-2xl border border-white/15 bg-zinc-900 text-3xl shadow-xl" style={{ height: 72, width: 72 }}>🚀</div>
          <div className="pb-1">
            <h1 className="text-xl font-black tracking-tight">Houston Rockets</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400"><span className="rounded bg-white/5 px-1.5 py-0.5">🔒 Private</span>· 6 members</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25">+ New game</button>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold">Invite</button>
        </div>

        {/* members */}
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-300">Members</h2><span className="text-xs text-zinc-500">6</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MEMBERS.map((m) => (
            <div key={m.name} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${m.color}`}>{m.name.split(' ').map((x) => x[0]).join('')}</span>
              <span className="text-xs font-semibold">{m.name}</span>
              {m.role && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">{m.role}</span>}
            </div>
          ))}
        </div>

        {/* games */}
        <h2 className="mt-6 text-sm font-bold text-zinc-300">Games</h2>
        <div className="mt-2 flex flex-col gap-2">
          {GAMES.map((g, i) => {
            const t = TYPE[g.type]
            return (
              <button key={i} onClick={onOpenGame} className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-3 text-left ring-1 ${t.ring} transition active:scale-[.99]`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${t.chip}`}>{t.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{g.title}</span>
                  <span className="text-[11px] text-zinc-500">{g.meta}</span>
                </span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS[g.status]}`}>{g.status === 'open' ? 'Open' : g.status === 'running' ? 'Running' : 'Done'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
