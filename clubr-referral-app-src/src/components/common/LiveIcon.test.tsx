import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LiveIcon } from './LiveIcon'

describe('LiveIcon', () => {
  it('is decorative (aria-hidden, so a paired "Live" label owns the name) with a red centre dot', () => {
    const { container } = render(<LiveIcon />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('circle')!.getAttribute('fill')).toMatch(/accent-red/)
  })

  it('animates (injects the keyframes) only when a game is in progress; passive otherwise', () => {
    expect(render(<LiveIcon animate />).container.querySelector('style')).not.toBeNull()
    expect(render(<LiveIcon animate={false} />).container.querySelector('style')).toBeNull()
  })
})
