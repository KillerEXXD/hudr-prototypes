import { useState } from 'react'
import { TYPE, STATUS, type GType, PrimaryBtn } from '../ui'

type G = { type: GType; club: string; emoji: string; title: string; stake: string; pool: string; joined: number; closes: string; status: keyof typeof STATUS; sub: string; priv?: boolean }

const GAMES: G[] = [
  { type: 'll', club: 'Dallas Gladiators', emoji: '🤠', title: '200k Dallas Tournament', stake: '250 buy-in', pool: '1,750 pool', joined: 7, closes: '12:08', status: 'open', sub: '4 winners · 50/25/20/5' },
  { type: 'ft', club: 'Houston Rockets', emoji: '🚀', title: 'WSOP Main FT', stake: '250 buy-in', pool: '750 pool', joined: 3, closes: '13:32', status: 'open', sub: 'Top 3 · 50/30/20', priv: true },
  { type: 'sq', club: 'Austin Warriors', emoji: '⚔️', title: 'Cowboys vs Eagles Squares', stake: '100 buy-in', pool: '900 pool', joined: 18, closes: '14:31', status: 'running', sub: 'Winner each quarter' },
  { type: 'ft', club: 'The Lodge', emoji: '🏔️', title: 'Lodge Championship FT', stake: '500 buy-in', pool: '3,000 pool', joined: 6, closes: '—', status: 'completed', sub: 'Won by Seidel' },
]
const PILLS = [['available', 'Available', 0], ['playing', 'Playing', 8], ['hosting', 'Hosting', 1], ['completed', 'Completed', 4]] as const
const TYPES = [['all', 'All'], ['ft', 'FTF'], ['ll', 'LL'], ['sq', 'Squares']] as const

export function GamesFeed({ onOpenDraft, onOpenClub }: { onOpenDraft: () => void; onOpenClub: () => void }) {
  const [pill, setPill] = useState('playing')
  const [type, setType] = useState('all')
  const list = GAMES.filter((g) => type === 'all' || g.type === type)

  return (
    <div>
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-1 text-lg font-black tracking-tight"><span className="text-sky-400">♣</span>Clubr<span className="text-sky-400">GO</span></div>
        <div className="flex items-center gap-2.5 text-sm">
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">🪙 1,400</span>
          <button className="relative">🔔<span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">5</span></button>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 text-xs font-bold">RS</div>
        </div>
      </div>

      <div className="px-4 pb-6 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight">🎮 Games</h1>
            <p className="mt-0.5 text-sm text-zinc-400">Everything across your clubs.</p>
          </div>
          <PrimaryBtn className="!px-3.5 !py-2 !text-xs">+ New game</PrimaryBtn>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {PILLS.map(([k, l, n]) => (
            <button key={k} onClick={() => setPill(k)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${pill === k ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50' : 'bg-white/5 text-zinc-400 ring-1 ring-white/5'}`}>
              {l} <span className={pill === k ? 'text-emerald-400/80' : 'text-zinc-600'}>{n}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {TYPES.map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${type === k ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40' : 'border border-white/10 text-zinc-400'}`}>{l}</button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {list.map((g, i) => {
            const t = TYPE[g.type]
            return (
              <button key={i} onClick={g.type === 'ft' ? onOpenDraft : onOpenClub} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 p-3.5 text-left shadow-lg ring-1 ${t.ring} transition active:scale-[.99]`}>
                <div className={`pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b ${t.glow} to-transparent blur-2xl`} />
                <div className="relative flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${t.chip}`}>{t.emoji} {t.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS[g.status]}`}>{g.status === 'open' ? 'Registration open' : g.status === 'running' ? 'Running' : 'Completed'}</span>
                </div>
                <div className="relative mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="text-sm">{g.emoji}</span><span className="font-medium text-zinc-300">{g.club}</span>
                  {g.priv && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">🔒 Private</span>}
                </div>
                <h3 className="relative mt-0.5 text-lg font-extrabold tracking-tight">{g.title}</h3>
                <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md bg-white/5 px-2 py-1 font-semibold text-zinc-200">🎟️ {g.stake}</span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-300">🏆 {g.pool}</span>
                  <span className="text-zinc-500">· {g.joined} joined</span>
                  <span className="ml-auto font-mono text-zinc-300">{g.status === 'completed' ? <span className="text-zinc-500">ended</span> : <><span className={g.status === 'running' ? 'text-emerald-400' : 'text-sky-400'}>⏱</span> {g.closes}</>}</span>
                </div>
                <div className="relative mt-2 text-[11px] text-zinc-500">{g.sub}</div>
              </button>
            )
          })}
        </div>

        <p className="mt-6 rounded-xl bg-white/[0.03] p-3 text-center text-[11px] leading-snug text-zinc-500">
          ClubrGo is just the <span className="font-semibold text-zinc-300">scorekeeper</span> — it holds <span className="font-semibold text-zinc-300">no cash</span>. Stakes are settled between players offline.
        </p>
      </div>
    </div>
  )
}
