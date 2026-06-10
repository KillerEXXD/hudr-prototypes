import type { HandReplay, ReplayState, ReplayStep } from '@/types/replay'

export type EasingFunction = (t: number) => number

export interface RendererConfig {
  width: number
  height: number
  backgroundColor?: string
  tableFeltColor?: string
  tableBorderColor?: string
  pixelRatio?: number
}

export interface ReplayerTheme {
  feltColor: string
  feltColorDark: string
  feltTexture: boolean
  feltImageUrl?: string
  feltImageOpacity?: number
  tableImageUrl?: string
  tableImageOpacity?: number
  /** Scale factor (0-1) to shrink/fit the table image inside the canvas without cropping */
  tableImageScale?: number
  /** Fixed 10-seat layout - array of positions for seats 0-9 (bottom center hero going clockwise) */
  seatLayout?: Array<{ x: number; y: number; scale?: number }>
  borderColor: string
  borderColorInner: string
  borderWidth: number
  borderGlow: string
  cardBackColor: string
  cardBackPattern: boolean
  cardFaceColor: string
  cardBorderColor: string
  fontFamily: string
  playerNameColor: string
  playerBoxColor: string
  playerBoxBorder: string
  stackColor: string
  activePlayerGlow: string
  winnerHighlight: string
  textShadow: string
  chipShadow: string
  backgroundColor: string
  // Table shape controls
  tableRadiusX: number // percentage of min(width, height)
  tableRadiusY: number // percentage of min(width, height)
  // Position display: true = show only "D" chip for dealer, false = show all position badges
  showDealerChipOnly: boolean
}

export interface SeatPosition {
  x: number
  y: number
  angle: number
  /** Scale factor for perspective (1.0 = normal, <1 = far/smaller, >1 = near/larger) */
  scale: number
}

export interface AnimationConfig {
  id?: string
  from: number
  to: number
  duration: number
  easing: EasingFunction
  onComplete?: () => void
}

export interface AnimationDriver {
  animate: (key: string, config: AnimationConfig) => string
  update: (now: number) => void
  clear: () => void
  getValue: (key: string, fallback?: number) => number
  hasActiveAnimations: () => boolean
}

/**
 * Experimental features that can be toggled via URL parameters
 * Add `?experiments=imageCards,centeredBadges` to the URL to enable
 */
export interface ExperimentalFeatures {
  /** Use SVG image cards instead of canvas-drawn cards */
  imageCards?: boolean
  /** Center action badges ON the avatar instead of above/below (BUG-179) */
  centeredBadges?: boolean
  /** Card size multiplier (default 1.0, range 0.5-2.0) - for debug mode */
  cardScale?: number
}

export interface LayerRenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  dpr: number
  now: number
  delta: number
  theme: ReplayerTheme
  seatPositions: SeatPosition[]
  step: ReplayStep
  previousStep?: ReplayStep
  state: ReplayState
  animations: AnimationDriver
  handId?: string
  /** Hand number for display in overlay */
  handNumber?: number
  /** Tournament name for display in overlay */
  tournamentName?: string
  /** Override pot counter animation variant (for testing/preview) */
  potAnimationVariant?: PotAnimationVariant
  /** Override pot visual effect variant (for testing/preview) */
  potVisualVariant?: PotVisualVariant
  /** Override action badge variant (for testing/preview) - LEGACY */
  actionBadgeVariant?: ActionBadgeVariant
  /** Override badge style (visual appearance) */
  badgeStyle?: BadgeStyle
  /** Override badge animation (motion effect) */
  badgeAnimation?: BadgeAnimation
  /** Override win animation style (for winner reveal) */
  winAnimationStyle?: WinAnimationStyle
  /** Experimental features enabled via URL params */
  experimentalFeatures?: ExperimentalFeatures
}

export interface CanvasScene {
  hand: HandReplay
  stepIndex: number
  step: ReplayStep
  previousStep?: ReplayStep
}

