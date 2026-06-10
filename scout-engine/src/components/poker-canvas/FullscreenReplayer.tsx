/**
 * FullscreenReplayer - Mobile-First Fullscreen Hand Replay
 *
 * A fullscreen wrapper for the poker replayer designed for mobile devices.
 * Features:
 * - Portrait-optimized layout
 * - Prominent close button
 * - Swipe down gesture to close
 * - No navigation bars (immersive experience)
 * - Dealer always at bottom of table
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { CanvasPokerReplayer } from './CanvasPokerReplayer'
import type { AnimationSpeeds, HandReplaySource } from './types/canvas-types'
import { cn } from '@/lib/utils'

// =====================
// Types
// =====================

export interface FullscreenReplayerProps {
  /** Hand data to replay */
  handData: HandReplaySource
  /** Called when user requests to close (via button or gesture) */
  onClose: () => void
  /** Initial playback speed. Default: 1.5 */
  initialSpeed?: number
  /** Whether to start playing immediately. Default: true */
  autoplay?: boolean
  /** Animation speed overrides */
  animationSpeeds?: AnimationSpeeds
  /** Custom class name */
  className?: string
  // Hand History Panel support
  /** Tournament ID for fetching hand history (lazy loaded when panel opens) */
  tournamentId?: string
  /** Callback when user selects a different hand from history */
  onHandSelect?: (handId: string) => void
  /** Current hand ID (to highlight in history) */
  currentHandId?: string
  /** When true, shows inline loading overlay (for hand switching) */
  isLoadingHand?: boolean
  /** Hand number being loaded (for display in loading overlay) */
  loadingHandNumber?: number
  /** Callback when user swipes up for next hand */
  onNextHand?: () => void
  /** Next hand number (for swipe-up hint) */
  nextHandNumber?: number | null
  // Debug data enrichment
  /** API load status for bug report debug data */
  apiStatus?: { httpStatus: number | null; loadSuccess: boolean; transformError?: string; transformErrorCode?: string; errorMessage?: string }
  /** Sentry session replay URL */
  sentryReplayUrl?: string
  /** Sentry debug IDs for linking to Sentry logs */
  sentryIds?: { lastEventId: string; traceId: string; replayId: string }
  /** Reporter email for bug reports (from HUDR auth) */
  reporterEmail?: string
  /** Reporter name for bug reports (from HUDR auth) */
  reporterName?: string
}

interface TouchState {
  startY: number
  startX: number
  startTime: number
}

// =====================
// Constants
// =====================

const CLOSE_SWIPE_THRESHOLD = 100  // Distance for close gesture (swipe down)
const NEXT_SWIPE_THRESHOLD = 80   // Distance for next hand gesture (swipe up)
const SWIPE_VELOCITY = 0.3  // Minimum velocity (px/ms) for a swipe
const HORIZONTAL_THRESHOLD = 50   // If horizontal movement exceeds this, ignore vertical swipe
const GESTURE_HINTS_KEY = 'hudr_hide_gesture_hints'
const HINTS_DISPLAY_DURATION = 1500  // Show hints for 1.5 seconds
const HINTS_FADE_DURATION = 500      // Fade out over 0.5 seconds

// =====================
// Component
// =====================

