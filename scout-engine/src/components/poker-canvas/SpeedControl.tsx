/**
 * SpeedControl - Playback speed control with preset buttons
 *
 * Provides quick access to common playback speeds (1x, 1.5x, 2x)
 * with an optional slider for fine-grained control.
 */

import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PRESET_SPEEDS, type PresetSpeed } from '@/stores/replayerStore'

// =====================
// Types
// =====================

interface SpeedControlProps {
  speed: number
  onSpeedChange: (speed: number) => void
  showSlider?: boolean
  className?: string
  size?: 'sm' | 'md'
}

// =====================
// Component
// =====================

export const SpeedControl = memo(function SpeedControl({
  speed,
  onSpeedChange,
  showSlider = false,
  className,
  size = 'sm',
}: SpeedControlProps) {
  const handlePresetClick = useCallback(
    (presetSpeed: PresetSpeed) => {
      onSpeedChange(presetSpeed)
    },
    [onSpeedChange]
  )

  const isActive = (presetSpeed: PresetSpeed) => {
    return Math.abs(speed - presetSpeed) < 0.01
  }

  const buttonSizeClasses = size === 'sm' ? 'h-6 min-w-[2.25rem] text-xs' : 'h-8 min-w-[3rem] text-sm'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Preset speed buttons */}
      <div className="flex items-center bg-white/10 rounded-full p-0.5">
        {PRESET_SPEEDS.map((presetSpeed) => (
          <button
            key={presetSpeed}
            onClick={() => handlePresetClick(presetSpeed)}
            className={cn(
              'rounded-full font-medium transition-all duration-150',
              buttonSizeClasses,
              isActive(presetSpeed)
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
            aria-label={`Set playback speed to ${presetSpeed}x`}
            aria-pressed={isActive(presetSpeed)}
          >
            {presetSpeed}x
          </button>
        ))}
      </div>

      {/* Optional fine-grained slider */}
      {showSlider && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer"
            aria-label="Fine-tune playback speed"
          />
          <span className="text-xs text-white/50 tabular-nums w-8">
            {speed.toFixed(1)}x
          </span>
        </div>
      )}
    </div>
  )
})

// =====================
// Compact variant for mobile
// =====================

interface SpeedButtonProps {
  speed: number
  onSpeedChange: (speed: number) => void
  className?: string
}

/**
 * Cycle through preset speeds on each click
 */
export const SpeedCycleButton = memo(function SpeedCycleButton({
  speed,
  onSpeedChange,
  className,
}: SpeedButtonProps) {
  const handleClick = useCallback(() => {
    // Find current preset index and cycle to next
    const currentIndex = PRESET_SPEEDS.findIndex((s) => Math.abs(speed - s) < 0.01)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PRESET_SPEEDS.length
    onSpeedChange(PRESET_SPEEDS[nextIndex])
  }, [speed, onSpeedChange])

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center h-8 min-w-[3rem] rounded-full',
        'bg-white/10 text-white/70 text-xs font-medium',
        'hover:bg-white/20 hover:text-white transition-colors',
        className
      )}
      aria-label="Cycle playback speed"
    >
      {speed.toFixed(1)}x
    </button>
  )
})

export default SpeedControl
