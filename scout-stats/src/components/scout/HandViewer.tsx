import { useState } from 'react'
import { Play, X, ExternalLink, Film, Clapperboard } from 'lucide-react'
import MiniCard from '@/components/common/MiniCard'
import { CanvasPokerReplayer } from '@/components/poker-canvas'
import { sampleHandReplay } from '@/data/sampleHandReplay'
import { cn } from '@/lib/utils'

// Placeholder YouTube video id used by the mock dataset.
const VIDEO_ID = 'dQw4w9WgXcQ'

export interface ViewableHand {
  handNumber: number
  title?: string
  board?: string[]
  note?: string
  videoSeconds?: number | null
  hasReplay?: boolean
}

type View = 'youtube' | 'replayer'

function Modal({ hand, onClose }: { hand: ViewableHand; onClose: () => void }) {
  const hasClip = hand.videoSeconds != null
  const [view, setView] = useState<View>(hasClip ? 'youtube' : 'replayer')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-bg-card sm:max-h-[calc(100dvh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary">Hand #{hand.handNumber}</div>
            {hand.title && <div className="truncate text-xs text-text-muted">{hand.title}</div>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* scrollable body — keeps the header pinned and lets tall content (replayer) scroll inside the modal */}
        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* view toggle */}
        <div className="flex gap-1 p-3 pb-0">
          {([['youtube', 'YouTube clip', Film], ['replayer', 'Replayer', Clapperboard]] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer',
                view === v ? 'border-accent-blue bg-accent-blue/15 text-accent-blue' : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* pane */}
        <div className="p-3">
          {view === 'youtube' ? (
            <div className="relative overflow-hidden rounded-xl border border-border bg-black" style={{ aspectRatio: '16 / 9' }}>
              {hasClip ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${VIDEO_ID}?start=${hand.videoSeconds}`}
                  title={`Hand ${hand.handNumber} clip`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <Slot label="No clip linked to this hand yet" sub="Video URL will come from the per-hand capture." />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-black/40 p-2">
              <CanvasPokerReplayer
                handData={sampleHandReplay}
                layoutMode="portrait"
                width={368}
                height={540}
                showControls
                allowFullscreen={false}
                autoplay={false}
                soundEnabled={false}
                initialSpeed={1.5}
              />
              <span className="text-center text-[10px] text-text-muted">Demo hand in the real hudr replayer · live, this loads hand #{hand.handNumber}.</span>
            </div>
          )}

          {hand.note && <p className="mt-2 text-xs leading-snug text-text-secondary">{hand.note}</p>}

          <div className="mt-3 flex items-center gap-2">
            {hasClip && (
              <a
                href={`https://www.youtube.com/watch?v=${VIDEO_ID}&t=${hand.videoSeconds}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open on YouTube
              </a>
            )}
            <span className="ml-auto rounded-full bg-bg-surface px-2 py-1 text-[10px] text-text-muted">Integration pending</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

function Slot({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </div>
  )
}

function ReplayerSlot({ board }: { board?: string[] }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#0d2818] to-[#07140d] px-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><Clapperboard className="h-5 w-5 text-accent-emerald" /></span>
      {board && board.length > 0 && (
        <div className="flex gap-1">{board.map((c, i) => <MiniCard key={i} card={c} />)}</div>
      )}
      <span className="text-xs font-semibold text-white/80">Hand Replayer mounts here</span>
      <span className="max-w-[260px] text-[11px] text-white/50">The real hudr canvas replayer plugs in here, fed by the <code>/hand-replay</code> API. (Phase 2)</span>
    </div>
  )
}

/** Self-contained trigger + modal. Drop anywhere a hand can be viewed. */
export default function HandViewerButton({ hand, label = 'Watch', className }: { hand: ViewableHand; label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className={cn('flex items-center gap-1.5 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/20 cursor-pointer transition-colors', className)}
      >
        <Play className="h-3 w-3" /> {label}
      </button>
      {open && <Modal hand={hand} onClose={() => setOpen(false)} />}
    </>
  )
}
