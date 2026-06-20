import { useState } from 'react'

type NType = 'club_req' | 'club_ok' | 'game_req' | 'game_ok'
const STYLE: Record<NType, { icon: string; color: string; bg: string }> = {
  club_req: { icon: '👤', color: 'text-sky-300', bg: 'bg-sky-500/15' },
  club_ok:  { icon: '✓', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  game_req: { icon: '🎮', color: 'text-violet-300', bg: 'bg-violet-500/15' },
  game_ok:  { icon: '🎉', color: 'text-amber-300', bg: 'bg-amber-500/15' },
}
const TITLE: Record<NType, string> = { club_req: 'New join request', club_ok: 'Approved', game_req: 'New game request', game_ok: "You're in!" }

const ALL: { type: NType; body: string; ago: string; unread?: boolean }[] = [
  { type: 'club_req', body: 'Tilly S asked to join Houston Rockets.', ago: '1h', unread: true },
  { type: 'game_req', body: 'Gabby B asked to join WSOP Main FT.', ago: '1h', unread: true },
  { type: 'club_ok', body: "You're now a member of Dallas Gladiators.", ago: '2h', unread: true },
  { type: 'game_ok', body: "You're in — Friday Night Last Longer.", ago: '2h', unread: true },
  { type: 'club_req', body: 'Annie S asked to join Houston Rockets.', ago: '3h' },
  { type: 'game_ok', body: "You're in — Sunday Squares.", ago: '4h' },
  { type: 'club_ok', body: "You're now a member of Austin Warriors.", ago: '5h' },
  { type: 'game_req', body: 'Vasco T asked to join 200k Dallas.', ago: '6h' },
  { type: 'club_req', body: 'Sara R asked to join The Lodge.', ago: '8h' },
  { type: 'club_ok', body: "You're now a member of The Lodge.", ago: '1d' },
  { type: 'game_ok', body: "You're in — WSOP Main FT.", ago: '1d' },
  { type: 'game_req', body: 'Tom D asked to join Lodge Championship.', ago: '2d' },
]

export function Notifications() {
  const [visible, setVisible] = useState(8)
  const shown = ALL.slice(0, visible)
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-black tracking-tight">Recent notifications</h1>
        <button aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-300 shadow-sm transition hover:bg-white/10 hover:text-white">✕</button>
      </div>

      <div className="px-4 pt-3">
        <button className="mb-2 ml-auto block text-xs font-bold text-sky-400">Mark all read</button>
        <div className="flex flex-col gap-1.5">
          {shown.map((n, i) => {
            const s = STYLE[n.type]
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border border-white/10 p-3 ${n.unread ? 'bg-white/[0.05]' : 'bg-zinc-900/50'}`}>
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm ${s.bg} ${s.color}`}>{s.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`truncate text-sm font-extrabold ${s.color}`}>{TITLE[n.type]}</span>
                    {n.unread && <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">New</span>}
                    <span className="ml-auto shrink-0 text-[11px] text-zinc-500">{n.ago}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-zinc-400">{n.body}</span>
                </span>
              </div>
            )
          })}
        </div>
        {visible < ALL.length && (
          <button onClick={() => setVisible((v) => v + 15)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white">
            More · {ALL.length - visible} older
          </button>
        )}
      </div>
    </div>
  )
}
