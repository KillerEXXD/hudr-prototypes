/**
 * Player Color & Flag Utilities
 *
 * Pure utility functions for generating player avatar colors,
 * country flag emoji lookups, and position color mapping.
 */

import type { ReplayPlayer } from '@/types/replay'

export function generateAvatarColor(player: ReplayPlayer): string {
  const seed = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = seed % 360
  return `hsl(${hue}deg 60% 50%)`
}

export function lighten(color: string, amount: number): string {
  if (color.startsWith('hsl')) {
    return color.replace(/(\d+)%\)$/, (_, l) => `${Math.min(100, parseInt(l) + amount * 100)}%)`)
  }
  return color
}

/** Flag emoji mapping for common country codes */
export const countryFlags: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', USA: '\u{1F1FA}\u{1F1F8}',
  GB: '\u{1F1EC}\u{1F1E7}', UK: '\u{1F1EC}\u{1F1E7}',
  CA: '\u{1F1E8}\u{1F1E6}',
  AU: '\u{1F1E6}\u{1F1FA}',
  DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}',
  ES: '\u{1F1EA}\u{1F1F8}',
  IT: '\u{1F1EE}\u{1F1F9}',
  BR: '\u{1F1E7}\u{1F1F7}',
  MX: '\u{1F1F2}\u{1F1FD}',
  JP: '\u{1F1EF}\u{1F1F5}',
  CN: '\u{1F1E8}\u{1F1F3}',
  KR: '\u{1F1F0}\u{1F1F7}',
  IN: '\u{1F1EE}\u{1F1F3}',
  RU: '\u{1F1F7}\u{1F1FA}',
  PL: '\u{1F1F5}\u{1F1F1}',
  NL: '\u{1F1F3}\u{1F1F1}',
  SE: '\u{1F1F8}\u{1F1EA}',
  NO: '\u{1F1F3}\u{1F1F4}',
  DK: '\u{1F1E9}\u{1F1F0}',
  FI: '\u{1F1EB}\u{1F1EE}',
  PT: '\u{1F1F5}\u{1F1F9}',
  AT: '\u{1F1E6}\u{1F1F9}',
  CH: '\u{1F1E8}\u{1F1ED}',
  BE: '\u{1F1E7}\u{1F1EA}',
  IE: '\u{1F1EE}\u{1F1EA}',
  AR: '\u{1F1E6}\u{1F1F7}',
  CL: '\u{1F1E8}\u{1F1F1}',
  CO: '\u{1F1E8}\u{1F1F4}',
  PH: '\u{1F1F5}\u{1F1ED}',
  TH: '\u{1F1F9}\u{1F1ED}',
  VN: '\u{1F1FB}\u{1F1F3}',
  ID: '\u{1F1EE}\u{1F1E9}',
  MY: '\u{1F1F2}\u{1F1FE}',
  SG: '\u{1F1F8}\u{1F1EC}',
  NZ: '\u{1F1F3}\u{1F1FF}',
  ZA: '\u{1F1FF}\u{1F1E6}',
  EG: '\u{1F1EA}\u{1F1EC}',
  IL: '\u{1F1EE}\u{1F1F1}',
  AE: '\u{1F1E6}\u{1F1EA}',
  TR: '\u{1F1F9}\u{1F1F7}',
  GR: '\u{1F1EC}\u{1F1F7}',
  CZ: '\u{1F1E8}\u{1F1FF}',
  HU: '\u{1F1ED}\u{1F1FA}',
  RO: '\u{1F1F7}\u{1F1F4}',
  UA: '\u{1F1FA}\u{1F1E6}',
}
