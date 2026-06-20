import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gamepad2, Plus, LayoutGrid, Clock, Ticket, Trophy, Lock, type LucideIcon } from 'lucide-react'
import { useGames } from '@/hooks'
import { TYPE, STATUS, PrimaryBtn } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { GameType, Relationship } from '@/types'

const PILLS: { key: Relationship; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'playing', label: 'Playing' },
  { key: 'hosting', label: 'Hosting' },
]
const TYPES: { key: 'all' | GameType; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'ft', label: 'FTF', icon: TYPE.ft.icon },
  { key: 'll', label: 'LL', icon: TYPE.ll.icon },
  { key: 'sq', label: 'Squares', icon: TYPE.sq.icon },
]

export function GamesPage() {
  const navigate = useNavigate()
  const { data: games = [] } = useGames()
  const [rel, setRel] = useState<Relationship>('playing')
  const [type, setType] = useState<'all' | GameType>('all')

  const counts = { available: 0, playing: 0, hosting: 0 } as Record<Relationship, number>
  for (const g of games) counts[g.relationship]++
  const shown = games.filter((g) => g.relationship === rel).filter((g) => type === 'all' || g.type === type)

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight"><Gamepad2 className="h-6 w-6 text-accent-blue" />Games</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Everything across your clubs.</p>
        </div>
        <PrimaryBtn className="!px-3.5 !py-2 !text-xs"><span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" />New game</span></PrimaryBtn>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {PILLS.map((p) => (
          <button key={p.key} onClick={() => setRel(p.key)} className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition', rel === p.key ? 'bg-accent-emerald/20 text-accent-emerald ring-1 ring-accent-emerald/50' : 'bg-bg-surface text-text-muted ring-1 ring-border')}>
            {p.label} <span className={rel === p.key ? 'text-accent-emerald/80' : 'text-text-muted'}>{counts[p.key]}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => setType(t.key)} className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition', type === t.key ? 'bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40' : 'border border-border text-text-muted')}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {shown.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-bg-surface"><Gamepad2 className="h-7 w-7 text-text-muted" /></div>
            <p className="font-bold">No games here yet</p>
            <p className="max-w-[15rem] text-sm text-text-muted">Nothing in this tab right now — check the others, or host one.</p>
          </div>
        ) : shown.map((g) => {
          const t = TYPE[g.type], s = STATUS[g.status]
          return (
            <button key={g.id} onClick={() => navigate(g.type === 'ft' ? '/draft' : '/club')} className={cn('relative overflow-hidden rounded-2xl border border-border bg-bg-card p-3.5 text-left shadow-lg ring-1 transition active:scale-[.99]', t.ring)}>
              <div className={cn('pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b to-transparent blur-2xl', t.glow)} />
              <div className="relative flex items-center justify-between">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', t.bg, t.text)}><t.icon className="h-3.5 w-3.5" />{t.label}</span>
                <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', s.cls)}>{s.label}</span>
              </div>
              <div className="relative mt-2.5 flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="text-sm">{g.clubEmoji}</span><span className="font-medium">{g.club}</span>
                {g.private && <span className="flex items-center gap-0.5 rounded bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-muted"><Lock className="h-2.5 w-2.5" />Private</span>}
              </div>
              <h3 className="relative mt-0.5 text-lg font-extrabold tracking-tight">{g.title}</h3>
              <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="flex items-center gap-1 rounded-md bg-bg-surface px-2 py-1 font-semibold text-text-primary"><Ticket className="h-3 w-3" />{g.stake}</span>
                <span className="flex items-center gap-1 rounded-md bg-accent-emerald/10 px-2 py-1 font-semibold text-accent-emerald"><Trophy className="h-3 w-3" />{g.pool}</span>
                <span className="text-text-muted">· {g.joined} joined</span>
                <span className="nums ml-auto flex items-center gap-1 text-text-secondary">
                  {g.status === 'completed' ? <span className="text-text-muted">ended</span> : <><Clock className={cn('h-3 w-3', g.status === 'running' ? 'text-accent-emerald' : 'text-accent-blue')} />{g.closesIn}</>}
                </span>
              </div>
              <div className="relative mt-2 text-[11px] text-text-muted">{g.sub}</div>
            </button>
          )
        })}
      </div>

      <p className="mt-6 rounded-xl bg-bg-card/60 p-3 text-center text-[11px] leading-snug text-text-muted">
        ClubrGo is just the <span className="font-semibold text-text-secondary">scorekeeper</span> — it holds <span className="font-semibold text-text-secondary">no cash</span>. Stakes are settled between players offline.
      </p>
    </div>
  )
}