export type HandReplaySource = string | HandReplay

export interface PlayerRenderProps {
  player: ReplayState['players'][number]
  position: SeatPosition
  showCards: boolean
  isActive: boolean
  isWinner: boolean
  isHighlighted: boolean
  winAmount?: number
  /** When true, show win amount with green styling (phase 3 of win animation) */
  showWinAmount?: boolean
}

export interface PlaybackState {
  isPlaying: boolean
  speed: number
  soundEnabled: boolean
}

// =====================
// Animation Speed Presets
// =====================

/**
 * Speed multiplier presets for animations
 * Lower values = slower animations, Higher values = faster animations
 */
export type AnimationSpeedPreset = 'slowest' | 'slower' | 'slow' | 'medium' | 'fast' | 'faster' | 'fastest'

/** Speed multiplier values for each preset */
export const ANIMATION_SPEED_VALUES: Record<AnimationSpeedPreset, number> = {
  slowest: 0.25,
  slower: 0.5,
  slow: 0.75,
  medium: 1.0,
  fast: 1.5,
  faster: 2.0,
  fastest: 3.0,
}

/** Labels for animation speed presets */
export const ANIMATION_SPEED_LABELS: Record<AnimationSpeedPreset, string> = {
  slowest: 'Slowest (0.25x)',
  slower: 'Slower (0.5x)',
  slow: 'Slow (0.75x)',
  medium: 'Medium (1x)',
  fast: 'Fast (1.5x)',
  faster: 'Faster (2x)',
  fastest: 'Fastest (3x)',
}

/**
 * Individual animation type speed configurations
 * Each can be set independently to test different timing combinations
 */
export interface AnimationSpeeds {
  /** Speed for dealing hole cards to players */
  holeCards: AnimationSpeedPreset
  /** Speed for chip movements (bets, calls, raises going to pot) */
  chipMovement: AnimationSpeedPreset
  /** Speed for community cards (flop, turn, river) */
  communityCards: AnimationSpeedPreset
  /** Speed for pot value changes */
  potChange: AnimationSpeedPreset
  /** Speed for card flip animations */
  cardFlip: AnimationSpeedPreset
}

/** Default animation speeds (all medium) */
export const DEFAULT_ANIMATION_SPEEDS: AnimationSpeeds = {
  holeCards: 'medium',
  chipMovement: 'medium',
  communityCards: 'medium',
  potChange: 'medium',
  cardFlip: 'medium',
}

/** Get the multiplier value for a speed preset */
export function getSpeedMultiplier(preset: AnimationSpeedPreset): number {
  return ANIMATION_SPEED_VALUES[preset]
}

// =====================
// Animation Variant Types
// =====================

/**
 * Pot counter animation variants
 * Controls how the pot value animates when chips are added
 */
export type PotAnimationVariant =
  | 'counter-blur'      // Classic number counter with blur effect
  | 'counter-bounce'    // Counter with bouncy easing
  | 'counter-elastic'   // Counter with elastic overshoot
  | 'counter-scale'     // Counter with scale pulse
  | 'counter-glow'      // Counter with glow intensity
  | 'counter-shake'     // Counter with shake effect

/** All pot animation variants */
export const POT_ANIMATION_VARIANTS: PotAnimationVariant[] = [
  'counter-blur',
  'counter-bounce',
  'counter-elastic',
  'counter-scale',
  'counter-glow',
  'counter-shake',
]

/** Labels for pot animation variants */
export const POT_ANIMATION_LABELS: Record<PotAnimationVariant, string> = {
  'counter-blur': 'Blur',
  'counter-bounce': 'Bounce',
  'counter-elastic': 'Elastic',
  'counter-scale': 'Scale',
  'counter-glow': 'Glow',
  'counter-shake': 'Shake',
}

/**
 * Chip-to-pot animation variants
 * Controls how chips move when collected into the pot
 */
