import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Plus } from 'lucide-react'
import { FloatingPuck } from './FloatingPuck'

describe('FloatingPuck', () => {
  it('portals to body, carries its aria-label + hover label, and fires onClick', () => {
    const onClick = vi.fn()
    render(<FloatingPuck icon={Plus} label="Create club" ariaLabel="Create your own club" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Create your own club' })
    expect(document.body.contains(btn)).toBe(true)       // portaled (escapes the page transform)
    expect(screen.getByText('Create club')).toBeInTheDocument() // label (revealed on hover via CSS)
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('hides while the page scrolls and reappears once it settles', () => {
    vi.useFakeTimers()
    render(<FloatingPuck icon={Plus} label="X" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'X' })
    expect(btn.className).toContain('opacity-100')
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(btn.className).toContain('opacity-0')
    act(() => { vi.advanceTimersByTime(300) })
    expect(btn.className).toContain('opacity-100')
    vi.useRealTimers()
  })
})
