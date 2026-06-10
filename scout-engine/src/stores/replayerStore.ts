/**
 * Centralized Zustand store for Hand Replayer state management
 *
 * This store manages:
 * - Current hand data and navigation
 * - Playback controls (play/pause, speed, sound)
 * - Tournament highlights for browsing
 * - Multiple replayer instances via scoped selectors
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { HandReplay, ReplayStep } from '@/types/replay'

// =====================
// Types & Interfaces
// =====================

export interface TournamentHighlight {
  handId: string
  handNumber: string | number
  title: string
  description: string
  players: string[]
  potSize: number
  street: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
  thumbnailUrl?: string
  timestamp?: Date
  tags?: string[]
}

export interface ReplayerInstance {
  hand: HandReplay | null
  stepIndex: number
  isPlaying: boolean
  speed: number
  soundEnabled: boolean
  error: Error | null
  isLoading: boolean
}

export interface HighlightsState {
  tournamentId: string | null
  highlights: TournamentHighlight[]
  isLoading: boolean
  error: Error | null
  selectedHighlightId: string | null
}

interface ReplayerState {
  // Replayer instances by ID (supports multiple replayers)
  instances: Record<string, ReplayerInstance>

  // Highlights for current tournament
  highlights: HighlightsState

  // Global settings
  globalVolume: number
  defaultSpeed: number

  // Actions for replayer instances
  initInstance: (id: string, options?: Partial<ReplayerInstance>) => void
  destroyInstance: (id: string) => void
  setHand: (id: string, hand: HandReplay | null) => void
  setStep: (id: string, index: number) => void
  nextStep: (id: string) => void
  prevStep: (id: string) => void
  togglePlay: (id: string) => void
  setPlaying: (id: string, playing: boolean) => void
  reset: (id: string) => void
  setSpeed: (id: string, speed: number) => void
  setSoundEnabled: (id: string, enabled: boolean) => void
  setError: (id: string, error: Error | null) => void
  setLoading: (id: string, loading: boolean) => void

  // Actions for highlights
  setTournamentId: (tournamentId: string | null) => void
  setHighlights: (highlights: TournamentHighlight[]) => void
  setHighlightsLoading: (loading: boolean) => void
  setHighlightsError: (error: Error | null) => void
  selectHighlight: (highlightId: string | null) => void

  // Global settings actions
  setGlobalVolume: (volume: number) => void
  setDefaultSpeed: (speed: number) => void
}

// =====================
// Constants
// =====================

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

export const PRESET_SPEEDS = [0.75, 1, 1.5] as const
export type PresetSpeed = (typeof PRESET_SPEEDS)[number]

const DEFAULT_INSTANCE: ReplayerInstance = {
  hand: null,
  stepIndex: 0,
  isPlaying: false,
  speed: 0.75,
  soundEnabled: true,
  error: null,
  isLoading: false,
}

const DEFAULT_HIGHLIGHTS: HighlightsState = {
  tournamentId: null,
  highlights: [],
  isLoading: false,
  error: null,
  selectedHighlightId: null,
}

// =====================
// Store Implementation
// =====================

export const useReplayerStore = create<ReplayerState>()(
  subscribeWithSelector((set) => ({
    instances: {},
    highlights: DEFAULT_HIGHLIGHTS,
    globalVolume: 0.5,
    defaultSpeed: 1,

    // Instance management
    initInstance: (id, options) => {
      set((state) => ({
        instances: {
          ...state.instances,
          [id]: {
            ...DEFAULT_INSTANCE,
            speed: state.defaultSpeed,
            ...options,
          },
        },
      }))
    },

    destroyInstance: (id) => {
      set((state) => {
        const { [id]: _, ...rest } = state.instances
        return { instances: rest }
      })
    },

    setHand: (id, hand) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: {
              ...instance,
              hand,
              stepIndex: 0,
              error: null,
            },
          },
        }
      })
    },

    setStep: (id, index) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        const total = instance.hand?.steps.length ?? 1
        const clampedIndex = Math.max(0, Math.min(index, total - 1))
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, stepIndex: clampedIndex },
          },
        }
      })
    },

    nextStep: (id) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        const total = instance.hand?.steps.length ?? 1
        const nextIndex = Math.min(instance.stepIndex + 1, total - 1)
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, stepIndex: nextIndex },
          },
        }
      })
    },

    prevStep: (id) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        const prevIndex = Math.max(0, instance.stepIndex - 1)
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, stepIndex: prevIndex },
          },
        }
      })
    },

    togglePlay: (id) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, isPlaying: !instance.isPlaying },
          },
        }
      })
    },

    setPlaying: (id, playing) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, isPlaying: playing },
          },
        }
      })
    },

    reset: (id) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, stepIndex: 0, isPlaying: false },
          },
        }
      })
    },

    setSpeed: (id, speed) => {
      const clampedSpeed = Math.max(0.5, Math.min(3, speed))
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, speed: clampedSpeed },
          },
        }
      })
    },

    setSoundEnabled: (id, enabled) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, soundEnabled: enabled },
          },
        }
      })
    },

    setError: (id, error) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, error, isLoading: false },
          },
        }
      })
    },

    setLoading: (id, loading) => {
      set((state) => {
        const instance = state.instances[id]
        if (!instance) return state
        return {
          instances: {
            ...state.instances,
            [id]: { ...instance, isLoading: loading },
          },
        }
      })
    },

    // Highlights actions
    setTournamentId: (tournamentId) => {
      set((state) => ({
        highlights: {
          ...state.highlights,
          tournamentId,
          highlights: tournamentId === state.highlights.tournamentId ? state.highlights.highlights : [],
        },
      }))
    },

    setHighlights: (highlights) => {
      set((state) => ({
        highlights: {
          ...state.highlights,
          highlights,
          isLoading: false,
          error: null,
        },
      }))
    },

    setHighlightsLoading: (loading) => {
      set((state) => ({
        highlights: { ...state.highlights, isLoading: loading },
      }))
    },

    setHighlightsError: (error) => {
      set((state) => ({
        highlights: { ...state.highlights, error, isLoading: false },
      }))
    },

    selectHighlight: (highlightId) => {
      set((state) => ({
        highlights: { ...state.highlights, selectedHighlightId: highlightId },
      }))
    },

    // Global settings
    setGlobalVolume: (volume) => {
      set({ globalVolume: Math.max(0, Math.min(1, volume)) })
    },

    setDefaultSpeed: (speed) => {
      set({ defaultSpeed: Math.max(0.5, Math.min(3, speed)) })
    },
  }))
)

// =====================
// Selectors
// =====================

/**
 * Get a replayer instance by ID, with fallback to default values
 */
