import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FinishedIcon } from './FinishedIcon'

describe('FinishedIcon', () => {
  it('is decorative (aria-hidden, so a paired "Finished" label owns the name) and tints via currentColor', () => {
    const { container } = render(<FinishedIcon />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('is always static — it injects no animation keyframes (Finished is never in progress)', () => {
    const { container } = render(<FinishedIcon />)
    expect(container.querySelector('style')).toBeNull()
    // the circled-check (the "done" mark) is present
    expect(container.querySelector('circle')).not.toBeNull()
  })

  it('respects an explicit size', () => {
    const { container } = render(<FinishedIcon size={14} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('14')
    expect(svg.getAttribute('height')).toBe('14')
  })
})
