import { Link } from 'react-router-dom'
import { ChevronRight, Radio, Play } from 'lucide-react'
import type { Tournament } from '@/lib/api/domain'
import { fmtChips } from '@/lib/utils'

// One tournament row — shared by Discover, the Tournaments index, and Saved.
// Left-thumbnail layout: a rounded 16:9 YouTube thumbnail (or a gradient + Play
// placeholder) beside the existing name/meta/stats.
export default function TournamentListItem({ tournament: t }: { tournament: Tournament }) {
  const thumb = t.youtubeId ? `https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg` : null
  return (
    <Link
      to={`/tournament/${t.id}`}
      className="flex gap-3 rounded-xl border border-border bg-bg-card p-2.5 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
    >
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-bg-surface to-bg-secondary">
        <span className="absolute inset-0 flex items-center justify-center"><Play className="h-5 w-5 text-text-muted/50" /></span>
        {thumb && <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {t.isLive && (
          <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-accent-red/90 px-1 py-0.5 text-[8px] font-bold text-white"><Radio className="h-2 w-2" />LIVE</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">{t.name}</h3>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
        </div>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">{t.event} · {t.venue} · {t.date}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-secondary nums">
          <span>{t.playerCount} players</span>
          <span>{t.handCount} hands</span>
          <span>{fmtChips(t.prizePool)}</span>
          {t.exploitableCount > 0 && (
            <span className="rounded-full bg-accent-amber/10 px-1.5 py-0.5 font-semibold text-accent-amber">{t.exploitableCount} exploitable</span>
          )}
        </div>
      </div>
    </Link>
  )
}
