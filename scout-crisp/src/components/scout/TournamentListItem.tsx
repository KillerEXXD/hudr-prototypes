import { Link } from 'react-router-dom'
import { ChevronRight, Radio, Play } from 'lucide-react'
import type { Tournament } from '@/lib/api/domain'
import { fmtChips } from '@/lib/utils'

// One tournament row — shared by Discover, the Tournaments index, and Saved.
// Top-banner layout: a full-width 16:9 YouTube thumbnail (or a gradient + Play
// placeholder) above the existing name/meta/stats.
export default function TournamentListItem({ tournament: t }: { tournament: Tournament }) {
  const thumb = t.youtubeId ? `https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg` : null
  return (
    <Link
      to={`/tournament/${t.id}`}
      className="block overflow-hidden rounded-xl border border-border bg-bg-card transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
    >
      <div className="relative aspect-video w-full bg-gradient-to-br from-bg-surface to-bg-secondary">
        <span className="absolute inset-0 flex items-center justify-center"><Play className="h-8 w-8 text-text-muted/40" /></span>
        {thumb && <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {t.isLive && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent-red/90 px-1.5 py-0.5 text-[10px] font-bold text-white"><Radio className="h-2.5 w-2.5" />LIVE</span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug text-text-primary">{t.name}</h3>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
        </div>
        <p className="mt-0.5 truncate text-xs text-text-muted">{t.event} · {t.venue} · {t.date}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary nums">
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
