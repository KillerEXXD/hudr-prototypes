import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Plus, UserPlus } from 'lucide-react'
import { useClubMembers, useClubGames } from '@/hooks'
import { TYPE, STATUS } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export function ClubDetailPage() {
  const navigate = useNavigate()
  const { data: members = [] } = useClubMembers()
  const { data: games = [] } = useClubGames()

  return (
    <div className="pb-6">
      <div className="relative h-28 bg-gradient-to-br from-accent-blue/40 via-accent-violet/30 to-transparent">
        <button onClick={() => navigate('/')} className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 backdrop-blur"><ChevronLeft className="h-4 w-4" /></button>
      </div>

      <div className="px-4">
        <div className="-mt-9 flex items-end gap-3">
          <div className="grid shrink-0 place-items-center rounded-2xl border border-border-light bg-bg-card text-3xl shadow-xl" style={{ height: 72, width: 72 }}>🚀</div>
          <div className="pb-1">
            <h1 className="text-xl font-black tracking-tight">Houston Rockets</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary"><span className="flex items-center gap-0.5 rounded bg-bg-surface px-1.5 py-0.5 text-text-muted"><Lock className="h-2.5 w-2.5" />Private</span>· {members.length} members</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent-blue py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-blue/25"><Plus className="h-4 w-4" />New game</button>
          <button className="flex items-center gap-1 rounded-xl border border-border-light bg-bg-surface px-4 py-2.5 text-sm font-bold"><UserPlus className="h-4 w-4" />Invite</button>
        </div>

        <div className="mt-5 flex items-center justify-between"><h2 className="text-sm font-bold text-text-secondary">Members</h2><span className="text-xs text-text-muted">{members.length}</span></div>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-2 rounded-full border border-border bg-bg-surface py-1 pl-1 pr-3">
              <span className={cn('grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white', m.color)}>{m.name.split(' ').map((x) => x[0]).join('')}</span>
              <span className="text-xs font-semibold">{m.name}</span>
              {m.role && <span className="rounded bg-accent-emerald/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald">{m.role}</span>}
            </div>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-bold text-text-secondary">Games</h2>
        <div className="mt-2 flex flex-col gap-2">
          {games.map((g) => {
            const t = TYPE[g.type], s = STATUS[g.status]
            return (
              <button key={g.id} onClick={() => navigate('/draft')} className={cn('flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 text-left ring-1 transition active:scale-[.99]', t.ring)}>
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.bg, t.text)}><t.icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{g.title}</span><span className="text-[11px] text-text-muted">{g.stake} · {g.joined} joined</span></span>
                <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', s.cls)}>{g.status === 'open' ? 'Open' : g.status === 'running' ? 'Running' : 'Done'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
