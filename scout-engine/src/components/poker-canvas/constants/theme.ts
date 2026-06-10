import type { ReplayerTheme } from '../types/canvas-types'

export const defaultReplayerTheme: ReplayerTheme = {
  // Table felt - rich green with depth
  feltColor: '#0c6151',
  feltColorDark: '#0a3f37',
  feltTexture: true,
  feltImageUrl: undefined,
  feltImageOpacity: 0.82,
  tableImageUrl: '/poker-table-green.png',
  tableImageOpacity: 1,
  tableImageScale: 0.9,
  // Fixed 10-seat layout - players sit at their actual seat number (0-9)
  // Seat 0 is bottom center (hero), going clockwise around the table
  seatLayout: [
    { x: 50, y: 90, scale: 1.05 },  // 0: bottom center (hero)
    { x: 12, y: 80, scale: 1.00 },   // 1: bottom-left
    { x: 10, y: 60, scale: 0.95 },  // 2: left-lower
    { x: 12, y: 38, scale: 0.90 },  // 3: left-upper
    { x: 20, y: 22, scale: 0.85 },  // 4: top-left
    { x: 80, y: 22, scale: 0.85 },  // 5: top-right
    { x: 88, y: 38, scale: 0.90 },  // 6: right-upper
    { x: 90, y: 60, scale: 0.95 },  // 7: right-lower
    { x: 88, y: 80, scale: 1.00 },   // 8: bottom-right
    { x: 50, y: 11, scale: 0.80 },  // 9: top center
  ],
  // Border - warm wood tones with golden accent
  borderColor: '#8B5A2B',
  borderColorInner: '#D4A76A',
  borderWidth: 14,
  borderGlow: 'rgba(212, 167, 106, 0.4)',
  // Cards
  cardBackColor: '#1e3a5f',
  cardBackPattern: true,
  cardFaceColor: '#ffffff',
  cardBorderColor: 'rgba(0,0,0,0.12)',
  // Typography
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  // Player styling
  playerNameColor: '#ffffff',
  playerBoxColor: 'rgba(20, 30, 50, 0.95)',
  playerBoxBorder: 'rgba(255,255,255,0.08)',
  stackColor: '#fbbf24',
  // Highlights
  activePlayerGlow: 'rgba(251, 191, 36, 0.5)',
  winnerHighlight: 'rgba(34, 197, 94, 0.5)',
  // Shadows
  textShadow: 'rgba(0,0,0,0.5)',
  chipShadow: 'rgba(0,0,0,0.4)',
  // Background
  backgroundColor: '#0f172a',
  // Table shape - portrait orientation (taller than wide)
  tableRadiusX: 38,
  tableRadiusY: 44,
  // Position display - show only dealer chip by default (cleaner look)
  showDealerChipOnly: true,
}
