/**
 * HandHistoryPanel Component
 *
 * A slide-out panel displaying all hands in a tournament.
 * Each hand shows winner info, hole cards, net win, and pot amount.
 * Clicking a hand loads it into the replayer.
 *
 * Fetches data lazily when panel is opened (not on page load).
 * Uses infinite scroll to load 8 hands at a time.
 * Includes search by hand number.
 */

import { useCallback, useRef, useEffect, useMemo, useState, forwardRef } from 'react'
import { X, History, Trophy, Loader2, Search, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Card } from '@/types/hand'
import { parseCard } from '@/lib/utils/cardParser'
import { MiniCardPair } from './MiniCardPair'
import { useInfiniteHands } from '@/hooks/useTournaments'

// =====================
// Types
// =====================

export interface HandSummary {
  handId: string
  handNumber: number
  winnerName: string
  winnerCards: [Card, Card] | null
  netWin: number
  potTotal: number
}

interface HandHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  /** Tournament ID to fetch hands for */
  tournamentId?: string
  currentHandId?: string
  onHandSelect: (handId: string) => void
}

// =====================
// Helpers
// =====================


function formatChips(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`
  }
  return amount.toLocaleString()
}

function formatNetWin(amount: number): string {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${formatChips(amount)}`
}

// =====================
// Components
// =====================

interface HandRowProps {
  hand: HandSummary
  isActive: boolean
  onClick: () => void
}

const HandRow = forwardRef<HTMLButtonElement, HandRowProps>(
  function HandRow({ hand, isActive, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all',
        'hover:bg-white/10',
        isActive
          ? 'bg-blue-600/30 border border-blue-500/50'
          : 'bg-white/5 border border-transparent'
      )}
    >
      {/* Hand Number - smaller */}
      <div
        className={cn(
          'w-6 h-6 flex items-center justify-center rounded text-xs font-bold shrink-0',
          isActive
            ? 'bg-blue-600 text-white'
            : 'bg-white/10 text-white/70'
        )}
      >
        {hand.handNumber}
      </div>

      {/* Winner Cards - larger for visibility */}
      <div className="shrink-0">
        {hand.winnerCards ? (
          <MiniCardPair cards={hand.winnerCards} size="sm" />
        ) : (
          <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center">
            <span className="text-white/30 text-xs">?</span>
          </div>
        )}
      </div>

      {/* Winner Name */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          {isActive && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
          <span className={cn(
            'text-sm font-medium truncate',
            isActive ? 'text-white' : 'text-white/80'
          )}>
            {hand.winnerName}
          </span>
        </div>
        <div className="text-xs text-white/50 truncate">
          Pot: {formatChips(hand.potTotal)}
        </div>
      </div>

      {/* Net Win */}
      <div
        className={cn(
          'text-sm font-semibold shrink-0',
          hand.netWin >= 0 ? 'text-green-400' : 'text-red-400'
        )}
      >
        {formatNetWin(hand.netWin)}
      </div>
    </button>
    )
  }
)

// =====================
// Main Component
// =====================

