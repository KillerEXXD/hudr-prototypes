/**
 * HighlightsPanel - Tournament highlights browser
 *
 * Displays a slideover panel with tournament highlights that users can browse
 * and select to play in the replayer without leaving the current view.
 */

import { memo, useCallback, useMemo } from 'react'
import { X, Trophy, Users, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TournamentHighlight } from '@/stores/replayerStore'

// =====================
// Types
// =====================

interface HighlightsPanelProps {
  isOpen: boolean
  onClose: () => void
  highlights: TournamentHighlight[]
  selectedHighlightId: string | null
  currentHandId?: string
  onSelectHighlight: (highlight: TournamentHighlight) => void
  isLoading?: boolean
  error?: Error | null
  tournamentName?: string
}

interface HighlightCardProps {
  highlight: TournamentHighlight
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
}

// =====================
// Helper Functions
// =====================

function formatPotSize(pot: number | null | undefined): string {
  if (pot == null) return '-'
  if (pot >= 1000000) {
    return `${(pot / 1000000).toFixed(2)}M`
  }
  if (pot >= 1000) {
    return `${(pot / 1000).toFixed(2)}K`
  }
  return pot.toLocaleString()
}

function getStreetLabel(street: TournamentHighlight['street']): string {
  const labels: Record<TournamentHighlight['street'], string> = {
    preflop: 'Preflop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown',
  }
  return labels[street] || street
}

function getStreetColor(street: TournamentHighlight['street']): string {
  const colors: Record<TournamentHighlight['street'], string> = {
    preflop: 'bg-blue-500/20 text-blue-300',
    flop: 'bg-green-500/20 text-green-300',
    turn: 'bg-yellow-500/20 text-yellow-300',
    river: 'bg-red-500/20 text-red-300',
    showdown: 'bg-purple-500/20 text-purple-300',
  }
  return colors[street] || 'bg-gray-500/20 text-gray-300'
}

// =====================
// Highlight Card Component
// =====================

const HighlightCard = memo(function HighlightCard({
  highlight,
  isSelected,
  isCurrent,
  onSelect,
}: HighlightCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-all duration-150',
        'border border-transparent',
        'hover:bg-white/10',
        isSelected && 'bg-white/15 border-white/20',
        isCurrent && 'ring-2 ring-primary/50'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {highlight.title}
          </h4>
          <p className="text-xs text-white/60 truncate mt-0.5">
            Hand #{highlight.handNumber}
          </p>
        </div>
        {isCurrent && (
          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            Playing
          </span>
        )}
      </div>

      {/* Description */}
      {highlight.description && (
        <p className="text-xs text-white/50 line-clamp-2 mb-2">
          {highlight.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-white/40">
        {/* Players involved */}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {highlight.players.length}
        </span>

        {/* Pot size */}
        <span className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {formatPotSize(highlight.potSize)}
        </span>

        {/* Street badge */}
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            getStreetColor(highlight.street)
          )}
        >
          {getStreetLabel(highlight.street)}
        </span>
      </div>

      {/* Tags */}
      {highlight.tags && highlight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {highlight.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
})

// =====================
// Loading Skeleton
// =====================

function HighlightSkeleton() {
  return (
    <div className="p-3 rounded-lg bg-white/5 animate-pulse">
      <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
      <div className="h-3 w-1/2 bg-white/10 rounded mb-3" />
      <div className="flex gap-3">
        <div className="h-3 w-12 bg-white/10 rounded" />
        <div className="h-3 w-12 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  )
}

// =====================
// Empty State
// =====================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Trophy className="h-12 w-12 text-white/20 mb-4" />
      <h4 className="text-sm font-medium text-white/60 mb-1">
        No highlights yet
      </h4>
      <p className="text-xs text-white/40">
        Highlights from this tournament will appear here
      </p>
    </div>
  )
}

// =====================
// Error State
// =====================

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <X className="h-6 w-6 text-red-400" />
      </div>
      <h4 className="text-sm font-medium text-white/60 mb-1">
        Failed to load highlights
      </h4>
      <p className="text-xs text-white/40 mb-4">
        {error.message}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-xs"
        >
          Try again
        </Button>
      )}
    </div>
  )
}

// =====================
// Main Panel Component
// =====================

export const HighlightsPanel = memo(function HighlightsPanel({
  isOpen,
  onClose,
  highlights,
  selectedHighlightId,
  currentHandId,
  onSelectHighlight,
  isLoading = false,
  error = null,
  tournamentName,
}: HighlightsPanelProps) {
  const handleSelect = useCallback(
    (highlight: TournamentHighlight) => {
      onSelectHighlight(highlight)
    },
    [onSelectHighlight]
  )

  // Sort highlights by timestamp (most recent first) or by pot size
  const sortedHighlights = useMemo(() => {
    return [...highlights].sort((a, b) => {
      // Sort by pot size descending (biggest pots first)
      return b.potSize - a.potSize
    })
  }, [highlights])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[90vw] z-50',
          'bg-gray-900/95 backdrop-blur-xl border-l border-white/10',
          'flex flex-col',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Tournament highlights"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Highlights</h3>
              {tournamentName && (
                <p className="text-xs text-white/50 truncate max-w-[180px]">
                  {tournamentName}
                </p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            // Loading state
            <>
              <HighlightSkeleton />
              <HighlightSkeleton />
              <HighlightSkeleton />
            </>
          ) : error ? (
            // Error state
            <ErrorState error={error} />
          ) : sortedHighlights.length === 0 ? (
            // Empty state
            <EmptyState />
          ) : (
            // Highlights list
            sortedHighlights.map((highlight) => (
              <HighlightCard
                key={highlight.handId}
                highlight={highlight}
                isSelected={selectedHighlightId === highlight.handId}
                isCurrent={currentHandId === highlight.handId}
                onSelect={() => handleSelect(highlight)}
              />
            ))
          )}
        </div>

        {/* Footer with count */}
        {!isLoading && !error && sortedHighlights.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">
              {sortedHighlights.length} highlight{sortedHighlights.length !== 1 ? 's' : ''} available
            </p>
          </div>
        )}
      </div>
    </>
  )
})

export default HighlightsPanel
