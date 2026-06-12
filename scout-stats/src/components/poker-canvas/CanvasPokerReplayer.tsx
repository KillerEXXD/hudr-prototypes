import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Bug, Sparkles, Grid3X3, History, Loader2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HUDR_VERSION, HUDR_BUILD_DATE } from '@/version'
import { ControlBar } from './ControlBar'
import { useCanvasReplayer } from './hooks/useCanvasReplayer'
import { useExperimentalFeatures } from '@/hooks/useExperimentalFeatures'
import type { AnimationSpeeds, HandReplaySource, ReplayerTheme, PotAnimationVariant, ChipAnimationVariant, PotVisualVariant, ActionBadgeVariant, BadgeStyle, BadgeAnimation, ExperimentalFeatures } from './types/canvas-types'
import { getRandomPotAnimationVariant, getRandomPotVisualVariant, getRandomChipAnimationVariant, getRandomStaticActionBadgeVariant, getRandomBadgeStyle, getRandomBadgeAnimation } from './types/canvas-types'
import type { LayoutMode } from './utils/coordinates'
import { defaultReplayerTheme } from './constants/theme'
import { useAnimationLoop } from './hooks/useAnimationLoop'
import { useSound } from './hooks/useSound'
import { CanvasRenderer } from './core/CanvasRenderer'
import { TableLayer } from './layers/TableLayer'
import { CommunityCardsLayer } from './layers/CommunityCardsLayer'
import { PotLayer } from './layers/PotLayer'
import { PlayersLayer } from './layers/PlayersLayer'
import { hasActiveActionBadgeAnimations, clearActionBadgeAnimations, isAnimatedActionBadgeVariant } from './entities/Player'
import { AnimationLayer } from './layers/AnimationLayer'
import { HandInfoLayer } from './layers/HandInfoLayer'
import { ReplayerBugReportModal } from './ReplayerBugReportModal'
import { EffectsSettingsPopover } from './EffectsSettingsPopover'
import { LayoutDebugPanel } from './LayoutDebugPanel'
import { HandHistoryPanel } from './HandHistoryPanel'
import { generateLayoutDebugHandData, defaultDebugConfig, CARD_SIZE_MULTIPLIERS } from './utils/layoutDebugMockData'
import type { LayoutDebugConfig } from './utils/layoutDebugMockData'
import { logger } from '@/lib/logger'
import { buildDebugData, formatDebugText } from './utils/debugDataBuilder'

