import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import type { ChipDenomination, HandReplay, ReplayStep } from '@/types/replay'
import { calculateChipBreakdown, defaultChipDenominations } from '@/types/replay'
import { buildSeatPositions, getPlayerActionOrder, buildPortraitSeatPositionsByActionOrder } from '../utils/coordinates'
import type { LayoutMode } from '../utils/coordinates'
import type { AnimationSpeeds, HandReplaySource, SeatPosition } from '../types/canvas-types'
import { DEFAULT_ANIMATION_SPEEDS, getSpeedMultiplier } from '../types/canvas-types'
import { AnimationEngine } from '../core/AnimationEngine'
import { easing } from '../utils/easing'
import type { CardMovement, ChipMovement } from '../layers/AnimationLayer'
import { parseHandHistory } from '../parsers/ParserFactory'
import type { SoundEvent } from '../core/SoundManager'
import { getPlayerLayout } from '../entities/Player'
import { logger } from '@/lib/logger'

interface CanvasReplayerStore {
  hand: HandReplay | null
  stepIndex: number
  isPlaying: boolean
  speed: number
  soundEnabled: boolean
  setHand: (hand: HandReplay | null) => void
  setStep: (index: number) => void
  next: () => void
  prev: () => void
  togglePlay: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  setSoundEnabled: (enabled: boolean) => void
}

const createStore = () =>
  create<CanvasReplayerStore>((set, get) => ({
    hand: null,
    stepIndex: 0,
    isPlaying: false,
    speed: 1.5,
    soundEnabled: true,
    setHand: (hand) => set({ hand, stepIndex: 0 }),
    setStep: (index) => {
      const total = get().hand?.steps.length ?? 1
      set({ stepIndex: Math.max(0, Math.min(index, total - 1)) })
    },
    next: () => {
      const total = get().hand?.steps.length ?? 1
      set((state) => ({ stepIndex: Math.min(state.stepIndex + 1, total - 1) }))
    },
    prev: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    reset: () => set({ stepIndex: 0, isPlaying: false }),
    setSpeed: (speed) => set({ speed: Math.max(0.5, Math.min(3, speed)) }),
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  }))

interface UseCanvasReplayerOptions {
  handData: HandReplaySource
  autoplay?: boolean
  initialSpeed?: number
  soundEnabled?: boolean
  dimensions: { width: number; height: number }
  reducedMotion?: boolean
  onStepChange?: (step: ReplayStep, total: number) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  /** Custom seat layout positions (optional override) */
  seatLayout?: Array<{ x: number; y: number; scale?: number }>
  /** Enable dynamic seat distribution based on player count (default: true) */
  dynamicSeats?: boolean
  /** Individual animation speed settings for demo/testing */
  animationSpeeds?: AnimationSpeeds
  /** Layout mode for table orientation (default: 'landscape') */
  layoutMode?: LayoutMode
}

