import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { FloatingCreateClubButton } from './FloatingCreateClubButton'

describe('FloatingCreateClubButton', () => {
  it('renders a create-club puck portaled to body, stacked above Feedback (bottom-36), fires onClick', () => {
    const onClick = vi.fn()
    render(<FloatingCreateClubButton onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Create your own club' })
    expect(document.body.contains(btn)).toBe(true) // portaled (escapes the page transform)
    expect(btn.className).toContain('bottom-36')   // above the Feedback puck (bottom-20)
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('hides while the page scrolls, then reappears once it settles (chat-puck pattern)', () => {
    vi.useFakeTimers()
    render(<FloatingCreateClubButton onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Create your own club' })
    expect(btn.className).toContain('opacity-100')

    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(btn.className).toContain('opacity-0') // hidden while scrolling

    act(() => { vi.advanceTimersByTime(300) })
    expect(btn.className).toContain('opacity-100') // back after it settles
    vi.useRealTimers()
  })
})