export function HandHistoryPanel({
  isOpen,
  onClose,
  tournamentId,
  currentHandId,
  onHandSelect,
}: HandHistoryPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const currentHandRef = useRef<HTMLButtonElement>(null)

  // Search state — debounced auto-search triggers on typing (mobile-friendly)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Reset search when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setDebouncedSearch('')
    }
  }, [isOpen])

  // Debounce: auto-search 400ms after user stops typing
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed === debouncedSearch) return
    const timer = setTimeout(() => setDebouncedSearch(trimmed), 400)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Build query params — include hand_number for server-side search
  const searchNum = debouncedSearch ? parseInt(debouncedSearch, 10) : undefined
  const queryParams = useMemo(() => ({
    limit: 8,
    sort_by: 'hand_number',
    order: 'asc',
    ...(searchNum && !isNaN(searchNum) ? { hand_number: searchNum } : {}),
  }), [searchNum])

  // Fetch hands only when panel is open (pass empty string when closed to disable query)
  const {
    data: handsInfiniteData,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteHands(
    isOpen ? (tournamentId || '') : '',
    queryParams,
    undefined // tournamentStatus
  )

  // BUG-400: Track if user-initiated refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Clear refreshing state when fetch completes
  useEffect(() => {
    if (!isFetching && isRefreshing) {
      setIsRefreshing(false)
    }
  }, [isFetching, isRefreshing])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    refetch()
  }, [refetch])

  // Transform API data to HandSummary format
  const hands = useMemo<HandSummary[]>(() => {
    if (!handsInfiniteData?.pages) return []
    const flatHands = handsInfiniteData.pages.flatMap(page => page.data)
    // Sort by hand_number ascending
    const sortedHands = flatHands.sort((a, b) => {
      const aNum = typeof a.hand_number === 'string' ? parseInt(a.hand_number, 10) : a.hand_number
      const bNum = typeof b.hand_number === 'string' ? parseInt(b.hand_number, 10) : b.hand_number
      return aNum - bNum
    })
    // Transform to HandSummary
    return sortedHands.map(hand => {
      // Parse hole cards from string[] (e.g. ["As", "Kh"]) to Card[]
      let winnerCards: [Card, Card] | null = null
      if (hand.winner_hole_cards && hand.winner_hole_cards.length >= 2) {
        winnerCards = [
          parseCard(hand.winner_hole_cards[0]),
          parseCard(hand.winner_hole_cards[1]),
        ]
      }
      return {
        handId: hand.hand_id,
        handNumber: typeof hand.hand_number === 'string' ? parseInt(hand.hand_number, 10) : hand.hand_number,
        winnerName: hand.winner_name || 'Unknown',
        winnerCards,
        // pot_total or pot for winnings (net_result not available in this endpoint)
        netWin: hand.pot_total ?? hand.pot ?? 0,
        potTotal: hand.pot_total ?? hand.pot ?? 0,
      }
    })
  }, [handsInfiniteData])

  // Get total count from first page meta
  const totalHands = handsInfiniteData?.pages?.[0]?.meta?.total ?? 0

  // Scroll to current hand when panel opens and hands are loaded
  useEffect(() => {
    if (isOpen && currentHandId && currentHandRef.current && !isLoading) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        currentHandRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, currentHandId, isLoading, hands])

  // Search handlers
  const handleSearch = useCallback(() => {
    // Instant search — skip debounce
    setDebouncedSearch(searchQuery.trim())
  }, [searchQuery])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearch('')
    searchInputRef.current?.focus()
  }, [])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  // Infinite scroll - observe sentinel element
  useEffect(() => {
    if (!isOpen || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = loadMoreRef.current
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleHandClick = useCallback((handId: string) => {
    onHandSelect(handId)
    onClose()
  }, [onHandSelect, onClose])

  // Stop touch events from propagating to parent (FullscreenReplayer)
  // This prevents scrolling in the panel from triggering swipe gestures
  const handleTouchEvent = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
  }, [])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'absolute top-0 right-0 w-80 max-w-[90%]',
        'bg-gray-900/95 backdrop-blur-md border-l border-b border-white/10 rounded-bl-xl',
        'flex flex-col z-50',
        'animate-in slide-in-from-right duration-200'
      )}
      onTouchStart={handleTouchEvent}
      onTouchMove={handleTouchEvent}
      onTouchEnd={handleTouchEvent}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-white/70" />
          <span className="text-white font-semibold">Hand History</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Refresh hand history"
          >
            <RefreshCw className={cn('w-4 h-4 text-white/70', isRefreshing && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close hand history"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Search hand #"
              value={searchQuery}
              onChange={(e) => {
                // Only allow numeric input
                const value = e.target.value.replace(/[^0-9]/g, '')
                setSearchQuery(value)
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!searchQuery}
            className={cn(
              "h-9 px-3 rounded-lg text-sm font-medium transition-colors",
              searchQuery
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
          >
            Go
          </button>
          {(searchQuery || debouncedSearch) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="h-9 px-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Hand List - fixed height for 8 hands with scroll */}
      <div className="h-[340px] overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <Loader2 className="w-8 h-8 mb-2 animate-spin text-amber-500" />
            <p className="text-sm">Loading hands...</p>
          </div>
        ) : hands.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <History className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">
              {debouncedSearch ? `No hand #${debouncedSearch} found` : 'No hands available'}
            </p>
          </div>
        ) : (
          <>
            {hands.map((hand) => (
              <HandRow
                key={hand.handId}
                ref={hand.handId === currentHandId ? currentHandRef : null}
                hand={hand}
                isActive={hand.handId === currentHandId}
                onClick={() => handleHandClick(hand.handId)}
              />
            ))}
            {/* Infinite scroll sentinel - only show when not searching */}
            {!debouncedSearch && hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-3">
                {isFetchingNextPage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                ) : (
                  <span className="text-xs text-white/30">Scroll for more</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with count and hint */}
      <div className="px-4 py-2 border-t border-white/10 flex flex-col items-center gap-0.5">
        <span className="text-xs text-white/60">
          Showing {hands.length} of {totalHands} hands
        </span>
        <span className="text-[10px] text-white/40">Click a hand to replay</span>
      </div>
    </div>
  )
}
