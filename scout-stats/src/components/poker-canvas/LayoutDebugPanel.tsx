/**
 * Layout Debug Panel
 *
 * A floating panel for testing player layout positioning across
 * different table sizes (2-9 players).
 */

import { useState, useCallback } from 'react'
import { X, Grid3X3, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LayoutDebugConfig, DebugScenario, CardSizeOption } from './utils/layoutDebugMockData'
import { defaultDebugConfig } from './utils/layoutDebugMockData'

interface LayoutDebugPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (config: LayoutDebugConfig) => void
  initialConfig?: LayoutDebugConfig
}

export function LayoutDebugPanel({
  isOpen,
  onClose,
  onApply,
  initialConfig = defaultDebugConfig,
}: LayoutDebugPanelProps) {
  const [config, setConfig] = useState<LayoutDebugConfig>(initialConfig)

  const handlePlayerCountChange = useCallback((count: number) => {
    setConfig(prev => ({ ...prev, playerCount: count }))
  }, [])

  const handleScenarioChange = useCallback((scenario: DebugScenario) => {
    setConfig(prev => ({
      ...prev,
      scenario,
      // Auto-enable win amounts and hand info for showdown/mixed
      showWinAmounts: (scenario === 'showdown' || scenario === 'mixed') ? true : prev.showWinAmounts,
      showHandInfo: (scenario === 'showdown' || scenario === 'mixed') ? true : prev.showHandInfo,
    }))
  }, [])

  const handleCardSizeChange = useCallback((size: CardSizeOption) => {
    setConfig(prev => ({ ...prev, cardSize: size }))
  }, [])

  const handleToggle = useCallback((key: keyof LayoutDebugConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleApply = useCallback(() => {
    onApply(config)
  }, [config, onApply])

  if (!isOpen) return null

  return (
    <div
      className="absolute top-12 left-3 z-[60] w-72 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white text-sm">Layout Debug</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Player Count */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Table Size (Players)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8, 9].map(count => (
              <button
                key={count}
                type="button"
                onClick={() => handlePlayerCountChange(count)}
                className={cn(
                  "py-2 rounded-lg text-sm font-semibold transition-all",
                  config.playerCount === count
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Scenario
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { value: 'all-betting', label: 'Betting' },
              { value: 'showdown', label: 'Showdown' },
              { value: 'mixed', label: 'Mixed' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleScenarioChange(value)}
                className={cn(
                  "py-2 rounded-lg text-xs font-medium transition-all",
                  config.scenario === value
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Size */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Card Size
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { value: 'S', label: 'S', desc: '0.75x' },
              { value: 'M', label: 'M', desc: '1x' },
              { value: 'L', label: 'L', desc: '1.25x' },
              { value: 'XL', label: 'XL', desc: '1.5x' },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleCardSizeChange(value)}
                className={cn(
                  "py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center",
                  config.cardSize === value
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Show Elements
          </label>
          <div className="space-y-2">
            {([
              { key: 'useImageCards', label: 'Use Image Cards (SVG)' },
              { key: 'showHandInfo', label: 'Hand # & Tournament' },
              { key: 'showBets', label: 'Current Bets' },
              { key: 'showActionBadges', label: 'Action Badges' },
              { key: 'showWinAmounts', label: 'Win Amounts' },
              { key: 'showHoleCards', label: 'Hole Cards' },
              { key: 'showStacks', label: 'Stack Amounts' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleToggle(key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all",
                  config[key]
                    ? "bg-green-600/20 border border-green-500/30"
                    : "bg-white/5 border border-white/10"
                )}
              >
                <span className="text-xs text-white/80">{label}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-all",
                    config[key]
                      ? "bg-green-500"
                      : "bg-white/10"
                  )}
                >
                  {config[key] && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
