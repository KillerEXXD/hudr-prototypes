import { Link } from 'react-router-dom'
import { ChevronRight, Radio } from 'lucide-react'
import type { Tournament } from '@/lib/api/domain'
import { fmtChips } from '@/lib/utils'

// One tournament row — shared by Discover, the Tournaments index, and Saved.
export default function TournamentListItem({ tournament: t }: { tournament: Tournament }) {
  return (
    <Link
      to={`/tournament/${t.id}`}
      className="block rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-text-primary">{t.name}</h3>
            {t.isLive && (
              <span className="flex items-center gap-1 rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-red">
                <Radio className="h-2.5 w-2.5" />LIVE
              </span>
            )}
          </div>
          <p className="truncate text-xs text-text-muted">{t.event} · {t.venue} · {t.date}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary nums">
        <span>{t.playerCount} players</span>
        <span>{t.handCount} hands</span>
        <span>{fmtChips(t.prizePool)}</span>
        {t.exploitableCount > 0 && (
          <span className="rounded-full bg-accent-amber/10 px-1.5 py-0.5 font-semibold text-accent-amber">
            {t.exploitableCount} exploitable
          </span>
        )}
      </div>
    </Link>
  )
}