export const selectInstance = (state: ReplayerState, id: string): ReplayerInstance => {
  return state.instances[id] ?? DEFAULT_INSTANCE
}

/**
 * Get the current step for a replayer instance
 */
export const selectCurrentStep = (state: ReplayerState, id: string): ReplayStep | null => {
  const instance = state.instances[id]
  if (!instance?.hand) return null
  return instance.hand.steps[instance.stepIndex] ?? null
}

/**
 * Get the previous step for a replayer instance
 */
export const selectPreviousStep = (state: ReplayerState, id: string): ReplayStep | null => {
  const instance = state.instances[id]
  if (!instance?.hand || instance.stepIndex <= 0) return null
  return instance.hand.steps[instance.stepIndex - 1] ?? null
}

/**
 * Get total steps for a replayer instance
 */
export const selectTotalSteps = (state: ReplayerState, id: string): number => {
  const instance = state.instances[id]
  return instance?.hand?.steps.length ?? 0
}

/**
 * Check if the replayer is at the last step
 */
export const selectIsLastStep = (state: ReplayerState, id: string): boolean => {
  const instance = state.instances[id]
  if (!instance?.hand) return true
  return instance.stepIndex >= instance.hand.steps.length - 1
}

/**
 * Check if the replayer is at the first step
 */
export const selectIsFirstStep = (state: ReplayerState, id: string): boolean => {
  const instance = state.instances[id]
  return (instance?.stepIndex ?? 0) === 0
}

// =====================
// Hooks for specific instances
// =====================

/**
 * Hook to use a specific replayer instance with all controls
 */
export function useReplayerInstance(instanceId: string) {
  const instance = useReplayerStore((state) => selectInstance(state, instanceId))
  const currentStep = useReplayerStore((state) => selectCurrentStep(state, instanceId))
  const previousStep = useReplayerStore((state) => selectPreviousStep(state, instanceId))
  const totalSteps = useReplayerStore((state) => selectTotalSteps(state, instanceId))
  const isLastStep = useReplayerStore((state) => selectIsLastStep(state, instanceId))
  const isFirstStep = useReplayerStore((state) => selectIsFirstStep(state, instanceId))

  // Get actions bound to this instance
  const store = useReplayerStore.getState()

  return {
    ...instance,
    currentStep,
    previousStep,
    totalSteps,
    isLastStep,
    isFirstStep,

    // Bound actions
    setHand: (hand: HandReplay | null) => store.setHand(instanceId, hand),
    setStep: (index: number) => store.setStep(instanceId, index),
    next: () => store.nextStep(instanceId),
    prev: () => store.prevStep(instanceId),
    togglePlay: () => store.togglePlay(instanceId),
    setPlaying: (playing: boolean) => store.setPlaying(instanceId, playing),
    reset: () => store.reset(instanceId),
    setSpeed: (speed: number) => store.setSpeed(instanceId, speed),
    setSoundEnabled: (enabled: boolean) => store.setSoundEnabled(instanceId, enabled),
    setError: (error: Error | null) => store.setError(instanceId, error),
    setLoading: (loading: boolean) => store.setLoading(instanceId, loading),
  }
}

/**
 * Hook to use tournament highlights
 */
export function useTournamentHighlights() {
  const highlights = useReplayerStore((state) => state.highlights)
  const store = useReplayerStore.getState()

  return {
    ...highlights,
    setTournamentId: store.setTournamentId,
    setHighlights: store.setHighlights,
    setLoading: store.setHighlightsLoading,
    setError: store.setHighlightsError,
    selectHighlight: store.selectHighlight,
  }
}
