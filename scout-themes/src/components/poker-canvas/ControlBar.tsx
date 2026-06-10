import { memo } from 'react'
import { Maximize2, Minimize2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, ListVideo, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PlaybackState, PotAnimationVariant, ChipAnimationVariant } from './types/canvas-types'
import { POT_ANIMATION_VARIANTS, POT_ANIMATION_LABELS, CHIP_ANIMATION_VARIANTS, CHIP_ANIMATION_LABELS } from './types/canvas-types'
import { cn } from '@/lib/utils'
import { SpeedControl } from './SpeedControl'

interface ControlBarProps extends PlaybackState {
  stepIndex: number
  totalSteps: number
  onPlayToggle: () => void
  onPrev: () => void
  onNext: () => void
  onReset: () => void
  onSpeedChange: (value: number) => void
  onSoundToggle: () => void
  canFullscreen?: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  onHighlightsToggle?: () => void
  hasHighlights?: boolean
  className?: string
  // Animation variant selection (for testing)
  potAnimation?: PotAnimationVariant
  chipAnimation?: ChipAnimationVariant
  onPotAnimationChange?: (variant: PotAnimationVariant) => void
  onChipAnimationChange?: (variant: ChipAnimationVariant) => void
  showAnimationControls?: boolean
}

export const ControlBar = memo(function ControlBar({
  isPlaying,
  speed,
  soundEnabled,
  stepIndex,
  totalSteps,
  onPlayToggle,
  onPrev,
  onNext,
  onReset,
  onSpeedChange,
  onSoundToggle,
  canFullscreen,
  isFullscreen,
  onFullscreenToggle,
  onHighlightsToggle,
  hasHighlights,
  className,
  potAnimation,
  chipAnimation,
  onPotAnimationChange,
  onChipAnimationChange,
  showAnimationControls = false,
}: ControlBarProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Animation Controls (for testing) - at top for mobile visibility */}
      {showAnimationControls && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 text-white/50" />
            <span className="text-[10px] text-white/50">Anim:</span>
          </div>

          {/* Pot Counter Animation Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="pot-animation" className="text-[10px] text-white/70">
              Pot:
            </label>
            <select
              id="pot-animation"
              value={potAnimation ?? 'counter-blur'}
              onChange={(e) => onPotAnimationChange?.(e.target.value as PotAnimationVariant)}
              className="h-6 px-1.5 text-[10px] bg-white/10 border border-white/20 rounded text-white/90 outline-none focus:border-primary/50"
            >
              {POT_ANIMATION_VARIANTS.map((variant) => (
                <option key={variant} value={variant} className="bg-gray-900 text-white">
                  {POT_ANIMATION_LABELS[variant]}
                </option>
              ))}
            </select>
          </div>

          {/* Chip-to-Pot Animation Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="chip-animation" className="text-[10px] text-white/70">
              Chips:
            </label>
            <select
              id="chip-animation"
              value={chipAnimation ?? 'chip-stack'}
              onChange={(e) => onChipAnimationChange?.(e.target.value as ChipAnimationVariant)}
              className="h-6 px-1.5 text-[10px] bg-white/10 border border-white/20 rounded text-white/90 outline-none focus:border-primary/50"
            >
              {CHIP_ANIMATION_VARIANTS.map((variant) => (
                <option key={variant} value={variant} className="bg-gray-900 text-white">
                  {CHIP_ANIMATION_LABELS[variant]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Top row: Playback controls left, Speed control right */}
      <div className="flex items-center justify-between">
        {/* Left: Playback controls - bigger buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="h-10 w-10 text-white/70 hover:bg-white/10 hover:text-white disabled:text-white/30"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={() => {
              // When not playing, reset and start playing
              // When playing, just pause
              if (!isPlaying) {
                onReset()
              }
              onPlayToggle()
            }}
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary/90"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNext}
            disabled={stepIndex >= totalSteps - 1}
            className="h-10 w-10 text-white/70 hover:bg-white/10 hover:text-white disabled:text-white/30"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Speed control */}
        <SpeedControl speed={speed} onSpeedChange={onSpeedChange} size="md" />
      </div>

      {/* Bottom row: Step counter and icons on right */}
      <div className="flex items-center justify-end gap-2">
        {/* Step counter */}
        <span className="text-sm text-white/60 tabular-nums font-medium">
          {Math.min(stepIndex + 1, totalSteps)} / {totalSteps || 1}
        </span>

        {/* Icons: highlights, sound, fullscreen */}
        <div className="flex items-center gap-1">
          {hasHighlights && onHighlightsToggle && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onHighlightsToggle}
              className="h-10 w-10 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Show tournament highlights"
            >
              <ListVideo className="h-5 w-5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onSoundToggle}
            className="h-10 w-10 text-white/70 hover:bg-white/10 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          {canFullscreen && onFullscreenToggle && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onFullscreenToggle}
              className="h-10 w-10 text-white/70 hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})