interface CanvasPokerReplayerProps {
  handData: HandReplaySource
  width?: number
  height?: number
  theme?: Partial<ReplayerTheme>
  autoplay?: boolean
  initialSpeed?: number
  soundEnabled?: boolean
  soundVolume?: number
  showControls?: boolean
  allowFullscreen?: boolean
  reduceMotion?: boolean
  className?: string
  onStepChange?: (stepIndex: number, total: number) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  // Highlights support
  onHighlightsToggle?: () => void
  hasHighlights?: boolean
  /** Individual animation speed settings for demo/testing */
  animationSpeeds?: AnimationSpeeds
  /** Layout mode - portrait for mobile-first vertical layout */
  layoutMode?: LayoutMode
  /** When true, control bar is at bottom without offset (for fullscreen overlays) */
  isFullscreenOverlay?: boolean
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

export function CanvasPokerReplayer({
  handData,
  width,
  height,
  theme,
  autoplay = false,
  initialSpeed = 1.5,
  soundEnabled = true,
  soundVolume = 0.5,
  showControls = true,
  allowFullscreen = true,
  reduceMotion,
  className,
  onStepChange,
  onComplete,
  onError,
  onHighlightsToggle,
  hasHighlights = false,
  animationSpeeds,
  layoutMode = 'landscape',
  isFullscreenOverlay = false,
  tournamentId,
  onHandSelect,
  currentHandId,
  isLoadingHand = false,
  loadingHandNumber,
  apiStatus,
  sentryReplayUrl,
  sentryIds,
  reporterEmail,
  reporterName,
}: CanvasPokerReplayerProps) {
  // Debug: Log tournamentId when received
  logger.debug('[CanvasPokerReplayer] Props received:', {
    showControls,
    tournamentId,
    currentHandId,
    hasOnHandSelect: !!onHandSelect,
    willShowHistoryButton: showControls && !!tournamentId && !!onHandSelect,
  })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const animationLayerRef = useRef(new AnimationLayer())
  // Default to portrait aspect ratio (9:16 for mobile poker apps)
  const [dimensions, setDimensions] = useState({ width: width ?? 400, height: height ?? 700 })
  const [devicePixelRatio, setDevicePixelRatio] = useState(() =>
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  )
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showBugModal, setShowBugModal] = useState(false)
  const [showEffectsPopover, setShowEffectsPopover] = useState(false)
  const [showLayoutDebugPanel, setShowLayoutDebugPanel] = useState(false)
  const [showHandHistoryPanel, setShowHandHistoryPanel] = useState(false)
  const [layoutDebugConfig, setLayoutDebugConfig] = useState<LayoutDebugConfig | null>(null)
  const [debugHandData, setDebugHandData] = useState<HandReplaySource | null>(null)
  const [debugDataForModal, setDebugDataForModal] = useState('')
  // Animation variant overrides for testing/preview (initialized to undefined, set from handId)
  const [potVisualOverride, setPotVisualOverride] = useState<PotVisualVariant | undefined>(undefined)
  const [potAnimationOverride, setPotAnimationOverride] = useState<PotAnimationVariant | undefined>(undefined)
  const [chipAnimationOverride, setChipAnimationOverride] = useState<ChipAnimationVariant | undefined>(undefined)
  const [actionBadgeOverride, setActionBadgeOverride] = useState<ActionBadgeVariant | undefined>(undefined)
  // New: Separate badge style and animation controls
  const [badgeStyleOverride, setBadgeStyleOverride] = useState<BadgeStyle | undefined>(undefined)
  const [badgeAnimationOverride, setBadgeAnimationOverride] = useState<BadgeAnimation | undefined>(undefined)
  // Screenshot capture state
  const [capturedScreenshot, setCapturedScreenshot] = useState<{ blob: Blob; preview: string } | null>(null)
  const [showCaptureFlash, setShowCaptureFlash] = useState(false)
  const [showCaptureConfirm, setShowCaptureConfirm] = useState(false)
  const loopEnabledRef = useRef(false)
  const pendingFrameRef = useRef(true)
  const isPlayingRef = useRef(false)
  const pausedForVisibilityRef = useRef(false)
  const fullscreenSupported = useMemo(
    () => typeof document !== 'undefined' && typeof document.documentElement?.requestFullscreen === 'function',
    []
  )
  const canFullscreen = allowFullscreen && fullscreenSupported
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion

  // Experimental features from URL params (e.g., ?experiments=imageCards,centeredBadges)
  const experimentalFeatures = useExperimentalFeatures()

  const enableLoop = useCallback(() => {
    if (!loopEnabledRef.current) {
      loopEnabledRef.current = true
      setLoopEnabled(true)
    }
  }, [])

  const requestRender = useCallback(() => {
    pendingFrameRef.current = true
    enableLoop()
  }, [enableLoop])