export function useCanvasReplayer(options: UseCanvasReplayerOptions) {
  const {
    handData,
    autoplay = false,
    initialSpeed = 1.5,
    soundEnabled = true,
    dimensions,
    reducedMotion = false,
    onStepChange,
    onComplete,
    onError,
    seatLayout,
    dynamicSeats = true,
    animationSpeeds = DEFAULT_ANIMATION_SPEEDS,
    layoutMode = 'landscape',
  } = options
  const store = useMemo(createStore, [])
  const [animationEngine] = useState(() => new AnimationEngine())
  const [chipMovements, setChipMovements] = useState<ChipMovement[]>([])
  const [cardMovements, setCardMovements] = useState<CardMovement[]>([])
  const [soundEvents, setSoundEvents] = useState<SoundEvent[]>([])
  const [parseError, setParseError] = useState<Error | null>(null)
  const lastAnimatedStep = useRef<number | null>(null)
  const completionRef = useRef<{ handId?: string; completed: boolean }>({ handId: undefined, completed: false })
  const stepDurationRef = useRef(900)
  const initialSpeedRef = useRef(initialSpeed)
  const soundEnabledRef = useRef(soundEnabled)
  const autoplayRef = useRef(autoplay)
  const animationSpeedsRef = useRef(animationSpeeds)

  const hand = store((state) => state.hand)
  const stepIndex = store((state) => state.stepIndex)
  const isPlaying = store((state) => state.isPlaying)
  const speed = store((state) => state.speed)
  const soundOn = store((state) => state.soundEnabled)
  const speedRef = useRef(speed)
  const stepIndexRef = useRef(stepIndex)

  // Keep stepIndexRef in sync with stepIndex for use in playback loop
  useEffect(() => {
    stepIndexRef.current = stepIndex
  }, [stepIndex])

  const baseDelayForSpeed = useCallback(
    (speedValue?: number) => {
      const baseSpeed = speedValue ?? speedRef.current ?? 1
      const clampedSpeed = Math.max(0.5, baseSpeed)
      return reducedMotion ? getReducedMotionDelay(clampedSpeed) : Math.max(380, 900 / clampedSpeed)
    },
    [reducedMotion]
  )

  const clearForManualNavigation = useCallback(() => {
    animationEngine.clear()
    setChipMovements([])
    setCardMovements([])
    setSoundEvents([])
    lastAnimatedStep.current = null
    stepDurationRef.current = baseDelayForSpeed()
  }, [animationEngine, baseDelayForSpeed])

  // Parse hand data
  useEffect(() => {
    try {
      const parsed = parseHandHistory(handData)
      store.getState().setHand(parsed)
      store.getState().setSpeed(initialSpeedRef.current)
      store.getState().setSoundEnabled(soundEnabledRef.current)
      store.setState({ isPlaying: Boolean(autoplayRef.current) })
      setParseError(null)
    } catch (error) {
      const err = error as Error
      setParseError(err)
      onError?.(err)
      store.getState().setHand(null)
      store.setState({ isPlaying: false })
    }
  }, [handData, onError, store])

  useEffect(() => {
    initialSpeedRef.current = initialSpeed
    const current = store.getState().speed
    if (Math.abs(current - initialSpeed) > 0.0001) {
      store.getState().setSpeed(initialSpeed)
    }
  }, [initialSpeed, store])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
    if (store.getState().soundEnabled !== soundEnabled) {
      store.getState().setSoundEnabled(soundEnabled)
    }
  }, [soundEnabled, store])

  useEffect(() => {
    autoplayRef.current = autoplay
  }, [autoplay])

  const scene = useMemo(() => {
    if (!hand || hand.steps.length === 0) return null
    const step = hand.steps[stepIndex] ?? hand.steps[0]
    const previousStep = stepIndex > 0 ? hand.steps[stepIndex - 1] : undefined
    return { hand, stepIndex, step, previousStep }
  }, [hand, stepIndex])

  useEffect(() => {
    if (!scene) return
    onStepChange?.(scene.step, scene.hand.steps.length)
  }, [onStepChange, scene?.hand.handId, scene?.step.stepNumber])

  useEffect(() => {
    setSoundEvents([])
    lastAnimatedStep.current = null
    animationEngine.clear()
    stepDurationRef.current = baseDelayForSpeed()
  }, [hand?.handId, animationEngine, baseDelayForSpeed])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    animationSpeedsRef.current = animationSpeeds
  }, [animationSpeeds])

  useEffect(() => {
    const targetDelay = baseDelayForSpeed(speed)
    if (stepDurationRef.current > targetDelay) {
      stepDurationRef.current = targetDelay
    }
  }, [baseDelayForSpeed, speed])

  // Build seat positions - dynamic distribution based on player count, or fixed 10-seat layout
  // In portrait mode, rotate seats so dealer (BTN) is always at the bottom
  const seatPositions = useMemo<SeatPosition[]>(() => {
    const playerCount = dynamicSeats && hand ? hand.initialPlayers.length : undefined

    // In portrait mode, use portrait-specific positioning with dealer at bottom
    if (layoutMode === 'portrait' && hand && playerCount) {
      // Get player action order (clockwise from BTN)
      // Position order: BTN -> SB -> BB -> UTG -> UTG+1 -> UTG+2 -> MP -> MP+1 -> HJ -> CO -> BTN
      const actionOrder = getPlayerActionOrder(hand.initialPlayers)

      // Debug: Log player order and action order
      logger.debug('[useCanvasReplayer] Portrait seat assignment:', {
        playerCount,
        players: hand.initialPlayers.map((p, i) => ({
          index: i,
          name: p.name,
          position: p.position,
          seatNumber: p.seatNumber,
        })),
        actionOrder: actionOrder.map((p, i) => ({
          actionIndex: i,
          name: p.name,
          position: p.position,
          originalIndex: hand.initialPlayers.findIndex(orig => orig.id === p.id),
        })),
      })

      return buildPortraitSeatPositionsByActionOrder(dimensions.width, dimensions.height, hand.initialPlayers, actionOrder)
    }

    // Landscape mode: use standard positioning
    return buildSeatPositions(dimensions.width, dimensions.height, {
      playerCount,
      overrides: seatLayout,
    })
  }, [dimensions.width, dimensions.height, seatLayout, dynamicSeats, hand?.initialPlayers.length, hand?.initialPlayers, layoutMode])

  useEffect(() => {
    if (!hand) return
    const totalSteps = hand.steps.length
    const isLastStep = totalSteps > 0 && stepIndex >= totalSteps - 1
    if (completionRef.current.handId !== hand.handId) {
      completionRef.current = { handId: hand.handId, completed: false }
    }
    if (isLastStep && !completionRef.current.completed) {
      completionRef.current.completed = true
      onComplete?.()
    } else if (!isLastStep && completionRef.current.completed) {
      completionRef.current.completed = false
    }
  }, [hand, stepIndex, onComplete])

  // Playback loop via timer (step-to-step)
  // Note: stepIndex is NOT in dependencies to prevent effect re-runs on each step change.
  // We use stepIndexRef.current inside the tick function to check current position.
  useEffect(() => {
    if (!hand || !isPlaying) return
    const totalSteps = hand.steps.length

    let timer: number | undefined
    let cancelled = false

    const tick = () => {
      if (cancelled) return

      // Check if we've reached the end using the ref (current value)
      if (stepIndexRef.current >= totalSteps - 1) {
        store.setState({ isPlaying: false })
        return
      }

      // Wait for animations to complete before advancing
      if (animationEngine.hasActiveAnimations()) {
        timer = window.setTimeout(tick, 90)
        return
      }

      // Advance to next step
      store.getState().next()

      // Schedule next tick with appropriate delay
      const baseDelay = reducedMotion ? getReducedMotionDelay(speed) : Math.max(380, 900 / speed)
      const targetDelay = Math.max(baseDelay, stepDurationRef.current)
      timer = window.setTimeout(tick, targetDelay)
    }

    // Initial delay before first tick (hand starts — use fast setup delay)
    const baseDelay = reducedMotion ? getReducedMotionDelay(speed) : Math.max(150, 350 / speed)
    const targetDelay = Math.max(baseDelay, stepDurationRef.current)
    timer = window.setTimeout(tick, targetDelay)

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [hand, isPlaying, speed, store, animationEngine, reducedMotion])

  // Step change callbacks + animations
  useEffect(() => {
    if (!scene) return
    const isNewStep = lastAnimatedStep.current !== scene.step.stepNumber
    const { chipMoves, cardMoves, soundEvents: soundQueue } = computeStepAnimations(
      scene.step,
      scene.previousStep,
      seatPositions,
      dimensions,
      { reducedMotion }
    )
    setChipMovements(reducedMotion ? [] : chipMoves)
    setCardMovements(reducedMotion ? [] : cardMoves)
    if (isNewStep) {
      setSoundEvents(soundQueue)
    }
    if (isNewStep) {
      lastAnimatedStep.current = scene.step.stepNumber
      if (reducedMotion) {
        animationEngine.clear()
        stepDurationRef.current = getReducedMotionDelay(speedRef.current)
        return
      }
      const baseScale = getDurationScale(speedRef.current)
      const speeds = animationSpeedsRef.current

      // Create per-animation-type scaled duration functions
      const scaledChipDuration = (base: number) =>
        scaleDuration(base, baseScale / getSpeedMultiplier(speeds.chipMovement))
      const scaledCardDuration = (base: number) =>
        scaleDuration(base, baseScale / getSpeedMultiplier(speeds.holeCards))
      const scaledCommunityDuration = (base: number) =>
        scaleDuration(base, baseScale / getSpeedMultiplier(speeds.communityCards))
      const scaledPotDuration = (base: number) =>
        scaleDuration(base, baseScale / getSpeedMultiplier(speeds.potChange))
      const scaledFlipDuration = (base: number) =>
        scaleDuration(base, baseScale / getSpeedMultiplier(speeds.cardFlip))

      let longestDuration = 0
      const trackDuration = (duration: number) => {
        longestDuration = Math.max(longestDuration, duration)
      }
      const previousPot = scene.previousStep?.state.pot ?? scene.step.state.pot
      const nextPot = scene.step.state.pot
      const potChanged = Math.abs(nextPot - previousPot) > 0.01
      if (potChanged) {
        // Slot machine animation for pot value
        const slotDuration = scaledPotDuration(600) // Longer for slot machine effect
        trackDuration(slotDuration)

        // Store the starting value for the slot machine
        animationEngine.animate('pot-from', {
          from: previousPot,
          to: previousPot, // Keep constant during animation
          duration: slotDuration,
          easing: easing.linear,
        })

        // Animate progress from 0 to 1
        animationEngine.animate('pot-slot', {
          from: 0,
          to: 1,
          duration: slotDuration,
          easing: easing.linear, // Custom easing applied in Pot.ts
        })
      }
      chipMoves.forEach((move) => {
        const duration = scaledChipDuration(520)
        trackDuration(duration)
        animationEngine.animate(move.progressKey, {
          from: 0,
          to: 1,
          duration,
          easing: easing.easeOutCubic,
        })
      })
      cardMoves.forEach((move) => {
        const duration = scaledCardDuration(420)
        trackDuration(duration)
        animationEngine.animate(move.progressKey, {
          from: 0,
          to: 1,
          duration,
          easing: easing.easeInOutQuad,
        })
        if (move.flipKey) {
          const flipDuration = scaledFlipDuration(360)
          trackDuration(flipDuration)
          animationEngine.animate(move.flipKey, {
            from: 0,
            to: 1,
            duration: flipDuration,
            easing: easing.easeInOutQuad,
          })
        }
      })

      // Community card reveal scale animation for new cards
      scene.step.state.communityCards.forEach((_, idx) => {
        const alreadyPresent = scene.previousStep?.state.communityCards[idx]
        if (!alreadyPresent) {
          const duration = scaledCommunityDuration(260)
          trackDuration(duration)
          animationEngine.animate(`community-${idx}-scale`, {
            from: 0.6,
            to: 1,
            duration,
            easing: easing.easeOutBack,
          })
        }
      })

      // Buffer to let animations and sounds complete before autoplay advances
      stepDurationRef.current = Math.max(420, longestDuration + 180)
    }
  }, [scene, seatPositions, dimensions, animationEngine, reducedMotion])

  useEffect(() => {
    if (!reducedMotion) return
    animationEngine.clear()
    setChipMovements([])
    setCardMovements([])
    stepDurationRef.current = getReducedMotionDelay(speedRef.current)
  }, [animationEngine, reducedMotion])

  useEffect(() => {
    if (!autoplay || !hand) return
    store.setState((state) => (state.isPlaying ? state : { ...state, isPlaying: true }))
  }, [autoplay, hand, store])

  const controls = useMemo(() => {
    const setSpeed = (value: number) => store.getState().setSpeed(value)
    const seek = (index: number) => {
      clearForManualNavigation()
      store.getState().setStep(index)
    }
    return {
      next: () => {
        clearForManualNavigation()
        store.getState().next()
      },
      prev: () => {
        clearForManualNavigation()
        store.getState().prev()
      },
      reset: () => {
        clearForManualNavigation()
        store.getState().reset()
      },
      togglePlay: () => store.getState().togglePlay(),
      setSpeed,
      setSoundEnabled: (enabled: boolean) => store.getState().setSoundEnabled(enabled),
      seek,
    }
  }, [clearForManualNavigation, store])

  return {
    scene,
    totalSteps: hand?.steps.length ?? 0,
    isPlaying,
    speed,
    soundEnabled: soundOn,
    seatPositions,
    animationEngine,
    chipMovements,
    cardMovements,
    soundEvents,
    reducedMotion,
    parseError,
    ...controls,
  }
}