export type ChipAnimationVariant =
  | 'chip-stack'        // Chips stack and bounce
  | 'card-shuffle'      // Chips sway like cards being shuffled
  | 'spinning-suits'    // Chips orbit with spinning motion
  | 'pot-growing'       // Chips fall with gravity into pot
  | 'card-flip'         // Chips flip/tumble toward pot
  | 'dealer-bounce'     // Chips bounce toward pot

/** All chip animation variants */
export const CHIP_ANIMATION_VARIANTS: ChipAnimationVariant[] = [
  'chip-stack',
  'card-shuffle',
  'spinning-suits',
  'pot-growing',
  'card-flip',
  'dealer-bounce',
]

/** Labels for chip animation variants */
export const CHIP_ANIMATION_LABELS: Record<ChipAnimationVariant, string> = {
  'chip-stack': 'Stack',
  'card-shuffle': 'Shuffle',
  'spinning-suits': 'Spiral',
  'pot-growing': 'Arc',
  'card-flip': 'Tumble',
  'dealer-bounce': 'Bounce',
}

/**
 * Pot visual animation variants (from prototype)
 * Controls visual effects when pot updates
 */
export type PotVisualVariant =
  | 'stack-growth'    // Chips physically stack up
  | 'radial-pulse'    // Golden glow pulse with ring ripples
  | 'gravity-drop'    // Chips fall from above with bounce
  | 'chip-burst'      // Chips materialize with scale-up and sparkles
  | 'magnetic-pull'   // Chips shrink at source while pot grows
  | 'ring-fill'       // Circular progress ring fills up
  | 'none'            // No visual effect

/** All pot visual variants */
export const POT_VISUAL_VARIANTS: PotVisualVariant[] = [
  'none',
  'stack-growth',
  'radial-pulse',
  'gravity-drop',
  'chip-burst',
  'magnetic-pull',
  'ring-fill',
]

/** Labels for pot visual variants */
export const POT_VISUAL_LABELS: Record<PotVisualVariant, string> = {
  'none': 'None',
  'stack-growth': 'Stack',
  'radial-pulse': 'Pulse',
  'gravity-drop': 'Drop',
  'chip-burst': 'Burst',
  'magnetic-pull': 'Pull',
  'ring-fill': 'Ring',
}

// =====================
// Deterministic Random Animation Selection
// =====================

/**
 * Hash function for deterministic variant selection
 * Same handId always produces same result
 */
