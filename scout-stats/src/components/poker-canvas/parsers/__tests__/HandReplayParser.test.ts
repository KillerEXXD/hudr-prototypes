import { describe, it, expect } from 'vitest'
import { sampleHandReplay } from '@/data/sampleHandReplay'
import type { HandReplay } from '@/types/replay'
import { parseHandReplay } from '../HandReplayParser'

describe('parseHandReplay', () => {
  it('returns a valid HandReplay for valid input', () => {
    const result = parseHandReplay(sampleHandReplay)
    expect(result.handId).toBe(sampleHandReplay.handId)
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.createdAt).toBeInstanceOf(Date)
  })

  it('throws when steps array is empty', () => {
    const emptySteps: HandReplay = {
      ...sampleHandReplay,
      steps: [],
    }
    expect(() => parseHandReplay(emptySteps)).toThrow('Hand replay has no steps')
  })

  it('throws when steps is undefined', () => {
    const noSteps = {
      ...sampleHandReplay,
      steps: undefined,
    } as unknown as HandReplay
    expect(() => parseHandReplay(noSteps)).toThrow('Hand replay has no steps')
  })

  it('converts string createdAt to Date', () => {
    const withStringDate: HandReplay = {
      ...sampleHandReplay,
      createdAt: '2025-01-15T12:00:00Z' as unknown as Date,
    }
    const result = parseHandReplay(withStringDate)
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})