function computeStepAnimations(
  step: ReplayStep,
  previous: ReplayStep | undefined,
  seatPositions: SeatPosition[],
  dimensions: { width: number; height: number },
  options?: { reducedMotion?: boolean }
): { chipMoves: ChipMovement[]; cardMoves: CardMovement[]; soundEvents: SoundEvent[] } {
  const chipMoves: ChipMovement[] = []
  const cardMoves: CardMovement[] = []
  const soundEvents: SoundEvent[] = []
  const reducedMotion = options?.reducedMotion ?? false
  const enqueueSound = (event: SoundEvent) => {
    if (!soundEvents.includes(event)) {
      soundEvents.push(event)
    }
  }
  const seats = seatPositions.length
    ? seatPositions
    : [{ x: dimensions.width / 2, y: dimensions.height / 2, angle: 0, scale: 1 }]

  // Build player index map for dynamic seating
  const playerIndexMap = new Map<string, number>()
  step.state.players.forEach((p, idx) => playerIndexMap.set(p.id, idx))

  // Check if using dynamic seating (positions match player count)
  const isDynamicSeating = seats.length === step.state.players.length

  // Debug: Log seat configuration at start of step
  if (step.stepNumber === 1) {
    logger.debug('[SeatPositions] Step 1 seat config:', {
      seatsCount: seats.length,
      playersCount: step.state.players.length,
      isDynamicSeating,
      seats: seats.map((s, i) => ({ index: i, x: Math.round(s.x), y: Math.round(s.y) })),
      players: step.state.players.map((p, i) => ({ index: i, id: p.id, name: p.name, seatNumber: p.seatNumber })),
    })
  }

  const playerLayouts = new Map<string, ReturnType<typeof getPlayerLayout>>()
  const getLayout = (player: ReplayStep['state']['players'][number]) => {
    const cached = playerLayouts.get(player.id)
    if (cached) return cached
    // Dynamic seating: use player index; Fixed layout: use seatNumber
    const positionIndex = isDynamicSeating
      ? (playerIndexMap.get(player.id) ?? 0)
      : player.seatNumber % seats.length
    const seat = seats[positionIndex] ?? seats[0]
    const layout = getPlayerLayout(seat)
    playerLayouts.set(player.id, layout)
    return layout
  }
  type Point = { x: number; y: number }
  const jitterPoint = (point: Point, index: number): Point => {
    const spread = 1.1
    const dx = ((index % 3) - 1) * spread
    const dy = Math.floor(index / 3) * -0.7
    return { x: point.x + dx, y: point.y + dy }
  }
  const buildChipSprites = (amount: number): ChipDenomination[] => {
    const normalized = Math.max(0, Math.round(amount * 100) / 100)
    if (normalized <= 0) return []
    const chips: ChipDenomination[] = []
    let remaining = normalized
    const breakdown = calculateChipBreakdown(normalized, defaultChipDenominations)
    breakdown.forEach(({ denomination, count }) => {
      let available = count
      while (available > 0 && chips.length < 7) {
        chips.push(denomination)
        remaining = Math.max(0, Math.round((remaining - denomination.value) * 100) / 100)
        available -= 1
      }
    })
    if (remaining > 0 && chips.length) {
      const last = chips[chips.length - 1]
      chips[chips.length - 1] = { ...last, value: Math.round((last.value + remaining) * 100) / 100 }
      remaining = 0
    }
    if (!chips.length) {
      const fallback = defaultChipDenominations[defaultChipDenominations.length - 1]
      chips.push({
        ...(fallback ?? { color: '#f97316', textColor: '#0f172a', value: 1 }),
        value: normalized,
      })
    }
    return chips
  }
  const pushChipMovements = (amount: number, from: Point, to: Point, keyPrefix: string) => {
    if (reducedMotion) return
    buildChipSprites(amount).forEach((denomination, idx) => {
      chipMoves.push({
        id: `${keyPrefix}-${idx}`,
        denomination,
        from: jitterPoint(from, idx),
        to: jitterPoint(to, idx),
        progressKey: `${keyPrefix}-${idx}`,
      })
    })
  }
  const deckPosition = {
    x: dimensions.width / 2,
    y: Math.max(32, dimensions.height * 0.18),
  }
  const isStreetChange = previous ? step.state.street !== previous.state.street : false
  const shouldShowCards = (player: ReplayStep['state']['players'][number], replayStep: ReplayStep) =>
    replayStep.state.street === 'showdown' ||
    replayStep.state.winnerIds.includes(player.id) ||
    replayStep.highlightedPlayerId === player.id

  const newActions = previous ? step.state.actions.slice(previous.state.actions.length) : step.state.actions
  newActions.forEach((action) => {
    switch (action.action) {
      case 'fold':
        enqueueSound('fold')
        break
      case 'check':
        enqueueSound('check')
        break
      case 'call':
        enqueueSound('call')
        break
      case 'bet':
        enqueueSound('bet')
        break
      case 'raise':
        enqueueSound('raise')
        break
      case 'all-in':
        enqueueSound('allin')
        break
      case 'win':
        enqueueSound('chips-collect')
        enqueueSound('win')
        break
      case 'uncalled-bet':
        enqueueSound('chips-collect')
        break
      case 'show':
      case 'muck':
        enqueueSound('card-flip')
        break
      default:
        break
    }
  })
  const potPosition = { x: dimensions.width / 2, y: dimensions.height / 2 + 46 }

  // Player-specific card animations (deal, fold, reveal)
  step.state.players.forEach((player) => {
    const layout = getLayout(player)
    const prevPlayer = previous?.state.players.find((p) => p.id === player.id)
    const hadCards = Boolean(prevPlayer?.holeCards?.length)
    const hasCards = Boolean(player.holeCards?.length)

    if (hasCards && !hadCards) {
      player.holeCards?.forEach((card, idx) => {
        const target = layout.cards[idx]
        if (!target) return
        if (!reducedMotion) {
          cardMoves.push({
            id: `deal-${player.id}-${idx}-${step.stepNumber}`,
            card,
            from: deckPosition,
            to: { x: target.x, y: target.y },
            faceDown: true,
            width: target.width,
            height: target.height,
            rotation: target.rotation,
            progressKey: `deal-${player.id}-${idx}-${step.stepNumber}`,
          })
        }
      })
      enqueueSound('deal')
    }

    const foldedNow = player.isFolded && !prevPlayer?.isFolded
    if (foldedNow && player.holeCards) {
      const exitY = dimensions.height + 80
      player.holeCards.forEach((card, idx) => {
        const target = layout.cards[idx]
        if (!target) return
        if (!reducedMotion) {
          cardMoves.push({
            id: `fold-${player.id}-${idx}-${step.stepNumber}`,
            card,
            from: { x: target.x, y: target.y },
            to: { x: target.x, y: exitY },
            faceDown: true,
            width: target.width,
            height: target.height,
            rotation: target.rotation,
            progressKey: `fold-${player.id}-${idx}-${step.stepNumber}`,
          })
        }
      })
    }

    const showingNow = hasCards && shouldShowCards(player, step)
    const showingBefore = prevPlayer ? shouldShowCards(prevPlayer, previous ?? step) : false
    if (showingNow && !showingBefore && player.holeCards) {
      player.holeCards.forEach((card, idx) => {
        const target = layout.cards[idx]
        if (!target) return
        if (!reducedMotion) {
          cardMoves.push({
            id: `reveal-${player.id}-${idx}-${step.stepNumber}`,
            card,
            from: { x: target.x, y: target.y },
            to: { x: target.x, y: target.y },
            faceDown: false,
            width: target.width,
            height: target.height,
            rotation: target.rotation,
            progressKey: `reveal-${player.id}-${idx}-${step.stepNumber}`,
            flipKey: `reveal-${player.id}-${idx}-${step.stepNumber}-flip`,
            revealFromBack: true,
          })
        }
      })
      enqueueSound('card-flip')
    }
  })

  if (previous) {
    step.state.players.forEach((player) => {
      const layout = getLayout(player)
      const prevPlayer = previous.state.players.find((p) => p.id === player.id)
      const prevBet = prevPlayer?.currentBet ?? 0
      const betDelta = player.currentBet - prevBet
      const uncalledBet = newActions.some((action) => action.action === 'uncalled-bet' && action.playerId === player.id)
      const stackAnchor = {
        x: layout.nameBox.x + layout.nameBox.width / 2,
        y: layout.nameBox.y + layout.nameBox.height / 2,
      }
      if (betDelta > 0) {
        const wager = Math.max(0, betDelta)
        // Debug: Log chip movement positions
        const posIdx = isDynamicSeating ? playerIndexMap.get(player.id) : player.seatNumber
        logger.debug('[ChipAnimation] Bet from', player.name, {
          playerId: player.id,
          positionIndex: posIdx,
          isDynamicSeating,
          seatNumber: player.seatNumber,
          playerArrayIndex: playerIndexMap.get(player.id),
          from: stackAnchor,
          to: layout.betSpot,
          seatPosition: seats[typeof posIdx === 'number' ? posIdx % seats.length : 0],
          seatsCount: seats.length,
          playersCount: step.state.players.length,
        })
        pushChipMovements(wager, stackAnchor, layout.betSpot, `bet-${player.id}-${step.stepNumber}`)
      }
      if (betDelta < 0 && prevBet > 0) {
        const amountMoved = Math.max(0, prevBet - Math.max(player.currentBet, 0))
        if (uncalledBet) {
          pushChipMovements(amountMoved, potPosition, stackAnchor, `uncalled-${player.id}-${step.stepNumber}`)
        } else if (isStreetChange || prevBet !== player.currentBet) {
          logger.debug('[ChipAnimation] COLLECT TO POT:', player.name, {
            amount: amountMoved,
            from: layout.betSpot,
            to: potPosition,
            isStreetChange,
          })
          pushChipMovements(amountMoved, layout.betSpot, potPosition, `collect-${player.id}-${step.stepNumber}`)
          enqueueSound('chips-collect')
        }
      }
    })

    const winnersChanged =
      step.state.winnerIds.length > 0 &&
      (previous.state.winnerIds.length === 0 ||
        previous.state.winnerIds.join(',') !== step.state.winnerIds.join(','))

    if (winnersChanged) {
      step.state.winnerIds.forEach((winnerId, index) => {
        const winner = step.state.players.find((p) => p.id === winnerId)
        const seat = winner?.seatNumber ?? index
        const seatTarget = seatPositions[seat % seatPositions.length] ?? potPosition
        const targetLayout = winner ? getLayout(winner) : null
        const target = targetLayout
          ? {
              x: targetLayout.nameBox.x + targetLayout.nameBox.width / 2,
              y: targetLayout.nameBox.y + targetLayout.nameBox.height / 2,
            }
          : seatTarget
        const payout = step.state.winnings[winnerId] ?? step.state.pot
        if (payout > 0) {
          pushChipMovements(payout, potPosition, target, `win-${winnerId}-${step.stepNumber}`)
        }
      })
    }

    // Community card movements
    if (step.state.communityCards.length > (previous.state.communityCards.length ?? 0)) {
      const cardWidth = 42
      const cardHeight = 58
      const gap = 6
      const totalWidth = step.state.communityCards.length * cardWidth + (step.state.communityCards.length - 1) * gap
      const startX = dimensions.width / 2 - totalWidth / 2
      const y = dimensions.height / 2 - cardHeight / 2 - 12
      step.state.communityCards.forEach((card, idx) => {
        if (!previous.state.communityCards[idx]) {
          const to = { x: startX + idx * (cardWidth + gap), y }
          const from = { x: deckPosition.x + 18, y: deckPosition.y - 12 }
          if (!reducedMotion) {
            cardMoves.push({
              id: `board-${idx}-${step.stepNumber}`,
              card,
              from,
              to,
              faceDown: false,
              width: cardWidth,
              height: cardHeight,
              progressKey: `board-${idx}-${step.stepNumber}`,
              flipKey: `board-${idx}-${step.stepNumber}-flip`,
              revealFromBack: true,
            })
          }
        }
      })
      enqueueSound('deal')
    }
  }

  const communityGrowth = step.state.communityCards.length > (previous?.state.communityCards.length ?? 0)
  if (communityGrowth) {
    enqueueSound('card-flip')
  }
  if (!newActions.length && chipMoves.length) {
    enqueueSound('bet')
  }
  const winnersChanged =
    step.state.winnerIds.length > 0 &&
    (previous?.state.winnerIds.length === 0 || previous?.state.winnerIds.join(',') !== step.state.winnerIds.join(','))
  if (winnersChanged) {
    enqueueSound('chips-collect')
    enqueueSound('win')
  }
  if (!newActions.length && cardMoves.length) {
    enqueueSound('card-flip')
  }

  return { chipMoves, cardMoves, soundEvents }
}

function getDurationScale(speed: number | undefined) {
  const clampedSpeed = Math.min(Math.max(speed ?? 1, 0.5), 3)
  return Math.min(1.8, Math.max(0.4, 1 / clampedSpeed))
}

function scaleDuration(baseDuration: number, scale: number) {
  return Math.max(90, baseDuration * scale)
}

function getReducedMotionDelay(speed: number | undefined) {
  const clamped = Math.min(Math.max(speed ?? 1, 0.5), 3)
  return Math.max(240, 520 / clamped)
}