export function FullscreenReplayer({
  handData,
  onClose,
  initialSpeed = 1,
  autoplay = false,
  animationSpeeds,
  className,
  tournamentId,
  onHandSelect,
  currentHandId,
  isLoadingHand = false,
  loadingHandNumber,
  onNextHand,
  nextHandNumber,
  apiStatus,
  sentryReplayUrl,
  sentryIds,
  reporterEmail,
  reporterName,
}: FullscreenReplayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<TouchState | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetY, setDragOffsetY] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // Gesture hints state
  const [showGestureHints, setShowGestureHints] = useState(false)
  const [hintsVisible, setHintsVisible] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const hintsShownRef = useRef(false)

  // =====================
  // Viewport Size Tracking
  // =====================

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // =====================
  // Gesture Hints (show on first load)
  // =====================

  useEffect(() => {
    // Only show once per session and if user hasn't opted out
    if (hintsShownRef.current) return

    try {
      const hideHints = localStorage.getItem(GESTURE_HINTS_KEY)
      if (hideHints === 'true') return
    } catch {
      // localStorage not available
    }

    hintsShownRef.current = true
    setShowGestureHints(true)
    setHintsVisible(true)

    // Start fade out after display duration
    const fadeTimer = setTimeout(() => {
      setHintsVisible(false)
    }, HINTS_DISPLAY_DURATION)

    // Hide completely after fade
    const hideTimer = setTimeout(() => {
      setShowGestureHints(false)
    }, HINTS_DISPLAY_DURATION + HINTS_FADE_DURATION)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleDontShowAgain = useCallback((checked: boolean) => {
    setDontShowAgain(checked)
    try {
      if (checked) {
        localStorage.setItem(GESTURE_HINTS_KEY, 'true')
      } else {
        localStorage.removeItem(GESTURE_HINTS_KEY)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  // =====================
  // Touch Gesture Handlers
  // =====================

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchRef.current = {
      startY: touch.clientY,
      startX: touch.clientX,
      startTime: Date.now(),
    }
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - touchRef.current.startY
    const deltaX = Math.abs(touch.clientX - touchRef.current.startX)

    // Ignore if horizontal movement is too large (user is swiping sideways)
    if (deltaX > HORIZONTAL_THRESHOLD) {
      return
    }

    // Allow both directions: positive (down) and negative (up)
    setDragOffsetY(deltaY)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current) {
      setIsDragging(false)
      setDragOffsetY(0)
      return
    }

    const deltaY = dragOffsetY
    const elapsed = Date.now() - touchRef.current.startTime
    const velocityY = Math.abs(deltaY) / elapsed

    // Swipe down to close
    if (deltaY > CLOSE_SWIPE_THRESHOLD && velocityY > SWIPE_VELOCITY) {
      setIsClosing(true)
      setTimeout(onClose, 200)
      return
    }

    // Swipe up for next hand (deltaY is negative when swiping up)
    if (deltaY < -NEXT_SWIPE_THRESHOLD && velocityY > SWIPE_VELOCITY && onNextHand && nextHandNumber) {
      onNextHand()
      // Reset state after triggering
      touchRef.current = null
      setIsDragging(false)
      setDragOffsetY(0)
      return
    }

    // Reset
    touchRef.current = null
    setIsDragging(false)
    setDragOffsetY(0)
  }, [dragOffsetY, onClose, onNextHand, nextHandNumber])

  const handleTouchCancel = useCallback(() => {
    touchRef.current = null
    setIsDragging(false)
    setDragOffsetY(0)
  }, [])

  // =====================
  // Keyboard Support (for accessibility)
  // =====================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // =====================
  // Prevent body scroll when fullscreen
  // =====================

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // =====================
  // Render
  // =====================

  const transformStyle = isDragging ? `translateY(${dragOffsetY}px)` : undefined
  const transitionStyle = isDragging ? 'none' : 'transform 0.2s ease-out'

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-[200] bg-black touch-none',
        isClosing && 'animate-slide-out-down',
        className
      )}
      style={{
        transform: transformStyle,
        transition: transitionStyle,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* 3D Close Button - Floating pill style */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-50 w-10 h-10 flex items-center justify-center rounded-xl
          bg-gradient-to-b from-gray-700 to-gray-900
          shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.2)]
          border border-gray-600/50
          active:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)]
          active:translate-y-[1px]
          transition-all duration-100"
        aria-label="Close replay"
      >
        <X className="w-5 h-5 text-white/90 drop-shadow-sm" />
      </button>

      {/* Close indicator (shown during swipe down) */}
      {isDragging && dragOffsetY > 20 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
          {(() => {
            // Calculate progress (0 to 1) based on swipe distance
            const progress = Math.min(dragOffsetY / CLOSE_SWIPE_THRESHOLD, 1)
            const isReady = progress >= 1
            const circumference = 2 * Math.PI * 18 // radius = 18
            const strokeDashoffset = circumference * (1 - progress)

            return (
              <div className="flex flex-col items-center gap-2">
                {/* Circular progress indicator */}
                <div className="relative w-14 h-14">
                  {/* Background circle */}
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={isReady ? '#ef4444' : '#f59e0b'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-75"
                    />
                  </svg>
                  {/* X icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X
                      className={cn(
                        'w-5 h-5 transition-all duration-150',
                        isReady ? 'text-red-400 scale-110' : 'text-white/60'
                      )}
                    />
                  </div>
                </div>
                {/* Text label */}
                <div
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                    isReady
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/10 text-white/70'
                  )}
                >
                  {isReady ? 'Release to close' : 'Closing Replayer...'}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Next hand indicator (shown during swipe up) */}
      {isDragging && dragOffsetY < -NEXT_SWIPE_THRESHOLD / 2 && nextHandNumber && (
        <div
          className={cn(
            'absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm transition-opacity',
            dragOffsetY < -NEXT_SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-50'
          )}
        >
          Release for Hand #{nextHandNumber}
        </div>
      )}

      {/* Replayer - fills entire screen, table extends to edges */}
      <div className="absolute inset-0">
        {viewportSize.width > 0 && viewportSize.height > 0 && (
          <CanvasPokerReplayer
            handData={handData}
            autoplay={autoplay}
            initialSpeed={initialSpeed}
            showControls
            animationSpeeds={animationSpeeds}
            layoutMode="portrait"
            width={viewportSize.width}
            height={viewportSize.height}
            isFullscreenOverlay
            tournamentId={tournamentId}
            onHandSelect={onHandSelect}
            currentHandId={currentHandId}
            isLoadingHand={isLoadingHand}
            loadingHandNumber={loadingHandNumber}
            apiStatus={apiStatus}
            sentryReplayUrl={sentryReplayUrl}
            sentryIds={sentryIds}
            reporterEmail={reporterEmail}
            reporterName={reporterName}
          />
        )}
      </div>

      {/* Persistent gesture hints (subtle) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 text-white/40 text-xs text-center">
        {nextHandNumber ? (
          <span>Swipe ↑ next hand · Swipe ↓ close</span>
        ) : (
          <span>Swipe down to close</span>
        )}
      </div>

      {/* First-time gesture hints overlay */}
      {showGestureHints && (
        <div
          className={cn(
            'absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 transition-opacity',
            hintsVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDuration: `${HINTS_FADE_DURATION}ms` }}
        >
          <div className="flex flex-col items-center gap-6 px-8 py-6 rounded-2xl bg-gray-900/90 border border-white/10 max-w-xs">
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">↑</span>
                <span className="text-white/90 text-sm font-medium">Swipe up for next hand</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">↓</span>
                <span className="text-white/90 text-sm font-medium">Swipe down to close</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-white/10 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-white/60">Don't show this again</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default FullscreenReplayer