function hashString(str: string, seed: number = 0): number {
  let hash = seed
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Get deterministic pot counter animation variant from handId
 */
export function getRandomPotAnimationVariant(handId?: string): PotAnimationVariant {
  if (!handId) {
    return POT_ANIMATION_VARIANTS[Math.floor(Math.random() * POT_ANIMATION_VARIANTS.length)]
  }
  return POT_ANIMATION_VARIANTS[hashString(handId, 1) % POT_ANIMATION_VARIANTS.length]
}

/**
 * Get deterministic pot visual animation variant from handId
 * Excludes 'none' for automatic selection
 */
export function getRandomPotVisualVariant(handId?: string): PotVisualVariant {
  // Only the actual visual effects (exclude 'none')
  const visualVariants = POT_VISUAL_VARIANTS.filter(v => v !== 'none')
  if (!handId) {
    return visualVariants[Math.floor(Math.random() * visualVariants.length)]
  }
  return visualVariants[hashString(handId, 2) % visualVariants.length]
}

/**
 * Get deterministic chip animation variant from handId
 */
export function getRandomChipAnimationVariant(handId?: string): ChipAnimationVariant {
  if (!handId) {
    return CHIP_ANIMATION_VARIANTS[Math.floor(Math.random() * CHIP_ANIMATION_VARIANTS.length)]
  }
  return CHIP_ANIMATION_VARIANTS[hashString(handId, 3) % CHIP_ANIMATION_VARIANTS.length]
}

// =====================
// Action Badge Types (Style + Animation separated)
// =====================

/**
 * Badge visual style (appearance)
 * Controls how the badge looks visually
 */
export type BadgeStyle =
  | 'pill-gradient'     // Pill with gradient background
  | 'glass-morphism'    // Frosted glass effect
  | 'neon-glow'         // Glowing neon outline
  | 'chip-style'        // Poker chip inspired
  | 'ribbon-banner'     // Banner/ribbon style
  | 'minimal-bold'      // Simple bold text with shadow

/**
 * Badge animation type (motion effect)
 * Controls how the badge animates/moves
 */
export type BadgeAnimation =
  | 'none'              // No animation (static)
  | 'float-fade'        // Float up and fade out
  | 'pop-dissolve'      // Pop in then dissolve
  | 'slide-away'        // Slide to side and fade
  | 'bounce-vanish'     // Bounce then vanish

/** All badge styles */
export const BADGE_STYLES: BadgeStyle[] = [
  'pill-gradient',
  'glass-morphism',
  'neon-glow',
  'chip-style',
  'ribbon-banner',
  'minimal-bold',
]

/** All badge animations */
export const BADGE_ANIMATIONS: BadgeAnimation[] = [
  'none',
  'float-fade',
  'pop-dissolve',
  'slide-away',
  'bounce-vanish',
]

/** Labels for badge styles */
export const BADGE_STYLE_LABELS: Record<BadgeStyle, string> = {
  'pill-gradient': 'Gradient',
  'glass-morphism': 'Glass',
  'neon-glow': 'Neon',
  'chip-style': 'Chip',
  'ribbon-banner': 'Ribbon',
  'minimal-bold': 'Minimal',
}

/** Labels for badge animations */
export const BADGE_ANIMATION_LABELS: Record<BadgeAnimation, string> = {
  'none': 'None',
  'float-fade': 'Float',
  'pop-dissolve': 'Pop',
  'slide-away': 'Slide',
  'bounce-vanish': 'Bounce',
}

/**
 * Get deterministic badge style from handId
 */
export function getRandomBadgeStyle(handId?: string): BadgeStyle {
  if (!handId) {
    return BADGE_STYLES[Math.floor(Math.random() * BADGE_STYLES.length)]
  }
  return BADGE_STYLES[hashString(handId, 10) % BADGE_STYLES.length]
}

/**
 * Get deterministic badge animation from handId
 * Excludes 'none' for automatic selection (gets actual animation)
 */
export function getRandomBadgeAnimation(handId?: string): BadgeAnimation {
  const animations = BADGE_ANIMATIONS.filter(a => a !== 'none')
  if (!handId) {
    return animations[Math.floor(Math.random() * animations.length)]
  }
  return animations[hashString(handId, 11) % animations.length]
}

// =====================
// Legacy Action Badge Variant Types (for backwards compatibility)
// =====================

/**
 * Action badge visual variants (legacy - use BadgeStyle + BadgeAnimation instead)
 * Controls the visual style of action badges (CHECK, CALL, RAISE, etc.)
 */
export type ActionBadgeVariant =
  // Static variants (always visible)
  | 'pill-gradient'     // Pill with gradient background
  | 'glass-morphism'    // Frosted glass effect
  | 'neon-glow'         // Glowing neon outline
  | 'chip-style'        // Poker chip inspired
  | 'ribbon-banner'     // Banner/ribbon style
  | 'minimal-bold'      // Simple bold text with shadow
  // Animated variants (float and disappear)
  | 'float-fade'        // Float up and fade out
  | 'pop-dissolve'      // Pop in then dissolve
  | 'slide-away'        // Slide to side and fade
  | 'bounce-vanish'     // Bounce then vanish

/** Static action badge variants (always visible) */
export const STATIC_ACTION_BADGE_VARIANTS: ActionBadgeVariant[] = [
  'pill-gradient',
  'glass-morphism',
  'neon-glow',
  'chip-style',
  'ribbon-banner',
  'minimal-bold',
]

/** Animated action badge variants (float and disappear) */
export const ANIMATED_ACTION_BADGE_VARIANTS: ActionBadgeVariant[] = [
  'float-fade',
  'pop-dissolve',
  'slide-away',
  'bounce-vanish',
]

/** All action badge variants */
export const ACTION_BADGE_VARIANTS: ActionBadgeVariant[] = [
  ...STATIC_ACTION_BADGE_VARIANTS,
  ...ANIMATED_ACTION_BADGE_VARIANTS,
]

/** Labels for action badge variants */
export const ACTION_BADGE_LABELS: Record<ActionBadgeVariant, string> = {
  'pill-gradient': 'Gradient',
  'glass-morphism': 'Glass',
  'neon-glow': 'Neon',
  'chip-style': 'Chip',
  'ribbon-banner': 'Ribbon',
  'minimal-bold': 'Minimal',
  'float-fade': 'Float',
  'pop-dissolve': 'Pop',
  'slide-away': 'Slide',
  'bounce-vanish': 'Bounce',
}

/**
 * Get deterministic static action badge variant from handId
 */
export function getRandomStaticActionBadgeVariant(handId?: string): ActionBadgeVariant {
  if (!handId) {
    return STATIC_ACTION_BADGE_VARIANTS[Math.floor(Math.random() * STATIC_ACTION_BADGE_VARIANTS.length)]
  }
  return STATIC_ACTION_BADGE_VARIANTS[hashString(handId, 10) % STATIC_ACTION_BADGE_VARIANTS.length]
}

/**
 * Get deterministic animated action badge variant from handId
 */
export function getRandomAnimatedActionBadgeVariant(handId?: string): ActionBadgeVariant {
  if (!handId) {
    return ANIMATED_ACTION_BADGE_VARIANTS[Math.floor(Math.random() * ANIMATED_ACTION_BADGE_VARIANTS.length)]
  }
  return ANIMATED_ACTION_BADGE_VARIANTS[hashString(handId, 11) % ANIMATED_ACTION_BADGE_VARIANTS.length]
}

// =====================
// Win Animation Types
// =====================

/**
 * Win animation style variants
 * Controls how the winner's cards and badge animate when revealed
 *
 * Based on prototypes:
 * - shrink-settle: Cards shrink to 50% and settle below avatar with WIN badge underneath
 * - burst-glow: Cards burst up with golden glow, then settle at 45% with radiating sparkles
 * - cinematic-zoom: Cards zoom in dramatically, then shrink to 40% with "WINNER!" text flash
 */
export type WinAnimationStyle =
  | 'shrink-settle'    // Prototype 1: Smooth shrink to avatar with cards settling below
  | 'burst-glow'       // Prototype 2: Burst up with golden glow and sparkles
  | 'cinematic-zoom'   // Prototype 4: Dramatic zoom in then shrink with text

/** All win animation styles */
export const WIN_ANIMATION_STYLES: WinAnimationStyle[] = [
  'shrink-settle',
  'burst-glow',
  'cinematic-zoom',
]

/** Labels for win animation styles */
export const WIN_ANIMATION_LABELS: Record<WinAnimationStyle, string> = {
  'shrink-settle': 'Settle',
  'burst-glow': 'Burst',
  'cinematic-zoom': 'Zoom',
}

/**
 * Get deterministic win animation style from handId
 */
export function getRandomWinAnimationStyle(handId?: string): WinAnimationStyle {
  if (!handId) {
    return WIN_ANIMATION_STYLES[Math.floor(Math.random() * WIN_ANIMATION_STYLES.length)]
  }
  return WIN_ANIMATION_STYLES[hashString(handId, 20) % WIN_ANIMATION_STYLES.length]
}
