/** @vitest-environment happy-dom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { sampleHandReplay } from '@/data/sampleHandReplay'
import type { HandReplay } from '@/types/replay'
import { useCanvasReplayer } from './useCanvasReplayer'

describe('useCanvasReplayer', () => {
  it('only calls onStepChange when the step changes', async () => {
    const onStepChange = vi.fn()

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
      {
        initialProps: {
          handData: sampleHandReplay,
          dimensions: { width: 360, height: 640 },
          onStepChange,
        },
      }
    )

    await waitFor(() => expect(onStepChange).toHaveBeenCalledTimes(1))

    onStepChange.mockClear()
    act(() => {
      result.current.next()
    })
    await waitFor(() => expect(onStepChange).toHaveBeenCalledTimes(1))

    onStepChange.mockClear()
    rerender({
      handData: sampleHandReplay,
      dimensions: { width: 420, height: 700 },
      onStepChange,
    })

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('reclamps autoplay delay after speeding up mid-hand', async () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(
        (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
        {
          initialProps: {
            handData: sampleHandReplay,
            dimensions: { width: 360, height: 640 },
            autoplay: true,
            initialSpeed: 0.5,
          },
        }
      )

      await act(async () => {})
      expect(result.current.isPlaying).toBe(true)
      expect(result.current.totalSteps).toBeGreaterThan(1)

      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(result.current.scene?.stepIndex ?? 0).toBe(0)

      act(() => {
        result.current.setSpeed(3)
      })
      await act(async () => {})
      expect(result.current.speed).toBeCloseTo(3)
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      act(() => {
        result.current.animationEngine.clear()
      })

      act(() => {
        vi.advanceTimersByTime(450)
      })

      expect(result.current.scene?.stepIndex ?? 0).toBeGreaterThanOrEqual(1)
    } finally {
      vi.useRealTimers()
    }
  })
})

// =====================
// Error Handling Tests
// =====================

describe('useCanvasReplayer error handling', () => {
  it('sets parseError when hand data has no steps', async () => {
    const onError = vi.fn()
    const emptyStepsHand: HandReplay = {
      ...sampleHandReplay,
      steps: [],
    }

    const { result } = renderHook(
      (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
      {
        initialProps: {
          handData: emptyStepsHand,
          dimensions: { width: 360, height: 640 },
          onError,
        },
      }
    )

    await waitFor(() => expect(result.current.parseError).not.toBeNull())
    expect(result.current.parseError?.message).toBe('Hand replay has no steps')
    expect(result.current.scene).toBeNull()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('returns null scene for empty steps', async () => {
    const emptyStepsHand: HandReplay = {
      ...sampleHandReplay,
      steps: [],
    }

    const { result } = renderHook(
      (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
      {
        initialProps: {
          handData: emptyStepsHand,
          dimensions: { width: 360, height: 640 },
        },
      }
    )

    await waitFor(() => expect(result.current.parseError).not.toBeNull())
    expect(result.current.scene).toBeNull()
    expect(result.current.totalSteps).toBe(0)
  })

  it('clears parseError when valid data is provided after error', async () => {
    const emptyStepsHand: HandReplay = {
      ...sampleHandReplay,
      steps: [],
    }

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
      {
        initialProps: {
          handData: emptyStepsHand as Parameters<typeof useCanvasReplayer>[0]['handData'],
          dimensions: { width: 360, height: 640 },
        },
      }
    )

    await waitFor(() => expect(result.current.parseError).not.toBeNull())

    // Provide valid data
    rerender({
      handData: sampleHandReplay,
      dimensions: { width: 360, height: 640 },
    })

    await waitFor(() => expect(result.current.parseError).toBeNull())
    expect(result.current.scene).not.toBeNull()
    expect(result.current.totalSteps).toBeGreaterThan(0)
  })

  it('invokes onError callback on parse failure', async () => {
    const onError = vi.fn()
    // Pass an object with undefined steps to trigger validation error in parseHandReplay
    const invalidData = {
      ...sampleHandReplay,
      steps: undefined,
    } as unknown as HandReplay

    const { result } = renderHook(
      (props: Parameters<typeof useCanvasReplayer>[0]) => useCanvasReplayer(props),
      {
        initialProps: {
          handData: invalidData,
          dimensions: { width: 360, height: 640 },
          onError,
        },
      }
    )

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(result.current.parseError).not.toBeNull()
    expect(result.current.scene).toBeNull()
  })
})
