import type { HandReplay } from '@/types/replay'

export function parseHandReplay(input: HandReplay): HandReplay {
  if (!input.steps || input.steps.length === 0) {
    throw new Error('Hand replay has no steps')
  }
  return {
    ...input,
    createdAt: input.createdAt instanceof Date ? input.createdAt : new Date(input.createdAt),
  }
}
