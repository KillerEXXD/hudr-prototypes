import { buildProfile } from '@/engine'
import type { PlayerProfile, StatFilters } from '@/engine'
import { getPlayer, getPlayerStats } from './players'

// Orchestrates the engine: fetch player + filtered raw stats (mock or live),
// then run Layers 1–4 with the active table-size context (adaptive typing).
export async function getPlayerProfile(id: string, filters?: StatFilters): Promise<PlayerProfile> {
  const [player, raw] = await Promise.all([getPlayer(id), getPlayerStats(id, filters)])
  if (!player) throw new Error(`Player not found: ${id}`)
  return buildProfile({ id: player.id, name: player.name }, raw, { tableSize: filters?.tableSize })
}
