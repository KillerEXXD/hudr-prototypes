/**
 * EffectsSettingsPopover - Visual effects configuration popup
 *
 * Provides elegant UI for customizing replayer animations:
 * - Pot visual effects
 * - Pot counter animations
 * - Chip movement animations
 * - Badge styles
 * - Badge animations
 *
 * Features:
 * - Glass-morphism design matching replayer theme
 * - Live preview (changes apply immediately)
 * - Randomize all button
 * - Replay button to restart hand with new settings
 */

import { useRef, useEffect, useMemo } from 'react'
import { Sparkles, Shuffle, RotateCcw, X, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseExperimentalFeatures } from '@/hooks/useExperimentalFeatures'
import type {
  PotVisualVariant,
  PotAnimationVariant,
  ChipAnimationVariant,
  BadgeStyle,
  BadgeAnimation,
} from './types/canvas-types'
import {
  POT_VISUAL_VARIANTS,
  POT_VISUAL_LABELS,
  POT_ANIMATION_VARIANTS,
  POT_ANIMATION_LABELS,
  CHIP_ANIMATION_VARIANTS,
  CHIP_ANIMATION_LABELS,
  BADGE_STYLES,
  BADGE_STYLE_LABELS,
  BADGE_ANIMATIONS,
  BADGE_ANIMATION_LABELS,
} from './types/canvas-types'

// =====================
// Types
// =====================

interface EffectSetting {
  label: string
  value: string
  options: readonly string[]
  labels: Record<string, string>
  onChange: (value: string) => void
}

interface EffectsSettingsPopoverProps {
  isOpen: boolean
  onClose: () => void
  // Current values
  potVisual: PotVisualVariant | undefined
  potAnimation: PotAnimationVariant | undefined
  chipAnimation: ChipAnimationVariant | undefined
  badgeStyle: BadgeStyle | undefined
  badgeAnimation: BadgeAnimation | undefined
  // Setters
  onPotVisualChange: (value: PotVisualVariant) => void
  onPotAnimationChange: (value: PotAnimationVariant) => void
  onChipAnimationChange: (value: ChipAnimationVariant) => void
  onBadgeStyleChange: (value: BadgeStyle) => void
  onBadgeAnimationChange: (value: BadgeAnimation) => void
  // Actions
  onRandomize: () => void
  onReplay: () => void
}

// =====================
// Helper Components
// =====================

function EffectRow({ label, value, options, labels, onChange }: EffectSetting) {
  const currentIndex = options.indexOf(value)
  const totalOptions = options.length

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/80">{label}</span>
        <span className="text-[10px] text-white/40">
          {currentIndex + 1}/{totalOptions}
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/90 outline-none focus:border-white/40 focus:bg-white/15 transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-gray-900 text-white">
            {labels[opt] || opt}
          </option>
        ))}
      </select>
      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1">
        {options.map((opt, idx) => (
          <div
            key={opt}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-200',
              idx === currentIndex
                ? 'bg-emerald-400 scale-125'
                : 'bg-white/20 hover:bg-white/30'
            )}
            title={labels[opt] || opt}
          />
        ))}
      </div>
    </div>
  )
}

// =====================
// Main Component
// =====================

// Experiment toggle option type
type ExperimentOption = 'none' | 'cards' | 'badges' | 'both'

export function EffectsSettingsPopover({
  isOpen,
  onClose,
  potVisual,
  potAnimation,
  chipAnimation,
  badgeStyle,
  badgeAnimation,
  onPotVisualChange,
  onPotAnimationChange,
  onChipAnimationChange,
  onBadgeStyleChange,
  onBadgeAnimationChange,
  onRandomize,
  onReplay,
}: EffectsSettingsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Parse current experiments from URL
  const currentExperiments = useMemo(() => {
    if (typeof window === 'undefined') return { imageCards: false, centeredBadges: false }
    return parseExperimentalFeatures(window.location.search)
  }, [])

  // Determine current experiment option
  const currentExperimentOption: ExperimentOption = useMemo(() => {
    const { imageCards, centeredBadges } = currentExperiments
    if (imageCards && centeredBadges) return 'both'
    if (imageCards) return 'cards'
    if (centeredBadges) return 'badges'
    return 'none'
  }, [currentExperiments])

  // Handle experiment toggle - updates URL and reloads page
  const handleExperimentChange = (option: ExperimentOption) => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)

    // Remove existing experiments param
    url.searchParams.delete('experiments')

    // Add new experiments param based on selection
    switch (option) {
      case 'cards':
        url.searchParams.set('experiments', 'imageCards')
        break
      case 'badges':
        url.searchParams.set('experiments', 'centeredBadges')
        break
      case 'both':
        url.searchParams.set('experiments', 'imageCards,centeredBadges')
        break
      // 'none' - no param needed
    }

    // Reload with new URL
    window.location.href = url.toString()
  }

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay to prevent immediate close on button click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const settings: EffectSetting[] = [
    {
      label: 'Pot Visual Effect',
      value: potVisual ?? 'none',
      options: POT_VISUAL_VARIANTS,
      labels: POT_VISUAL_LABELS,
      onChange: (v) => onPotVisualChange(v as PotVisualVariant),
    },
    {
      label: 'Counter Animation',
      value: potAnimation ?? 'counter-blur',
      options: POT_ANIMATION_VARIANTS,
      labels: POT_ANIMATION_LABELS,
      onChange: (v) => onPotAnimationChange(v as PotAnimationVariant),
    },
    {
      label: 'Chip Movement',
      value: chipAnimation ?? 'chip-stack',
      options: CHIP_ANIMATION_VARIANTS,
      labels: CHIP_ANIMATION_LABELS,
      onChange: (v) => onChipAnimationChange(v as ChipAnimationVariant),
    },
    {
      label: 'Badge Style',
      value: badgeStyle ?? 'pill-gradient',
      options: BADGE_STYLES,
      labels: BADGE_STYLE_LABELS,
      onChange: (v) => onBadgeStyleChange(v as BadgeStyle),
    },
    {
      label: 'Badge Animation',
      value: badgeAnimation ?? 'none',
      options: BADGE_ANIMATIONS,
      labels: BADGE_ANIMATION_LABELS,
      onChange: (v) => onBadgeAnimationChange(v as BadgeAnimation),
    },
  ]

  return (
    <div
      ref={popoverRef}
      className="absolute top-12 left-3 z-50 w-64 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Visual Effects</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings List */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {settings.map((setting) => (
          <EffectRow key={setting.label} {...setting} />
        ))}

        {/* Experiments Section */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Experiments</span>
          </div>
          <p className="text-[10px] text-white/50 mb-2">
            Test new features. Page will reload when changed.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { value: 'none', label: 'Off' },
              { value: 'cards', label: 'Image Cards' },
              { value: 'badges', label: 'Centered Badges' },
              { value: 'both', label: 'Both' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleExperimentChange(opt.value)}
                className={cn(
                  'h-8 px-2 text-xs font-medium rounded-lg transition-all',
                  currentExperimentOption === opt.value
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-black/20">
        <button
          type="button"
          onClick={() => {
            onRandomize()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium transition-all"
          title="Randomize all effects"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Randomize</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onReplay()
            onClose()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm font-medium transition-all"
          title="Replay hand with current effects"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay</span>
        </button>
      </div>
    </div>
  )
}

export default EffectsSettingsPopover
