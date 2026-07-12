import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { usePlayers } from '@/hooks/referral'
import { Spinner, Avatar, Badge } from '@/components/common/ui'
import { money } from '@/lib/referralFormat'

export function AdminPlayers() {
  const nav = useNavigate()
  const { data, isLoading } = usePlayers()
  const [q, setQ] = useState('')

  if (isLoading || !data) return <Spinner />
  const rows = data.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold">Players</h1>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-surface px-3">
        <Search className="h-4 w-4 text-text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players…" className="w-full bg-transparent py-2.5 text-sm focus:outline-none" />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <button key={r.userId} type="button" onClick={() => nav(`/admin/players/${r.userId}`)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card px-3 py-3 text-left transition-colors hover:bg-bg-surface cursor-pointer">
            <Avatar name={r.name} color={r.avatarColor} pic={r.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold">{r.name}</span>{r.hasOverride && <Badge tone="amber">override</Badge>}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                <span className="font-mono">{r.scheduleLabel}</span>
                <span>· {r.directCount} direct · {r.residualCount} residual</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold tabular-nums text-accent-emerald">{money(r.earned)}</div>
              <div className="text-[10px] text-text-muted">app {money(r.appShare)}</div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
          </button>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-sm text-text-muted">No players match "{q}".</p>}
      </div>
    </div>
  )
}
