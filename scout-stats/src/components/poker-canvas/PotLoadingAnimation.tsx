/**
 * PotLoadingAnimation - Poker-themed loading animations
 *
 * Displays one of 6 random poker-themed loading animations.
 * Selection is deterministic based on handId for consistent experience on replay.
 */

import { useMemo } from 'react'

// =====================
// Types
// =====================

interface PotLoadingAnimationProps {
  /** Hand ID used to deterministically select animation variant */
  handId?: string
  /** Optional message to display below animation */
  message?: string
}

// =====================
// Animation Variants
// =====================

/**
 * 1. Chip Stack - Chips stacking up animation
 */
function ChipStackAnimation() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-20">
        {/* Stacking chips */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-12 h-3 rounded-full"
            style={{
              background: i % 2 === 0
                ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
              bottom: `${i * 6}px`,
              animation: `chipStack 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes chipStack {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(-8px); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

/**
 * 2. Card Shuffle - Cards being shuffled
 */
function CardShuffleAnimation() {
  return (
    <div className="relative w-20 h-24">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute top-0 left-1/2 w-14 h-20 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"
          style={{
            animation: `cardShuffle 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            transformOrigin: 'center bottom',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Card back pattern */}
          <div className="absolute inset-1 rounded border border-blue-400/30 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-400/50 rounded-full" />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes cardShuffle {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-80%) rotate(-15deg); }
          75% { transform: translateX(-20%) rotate(15deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * 3. Spinning Suits - Card suits rotating
 */
function SpinningSuitsAnimation() {
  const suits = ['♠', '♥', '♦', '♣']
  const colors = ['text-white', 'text-red-500', 'text-red-500', 'text-white']

  return (
    <div className="relative w-20 h-20">
      {suits.map((suit, i) => (
        <span
          key={i}
          className={`absolute text-2xl ${colors[i]}`}
          style={{
            animation: `spinSuit 2s linear infinite`,
            animationDelay: `${i * 0.5}s`,
            top: '50%',
            left: '50%',
            transformOrigin: '0 0',
          }}
        >
          {suit}
        </span>
      ))}
      <style>{`
        @keyframes spinSuit {
          0% { transform: rotate(0deg) translateX(24px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(24px) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * 4. Pot Growing - Chips falling into pot
 */
function PotGrowingAnimation() {
  return (
    <div className="relative w-24 h-20">
      {/* Pot base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-lg" />

      {/* Falling chips */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 w-6 h-2 rounded-full"
          style={{
            background: ['#ef4444', '#22c55e', '#3b82f6'][i],
            animation: `chipFall 1.5s ease-in infinite`,
            animationDelay: `${i * 0.5}s`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      ))}
      <style>{`
        @keyframes chipFall {
          0% { transform: translateX(-50%) translateY(-40px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(-50%) translateY(40px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/**
 * 5. Card Flip - Single card flipping to reveal
 */
function CardFlipAnimation() {
  return (
    <div className="relative w-16 h-24" style={{ perspective: '200px' }}>
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          animation: `cardFlip 2s ease-in-out infinite`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card front */}
        <div
          className="absolute inset-0 rounded-lg bg-white flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl text-red-500">A♥</span>
        </div>
        {/* Card back */}
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-1 rounded border border-blue-400/30 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-blue-400/50 rounded-full" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cardFlip {
          0%, 45% { transform: rotateY(0deg); }
          50%, 95% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * 6. Dealer Button Bounce - D button bouncing
 */
function DealerButtonAnimation() {
  return (
    <div className="relative w-20 h-20">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #e5e5e5 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)',
          animation: `dealerBounce 1.5s ease-in-out infinite`,
        }}
      >
        <span
          className="text-2xl font-bold"
          style={{
            color: '#1a1a1a',
            textShadow: '0 1px 1px rgba(255,255,255,0.5)',
          }}
        >
          D
        </span>
      </div>
      {/* Shadow */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full"
        style={{ animation: `dealerShadow 1.5s ease-in-out infinite` }}
      />
      <style>{`
        @keyframes dealerBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
        @keyframes dealerShadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
          50% { transform: translateX(-50%) scale(0.7); opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}

// =====================
// Animation Selector
// =====================

const ANIMATIONS = [
  ChipStackAnimation,
  CardShuffleAnimation,
  SpinningSuitsAnimation,
  PotGrowingAnimation,
  CardFlipAnimation,
  DealerButtonAnimation,
]

/**
 * Get deterministic animation index from handId
 */
function getAnimationIndex(handId?: string): number {
  if (!handId) {
    return Math.floor(Math.random() * ANIMATIONS.length)
  }
  // Sum character codes for more varied distribution
  let sum = 0
  for (let i = 0; i < handId.length; i++) {
    sum += handId.charCodeAt(i)
  }
  return sum % ANIMATIONS.length
}

// =====================
// Main Component
// =====================

export function PotLoadingAnimation({ handId, message = 'Loading hand...' }: PotLoadingAnimationProps) {
  const AnimationComponent = useMemo(() => {
    const index = getAnimationIndex(handId)
    return ANIMATIONS[index]
  }, [handId])

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimationComponent />
      <span className="text-sm font-medium text-white/70 animate-pulse">
        {message}
      </span>
    </div>
  )
}

export default PotLoadingAnimation