  useEffect(() => {
    const aspect = 9 / 17
    const updateDimensions = (measuredWidth?: number) => {
      const containerWidth = width ?? Math.round(measuredWidth ?? containerRef.current?.getBoundingClientRect().width ?? 0)
      if (!containerWidth) return

      const rawHeight = Math.round(containerWidth / aspect)
      const viewportHeight = typeof window !== 'undefined' ? Math.max(420, window.innerHeight - 120) : 0
      const maxHeight = viewportHeight > 0 ? Math.min(1200, viewportHeight) : 1200
      const minHeight = 420
      const nextHeight = height ?? Math.max(minHeight, Math.min(maxHeight, rawHeight))

      setDimensions((prev) => {
        if (prev.width === containerWidth && prev.height === nextHeight) return prev
        return { width: containerWidth, height: nextHeight }
      })
    }

    updateDimensions()

    if (!containerRef.current) return
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        updateDimensions(entry?.contentRect?.width)
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }

    const onResize = () => updateDimensions()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width, height])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let frame: number | null = null
    const handleDprChange = () => {
      const nextDpr = window.devicePixelRatio || 1
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
      frame = requestAnimationFrame(() => {
        setDevicePixelRatio((prev) => (Math.abs(prev - nextDpr) < 0.01 ? prev : nextDpr))
      })
    }
    window.addEventListener('resize', handleDprChange)
    return () => {
      window.removeEventListener('resize', handleDprChange)
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const mergedTheme = useMemo(() => ({ ...defaultReplayerTheme, ...theme }), [theme])
  const { play: playSound } = useSound(soundEnabled, soundVolume)

  const {
    scene,
    isPlaying,
    speed,
    soundEnabled: soundOn,
    seatPositions,
    totalSteps,
    next,
    prev,
    reset,
    togglePlay,
    setSpeed,
    setSoundEnabled,
    animationEngine,
    chipMovements,
    cardMovements,
    soundEvents,
    seek,
    reducedMotion: reducedMotionEnabled,
    parseError,
  } = useCanvasReplayer({
    handData: debugHandData ?? handData,
    autoplay,
    initialSpeed,
    soundEnabled,
    dimensions,
    reducedMotion: shouldReduceMotion,
    onStepChange: (step, total) => onStepChange?.(step.stepNumber, total),
    onComplete,
    onError,
    seatLayout: mergedTheme.seatLayout,
    animationSpeeds,
    layoutMode,
  })

  useEffect(() => () => animationEngine.clear(), [animationEngine])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Create renderer and layers once
  useEffect(() => {
    if (!canvasRef.current) return
    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: mergedTheme.backgroundColor,
        tableBorderColor: mergedTheme.borderColor,
        tableFeltColor: mergedTheme.feltColor,
      })
      rendererRef.current.setLayers([
        new TableLayer(requestRender, layoutMode),
        new CommunityCardsLayer(),
        new PotLayer(),
        new HandInfoLayer(),
        new PlayersLayer(),
        animationLayerRef.current,
      ])
    }
  }, [dimensions.width, dimensions.height, mergedTheme, requestRender, layoutMode])

  // Resize renderer when dimensions change
  useEffect(() => {
    rendererRef.current?.setSize(dimensions.width, dimensions.height)
  }, [dimensions, devicePixelRatio])

  // Update animation layer data
  useEffect(() => {
    animationLayerRef.current.setChipMovements(chipMovements)
    animationLayerRef.current.setCardMovements(cardMovements)
  }, [chipMovements, cardMovements])

  // Set hand ID for deterministic chip animation selection
  useEffect(() => {
    animationLayerRef.current.setHandId(scene?.hand?.handId)
  }, [scene?.hand?.handId])

  // Initialize animation overrides from handId-based random selection (syncs dropdowns)
  useEffect(() => {
    const handId = scene?.hand?.handId
    if (handId) {
      // Clear action badge animation cache when hand changes
      clearActionBadgeAnimations()
      setPotAnimationOverride(getRandomPotAnimationVariant(handId))
      setPotVisualOverride(getRandomPotVisualVariant(handId))
      setChipAnimationOverride(getRandomChipAnimationVariant(handId))
      setActionBadgeOverride(getRandomStaticActionBadgeVariant(handId))
      // New: Initialize separate badge style and animation
      setBadgeStyleOverride(getRandomBadgeStyle(handId))
      setBadgeAnimationOverride(getRandomBadgeAnimation(handId))
    }
  }, [scene?.hand?.handId])

  // Sync dropdown values when "no more actions in future streets" is detected (isAllInCall)
  // When true: ALL players show Stack (chip-style) labels until street ends
  useEffect(() => {
    const stepState = scene?.step?.state
    if (stepState?.isAllInCall) {
      // Auto-set Visual to 'chip-style' (Stack) and Animation to 'none'
      // This syncs the dropdowns with the auto-applied badge rendering
      setBadgeStyleOverride('chip-style')
      setBadgeAnimationOverride('none')
    }
  }, [scene?.step?.state?.isAllInCall])

  // Clear action badge animations when step changes so they replay on each navigation
  useEffect(() => {
    if (scene?.stepIndex !== undefined) {
      clearActionBadgeAnimations()
      requestRender()
    }
  }, [scene?.stepIndex, requestRender])

  // Set chip animation override when user selects from dropdown
  useEffect(() => {
    animationLayerRef.current.setAnimationVariant(chipAnimationOverride)
  }, [chipAnimationOverride])

  // Sound triggers sequenced per step
  useEffect(() => {
    if (!soundEvents.length) return
    const timers = soundEvents.map((event, index) => window.setTimeout(() => playSound(event), index * 70))
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [soundEvents, playSound])

  // Store rapidly-changing values in refs to avoid callback re-creation
  const sceneRef = useRef(scene)
  const seatPositionsRef = useRef(seatPositions)
  const mergedThemeRef = useRef(mergedTheme)
  const animationEngineRef = useRef(animationEngine)

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])
  useEffect(() => {
    seatPositionsRef.current = seatPositions
  }, [seatPositions])
  useEffect(() => {
    mergedThemeRef.current = mergedTheme
  }, [mergedTheme])
  useEffect(() => {
    animationEngineRef.current = animationEngine
  }, [animationEngine])

  // Store pot animation overrides in refs for render callback
  const potAnimationOverrideRef = useRef(potAnimationOverride)
  const potVisualOverrideRef = useRef(potVisualOverride)
  const actionBadgeOverrideRef = useRef(actionBadgeOverride)
  const badgeStyleOverrideRef = useRef(badgeStyleOverride)
  const badgeAnimationOverrideRef = useRef(badgeAnimationOverride)
  // Store experimental features in ref for render callback
  const experimentalFeaturesRef = useRef<ExperimentalFeatures>(experimentalFeatures)
  useEffect(() => {
    potAnimationOverrideRef.current = potAnimationOverride
  }, [potAnimationOverride])
  useEffect(() => {
    potVisualOverrideRef.current = potVisualOverride
  }, [potVisualOverride])
  useEffect(() => {
    actionBadgeOverrideRef.current = actionBadgeOverride
  }, [actionBadgeOverride])
  useEffect(() => {
    badgeStyleOverrideRef.current = badgeStyleOverride
  }, [badgeStyleOverride])
  useEffect(() => {
    badgeAnimationOverrideRef.current = badgeAnimationOverride
  }, [badgeAnimationOverride])
  useEffect(() => {
    // Merge URL-based experimental features with debug config overrides
    if (layoutDebugConfig) {
      experimentalFeaturesRef.current = {
        ...experimentalFeatures,
        imageCards: layoutDebugConfig.useImageCards,
        cardScale: CARD_SIZE_MULTIPLIERS[layoutDebugConfig.cardSize],
      }
    } else {
      experimentalFeaturesRef.current = experimentalFeatures
    }
  }, [experimentalFeatures, layoutDebugConfig])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleChange = () => {
      const active = document.fullscreenElement === containerRef.current
      setIsFullscreen(active)
      requestRender()
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [requestRender])

  useEffect(() => {
    if (!scene) return
    requestRender()
  }, [devicePixelRatio, requestRender, scene])

  useEffect(() => {
    if (scene) {
      requestRender()
    } else if (loopEnabledRef.current) {
      loopEnabledRef.current = false
      setLoopEnabled(false)
    }
  }, [scene, requestRender])

  useEffect(() => {
    if (!scene) return
    requestRender()
  }, [seatPositions, mergedTheme, chipMovements, cardMovements, dimensions, requestRender, scene])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pendingFrameRef.current = false
        loopEnabledRef.current = false
        setLoopEnabled(false)
        if (isPlayingRef.current) {
          pausedForVisibilityRef.current = true
          togglePlay()
        }
      } else {
        requestRender()
        if (pausedForVisibilityRef.current) {
          pausedForVisibilityRef.current = false
          togglePlay()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [requestRender, togglePlay])

  const handleSeek = useCallback(
    (index: number) => {
      if (!Number.isFinite(index)) return
      const target = Math.max(0, Math.min(index, Math.max(0, totalSteps - 1)))
      seek(target)
      requestRender()
    },
    [requestRender, seek, totalSteps]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null
      if (target && target !== containerRef.current) {
        const interactive = target.closest('button, input, select, textarea, [role="slider"]')
        if (interactive) return
      }

      switch (event.key) {
        case ' ':
          event.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (event.metaKey || event.ctrlKey) {
            handleSeek(0)
          } else {
            prev()
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (event.metaKey || event.ctrlKey) {
            handleSeek(totalSteps > 0 ? totalSteps - 1 : 0)
          } else {
            next()
          }
          break
        case 'Home':
          event.preventDefault()
          handleSeek(0)
          break
        case 'End':
          event.preventDefault()
          if (totalSteps > 0) handleSeek(totalSteps - 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          setSpeed(Math.min(3, Number((speed + 0.1).toFixed(2))))
          break
        case 'ArrowDown':
          event.preventDefault()
          setSpeed(Math.max(0.5, Number((speed - 0.1).toFixed(2))))
          break
        default:
          break
      }
    },
    [containerRef, handleSeek, next, prev, setSpeed, speed, togglePlay, totalSteps]
  )

  const toggleFullscreen = useCallback(async () => {
    if (!canFullscreen || typeof document === 'undefined') return
    const element = containerRef.current
    if (!element || typeof element.requestFullscreen !== 'function') return
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen()
      } else {
        await element.requestFullscreen()
      }
    } catch {
      // Ignore fullscreen errors to keep playback uninterrupted
    }
  }, [canFullscreen])

  const buildDebugText = useCallback(() => {
    const currentScene = sceneRef.current
    const data = buildDebugData({
      hudrVersion: HUDR_VERSION,
      hudrBuildDate: HUDR_BUILD_DATE,
      hand: currentScene?.hand,
      step: currentScene?.step,
      stepIndex: currentScene?.stepIndex ?? 0,
      totalSteps,
      dimensions,
      isPlaying,
      speed,
      isFullscreen,
      soundOn,
      tournamentId,
      apiStatus,
      sentryReplayUrl,
      sentryIds,
    })
    return formatDebugText(data)
  }, [totalSteps, dimensions, isPlaying, speed, isFullscreen, soundOn, tournamentId, apiStatus, sentryReplayUrl, sentryIds])

  const openBugModal = useCallback(() => {
    logger.debug('[BugModal] openBugModal called, isPlaying:', isPlaying)
    // Pause the replayer when opening bug modal
    if (isPlaying) {
      togglePlay()
    }
    const debugText = buildDebugText()
    logger.debug('[BugModal] Setting showBugModal to true')
    setDebugDataForModal(debugText)
    setShowBugModal(true)
  }, [buildDebugText, isPlaying, togglePlay])

  /** Capture the current canvas content as a PNG blob for bug report attachment */
  const captureScreenshot = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      logger.error('[Screenshot] No canvas ref available')
      return
    }

    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          logger.error('[Screenshot] toBlob returned null')
          return
        }

        // Revoke previous preview URL if exists
        setCapturedScreenshot((prev) => {
          if (prev?.preview) URL.revokeObjectURL(prev.preview)
          return { blob, preview: URL.createObjectURL(blob) }
        })

        // Visual feedback: flash + confirmation badge
        setShowCaptureFlash(true)
        setTimeout(() => setShowCaptureFlash(false), 300)
        setShowCaptureConfirm(true)
        setTimeout(() => setShowCaptureConfirm(false), 1500)

        logger.debug('[Screenshot] Canvas captured:', { size: blob.size, type: blob.type })
      }, 'image/png')
    } catch (err) {
      logger.error('[Screenshot] Capture failed:', err)
    }
  }, [])

  /** Called by modal after it consumes the captured screenshot */
  const handleScreenshotConsumed = useCallback(() => {
    setCapturedScreenshot((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview)
      return null
    })
  }, [])

  // Randomize all effect settings
  const randomizeEffects = useCallback(() => {
    // Use random selection (no handId = pure random)
    setPotAnimationOverride(getRandomPotAnimationVariant())
    setPotVisualOverride(getRandomPotVisualVariant())
    setChipAnimationOverride(getRandomChipAnimationVariant())
    setBadgeStyleOverride(getRandomBadgeStyle())
    setBadgeAnimationOverride(getRandomBadgeAnimation())
    // Trigger re-render
    requestRender()
  }, [requestRender])

  useEffect(() => {
    const target = containerRef.current
    return () => {
      if (typeof document === 'undefined') return
      if (target && document.fullscreenElement === target) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // Cleanup captured screenshot preview URL on unmount
  useEffect(() => {
    return () => {
      setCapturedScreenshot((prev) => {
        if (prev?.preview) URL.revokeObjectURL(prev.preview)
        return null
      })
    }
  }, [])

  // Auto-focus the replayer container for keyboard navigation
  useEffect(() => {
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      containerRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Focus container when clicked to enable keyboard controls
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Don't steal focus from interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, textarea, [role="slider"]')) return
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!reducedMotionEnabled) return
    requestRender()
  }, [reducedMotionEnabled, requestRender])

  const renderFrame = useCallback((time: number, delta: number) => {
    const currentScene = sceneRef.current
    const renderer = rendererRef.current
    const animations = animationEngineRef.current
    if (!currentScene || !renderer || !currentScene.step) return

    const hasAnimationsBeforeUpdate = animations.hasActiveAnimations()
    // Keep loop running when there are winners (for pulsing WIN badge and amount)
    const hasWinners = (currentScene.step.state.winnerIds?.length ?? 0) > 0
    // Keep loop running while action badge animations are playing OR if using animated variant
    const hasBadgeAnims = hasActiveActionBadgeAnimations(time)
    const usingAnimatedBadge = isAnimatedActionBadgeVariant(actionBadgeOverrideRef.current, badgeAnimationOverrideRef.current)

    if (!pendingFrameRef.current && !hasAnimationsBeforeUpdate && !hasWinners && !hasBadgeAnims && !usingAnimatedBadge) {
      if (loopEnabledRef.current) {
        loopEnabledRef.current = false
        setLoopEnabled(false)
      }
      return
    }

    if (hasAnimationsBeforeUpdate) {
      animations.update(time)
    }

    renderer.render({
      scene: currentScene,
      seatPositions: seatPositionsRef.current,
      animations,
      theme: mergedThemeRef.current,
      now: time,
      delta,
      potAnimationVariant: potAnimationOverrideRef.current,
      potVisualVariant: potVisualOverrideRef.current,
      actionBadgeVariant: actionBadgeOverrideRef.current,
      badgeStyle: badgeStyleOverrideRef.current,
      badgeAnimation: badgeAnimationOverrideRef.current,
      experimentalFeatures: experimentalFeaturesRef.current,
    })

    pendingFrameRef.current = false

    const hasAnimationsAfterUpdate = animations.hasActiveAnimations()
    const hasBadgeAnimsAfter = hasActiveActionBadgeAnimations(time)
    // Keep loop running for pulsing winner animations and badge animations
    // Also keep running if using animated badge variant (they need continuous updates)
    if (!hasAnimationsAfterUpdate && !hasWinners && !hasBadgeAnimsAfter && !usingAnimatedBadge) {
      loopEnabledRef.current = false
      setLoopEnabled(false)
    }
  }, [])

  useAnimationLoop(renderFrame, { enabled: loopEnabled })

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Poker hand replayer"
      onKeyDown={handleKeyDown}
      onClick={handleContainerClick}
      className={cn(
        'relative flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        isFullscreen && 'h-screen focus-visible:ring-offset-0',
        className
      )}
      style={isFullscreen ? {  } : undefined}
    >
      <div
        className={cn(
          'relative w-full h-full overflow-hidden shadow-2xl',
          isFullscreen && 'h-full rounded-none shadow-none'
        )}
      >
        <canvas ref={canvasRef} />
        {/* Screenshot capture flash overlay */}
        {showCaptureFlash && (
          <div
            className="absolute inset-0 z-30 bg-white/80 pointer-events-none animate-capture-flash"
            aria-hidden="true"
          />
        )}
        {/* Inline loading overlay - shown when switching hands.
            z-[60] sits ABOVE the in-canvas controls (z-50) so the whole replayer
            is inert during the switch — rapid taps land on this clear "Loading
            hand #X" surface instead of half-responsive controls/canvas (which
            previously registered as rage clicks). The parent close button lives
            in a separate stacking context, so the user can still bail out. */}
        {isLoadingHand && (
          <div
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm select-none cursor-wait touch-none"
            onClick={(e) => e.stopPropagation()}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Animated card suits spinner */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="text-2xl animate-bounce text-red-500" style={{ animationDelay: '0ms' }}>♥</span>
                    <span className="text-2xl animate-bounce text-white/90" style={{ animationDelay: '150ms' }}>♠</span>
                    <span className="text-2xl animate-bounce text-red-500" style={{ animationDelay: '300ms' }}>♦</span>
                  </div>
                </div>
              </div>
              {/* Loading text */}
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-white/90 text-sm font-medium">
                    {loadingHandNumber ? `Loading hand #${loadingHandNumber}...` : 'Loading hand...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Parse error overlay */}
        {parseError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="text-center p-6 max-w-sm">
              <div className="text-4xl mb-3">&#x26A0;&#xFE0F;</div>
              <h3 className="text-white font-semibold mb-2">Unable to Load Hand</h3>
              <p className="text-white/60 text-sm">{parseError.message}</p>
            </div>
          </div>
        )}
        {/* Bug report button - top LEFT corner to avoid overlap with close button */}
        {/* Top-left buttons: Bug report + Effects settings */}
        <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              logger.debug('[BugButton] Click event received')
              e.stopPropagation()
              openBugModal()
            }}
            onTouchEnd={(e) => {
              // On mobile, touch-none on parent blocks clicks, so handle touch directly
              logger.debug('[BugButton] Touch event received')
              e.stopPropagation()
              e.preventDefault()
              openBugModal()
            }}
            className="p-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white transition-all duration-200 backdrop-blur-sm shadow-md touch-auto"
            title="Report a bug"
            aria-label="Report a bug with the replayer"
          >
            <Bug className="w-4 h-4" />
          </button>
          {/* Screenshot capture button - always visible */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                captureScreenshot()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                captureScreenshot()
              }}
              className={cn(
                "p-1.5 rounded-md text-white transition-all duration-200 backdrop-blur-sm shadow-md touch-auto",
                capturedScreenshot
                  ? "bg-green-600/80 hover:bg-green-600"
                  : "bg-gray-600/80 hover:bg-gray-600"
              )}
              title="Capture screenshot for bug report"
              aria-label="Capture canvas screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>
            {showCaptureConfirm && (
              <div className="absolute -bottom-7 left-1/2 whitespace-nowrap px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold animate-fade-in-out pointer-events-none shadow-lg">
                Captured!
              </div>
            )}
          </div>
          {showControls && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowEffectsPopover(!showEffectsPopover)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setShowEffectsPopover(!showEffectsPopover)
              }}
              className={cn(
                "p-1.5 rounded-md text-white transition-all duration-200 backdrop-blur-sm shadow-md touch-auto",
                showEffectsPopover
                  ? "bg-purple-600 hover:bg-purple-500"
                  : "bg-purple-600/80 hover:bg-purple-600"
              )}
              title="Visual effects settings"
              aria-label="Open visual effects settings"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          {showControls && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowLayoutDebugPanel(!showLayoutDebugPanel)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setShowLayoutDebugPanel(!showLayoutDebugPanel)
              }}
              className={cn(
                "p-1.5 rounded-md text-white transition-all duration-200 backdrop-blur-sm shadow-md touch-auto",
                showLayoutDebugPanel || debugHandData
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-blue-600/80 hover:bg-blue-600"
              )}
              title="Layout debug mode"
              aria-label="Open layout debug panel"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          )}
          {/* Hand History button - show when tournamentId is available */}
          {showControls && tournamentId && onHandSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowHandHistoryPanel(!showHandHistoryPanel)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setShowHandHistoryPanel(!showHandHistoryPanel)
              }}
              className={cn(
                "p-1.5 rounded-md text-white transition-all duration-200 backdrop-blur-sm shadow-md touch-auto",
                showHandHistoryPanel
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-amber-600/80 hover:bg-amber-600"
              )}
              title="Hand history"
              aria-label="Open hand history panel"
            >
              <History className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Effects Settings Popover */}
        {showControls && (
          <EffectsSettingsPopover
            isOpen={showEffectsPopover}
            onClose={() => setShowEffectsPopover(false)}
            potVisual={potVisualOverride ?? 'none'}
            potAnimation={potAnimationOverride ?? 'counter-blur'}
            chipAnimation={chipAnimationOverride ?? 'chip-stack'}
            badgeStyle={badgeStyleOverride ?? 'pill-gradient'}
            badgeAnimation={badgeAnimationOverride ?? 'none'}
            onPotVisualChange={setPotVisualOverride}
            onPotAnimationChange={setPotAnimationOverride}
            onChipAnimationChange={setChipAnimationOverride}
            onBadgeStyleChange={setBadgeStyleOverride}
            onBadgeAnimationChange={setBadgeAnimationOverride}
            onRandomize={randomizeEffects}
            onReplay={() => {
              // Reset to step 0 and start playing
              seek(0)
              if (!isPlaying) {
                togglePlay()
              }
              requestRender()
            }}
          />
        )}
        {/* Layout Debug Panel */}
        {showControls && (
          <LayoutDebugPanel
            isOpen={showLayoutDebugPanel}
            onClose={() => setShowLayoutDebugPanel(false)}
            initialConfig={layoutDebugConfig ?? defaultDebugConfig}
            onApply={(config) => {
              setLayoutDebugConfig(config)
              const mockData = generateLayoutDebugHandData(config)
              setDebugHandData(mockData)
              setShowLayoutDebugPanel(false)
              // Reset playback
              seek(0)
              requestRender()
            }}
          />
        )}
        {/* Hand History Panel */}
        {showControls && tournamentId && onHandSelect && (
          <HandHistoryPanel
            isOpen={showHandHistoryPanel}
            onClose={() => setShowHandHistoryPanel(false)}
            tournamentId={tournamentId}
            currentHandId={currentHandId ?? scene?.hand?.handId}
            onHandSelect={onHandSelect}
          />
        )}
        {/* Debug Mode Indicator */}
        {debugHandData && (
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-blue-600/90 text-white text-xs font-medium backdrop-blur-sm">
              Debug Mode: {layoutDebugConfig?.playerCount ?? 6} Players
            </span>
            <button
              type="button"
              onClick={() => {
                setDebugHandData(null)
                setLayoutDebugConfig(null)
                requestRender()
              }}
              className="px-2 py-1 rounded-md bg-red-600/90 text-white text-xs font-medium hover:bg-red-500 backdrop-blur-sm"
            >
              Exit Debug
            </button>
          </div>
        )}
        {/* Bug Report Modal */}
        <ReplayerBugReportModal
          isOpen={showBugModal}
          onClose={() => setShowBugModal(false)}
          debugData={debugDataForModal}
          handId={scene?.hand?.handId}
          handUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          reporterEmail={reporterEmail}
          reporterName={reporterName}
          capturedScreenshot={capturedScreenshot}
          onScreenshotConsumed={handleScreenshotConsumed}
        />
        {/* Version badge - subtle, bottom right */}
        <span className="absolute bottom-1 right-2 text-[10px] text-white/30 select-none pointer-events-none">
          v{HUDR_VERSION}
        </span>
      </div>
      {/* Control Bar - OUTSIDE inner container, positioned above bottom navigation (unless fullscreen overlay) */}
      {showControls && (
        <div className={cn(
          "absolute left-0 right-0 z-50 px-3 py-1 bg-gradient-to-t from-black/50 to-transparent",
          isFullscreenOverlay ? "bottom-2" : "bottom-[72px]"
        )}>
          <ControlBar
            isPlaying={isPlaying}
            speed={speed}
            soundEnabled={soundOn}
            stepIndex={scene?.stepIndex ?? 0}
            totalSteps={totalSteps}
            onPlayToggle={togglePlay}
            onPrev={prev}
            onNext={next}
            onReset={reset}
            onSpeedChange={setSpeed}
            onSoundToggle={() => setSoundEnabled(!soundOn)}
            canFullscreen={canFullscreen}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
            hasHighlights={hasHighlights}
            onHighlightsToggle={onHighlightsToggle}
            // Animation controls now at top of replayer, disabled in ControlBar
            showAnimationControls={false}
            potAnimation={potAnimationOverride}
            chipAnimation={chipAnimationOverride}
            onPotAnimationChange={setPotAnimationOverride}
            onChipAnimationChange={setChipAnimationOverride}
          />
        </div>
      )}
    </div>
  )
}
